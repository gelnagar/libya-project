"""Propose landmarks between a declassified film overview and a reference picture with a learned feature matcher.

Hand-marking 20 landmarks a frame is slow, and classic matching (SIFT, correlation) fails between 1970s film and today's
imagery. LoFTR (Kornia) matches pictures that differ in era, tone and viewing angle, so it is tried here.

Needs: archive/maps/seeds/<id>.json, a few hand-marked landmarks [overview x, overview y, lon, lat], to say roughly where
the frame is; and archive/maps/preview/usgs/<id>.json (its "overview" url, made by usgs-download.py).
The overview is warped onto the reference grid with a global affine fitted to the seeds, cut into overlapping patches,
and each patch is matched (LoFTR, then a RANSAC homography per patch keeps only matches that agree). Matches become
[overview x, overview y, lon, lat, confidence] candidates in archive/maps/matches/<id>-<reference>.json.
Candidates are proposals: they are reviewed against the picture before use.

  python3 scripts/usgs-match.py <id> [references: esri, layers] [--matcher loftr|sift]
References: esri = today's imagery; layers = the already-aligned film layers in public/maps (same kind of picture)."""
import concurrent.futures, glob, json, math, os, sys, time, urllib.request
import cv2
import numpy as np

Z = 16
AOI = (13.04, 32.72, 13.38, 32.95)
ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)'
WORK = os.environ.get('USGS_WORK', 'work/match')
M_PER_PX = 156543.03392 * math.cos(math.radians(32.85)) / 2 ** Z
LAYERS = os.environ.get('MATCH_LAYERS', 'kh9-1972-nov,kh9-1983').split(',')   # aligned film layers used as the "layers" reference
STEP = 1.25          # reference pixels per patch pixel (about 3 m)
PATCH = 768          # patch size, pixels (about 2.3 km)
SPACING_M = 1100     # distance between patch centres, metres
MIN_INLIERS = 18
CLAHE = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

def ll2px(lon, lat):
    n = 256 * 2 ** Z
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n

def px2ll(x, y):
    n = 256 * 2 ** Z
    return x / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))

def esri_reference():
    x0, y0 = ll2px(AOI[0], AOI[3]); x1, y1 = ll2px(AOI[2], AOI[1])
    tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
    img = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.uint8)
    cache = os.path.join(WORK, 'esri'); os.makedirs(cache, exist_ok=True)
    def get(t):
        tx, ty = t; p = f'{cache}/{Z}-{tx}-{ty}.jpg'
        for attempt in range(4):
            if os.path.exists(p): break
            try:
                with urllib.request.urlopen(urllib.request.Request(ESRI.format(z=Z, x=tx, y=ty), headers={'User-Agent': UA}), timeout=60) as r:
                    open(p, 'wb').write(r.read())
            except Exception:
                time.sleep(2 + attempt * 3)
        return t, cv2.imread(p, cv2.IMREAD_GRAYSCALE) if os.path.exists(p) else None
    tiles = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        for (tx, ty), a in ex.map(get, tiles):
            if a is not None and a.shape == (256, 256): img[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = a
    return img, (tx0 * 256, ty0 * 256)

def layer_reference(shape, origin):
    comp = np.zeros(shape, np.uint8)
    for lay in LAYERS:
        for p in glob.glob(f'public/maps/{lay}/{Z}/*/*.webp'):
            y = int(os.path.splitext(os.path.basename(p))[0]); x = int(os.path.basename(os.path.dirname(p)))
            a = cv2.imread(p, cv2.IMREAD_UNCHANGED)
            if a is None: continue
            g = a[:, :, 0] if a.ndim == 3 else a
            al = a[:, :, 3] if a.ndim == 3 and a.shape[2] == 4 else np.full(g.shape, 255, np.uint8)
            px, py = x * 256 - origin[0], y * 256 - origin[1]
            if px < 0 or py < 0 or px + 256 > shape[1] or py + 256 > shape[0]: continue
            r = comp[py:py + 256, px:px + 256]; r[al > 0] = g[al > 0]
    return comp

def make_matcher(kind):
    """Returns f(film_patch, ref_patch) -> (points in film patch, points in ref patch, confidence), all numpy."""
    if kind == 'sift':
        sift = cv2.SIFT_create(nfeatures=8000, contrastThreshold=0.01)
        flann = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=64))
        def run(a, b):
            ka, da = sift.detectAndCompute(a, None); kb, db = sift.detectAndCompute(b, None)
            if da is None or db is None or len(ka) < 8 or len(kb) < 8: return np.empty((0, 2)), np.empty((0, 2)), np.empty(0)
            good = [m for m, *r in flann.knnMatch(da, db, k=2) if r and m.distance < 0.8 * r[0].distance]
            return (np.float32([ka[m.queryIdx].pt for m in good]).reshape(-1, 2), np.float32([kb[m.trainIdx].pt for m in good]).reshape(-1, 2),
                    np.array([1 - m.distance / 400 for m in good]))
        return run
    import torch
    import kornia.feature as KF
    torch.set_num_threads(os.cpu_count() or 2)
    m = KF.LoFTR(pretrained='outdoor').eval()
    def run(a, b):
        ta = torch.from_numpy(a)[None, None].float() / 255; tb = torch.from_numpy(b)[None, None].float() / 255
        with torch.no_grad():
            o = m({'image0': ta, 'image1': tb})
        return o['keypoints0'].numpy(), o['keypoints1'].numpy(), o['confidence'].numpy()
    return run

def download(url, dest):
    if os.path.exists(dest): return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=600) as r, open(dest + '.part', 'wb') as f:
        while chunk := r.read(8 << 20): f.write(chunk)
    os.replace(dest + '.part', dest)
    return dest

def hull_centres(R, margin_px, spacing_px, shape):
    """Patch centres (reference px) on a grid over the seeds' bounding region, padded by margin."""
    lo, hi = R.min(0) - margin_px, R.max(0) + margin_px
    xs = np.arange(max(lo[0], PATCH * STEP / 2), min(hi[0], shape[1] - PATCH * STEP / 2), spacing_px)
    ys = np.arange(max(lo[1], PATCH * STEP / 2), min(hi[1], shape[0] - PATCH * STEP / 2), spacing_px)
    return [(x, y) for y in ys for x in xs]

def match_frame(fid, refname, matcher, ov, seeds):
    esri, origin = esri_reference()
    ref = esri if refname == 'esri' else layer_reference(esri.shape, origin)
    C = seeds[:, :2]
    R = np.array([[a - origin[0], b - origin[1]] for a, b in (ll2px(lo, la) for lo, la in seeds[:, 2:4])])
    # reference px -> film overview px, global affine through the seeds
    X = np.c_[R, np.ones(len(R))]
    coef, *_ = np.linalg.lstsq(X, C, rcond=None); A = coef.T          # 2x3
    res = np.hypot(*(X @ coef - C).T)
    print(fid, refname, f'seed affine: {len(seeds)} landmarks, residual median {np.median(res):.0f} overview px')
    centres = hull_centres(R, 1500 / M_PER_PX, SPACING_M / M_PER_PX, ref.shape)
    out, stats = [], []
    for ci, (cx, cy) in enumerate(centres):
        px0, py0 = cx - PATCH * STEP / 2, cy - PATCH * STEP / 2
        crop = ref[int(py0):int(py0 + PATCH * STEP), int(px0):int(px0 + PATCH * STEP)]
        if crop.shape[0] < 10 or (crop > 0).mean() < 0.6: continue        # little or no reference here
        rp = cv2.resize(crop, (PATCH, PATCH), interpolation=cv2.INTER_AREA)
        M = np.c_[A[:, :2] * STEP, A @ [px0, py0, 1.0]]                    # patch px -> film overview px
        fp = cv2.warpAffine(ov, M, (PATCH, PATCH), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP, borderValue=0)
        if (fp > 0).mean() < 0.6 or fp.std() < 8: continue
        k0, k1, conf = matcher(CLAHE.apply(fp), CLAHE.apply(rp))
        n0 = len(k0)
        if n0 < MIN_INLIERS: stats.append((ci, n0, 0)); continue
        H, mask = cv2.findHomography(k0, k1, cv2.USAC_MAGSAC, 5.0)
        inl = int(mask.sum()) if mask is not None else 0
        stats.append((ci, n0, inl))
        print(f'  patch {ci}/{len(centres)}: {n0} matches, {inl} agree')
        if H is None or inl < MIN_INLIERS: continue
        for p, q, c in zip(k0[mask.ravel() > 0], k1[mask.ravel() > 0], conf[mask.ravel() > 0]):
            fx, fy = M @ [p[0], p[1], 1.0]
            lon, lat = px2ll(px0 + q[0] * STEP + origin[0], py0 + q[1] * STEP + origin[1])
            out.append([round(float(fx), 1), round(float(fy), 1), round(lon, 6), round(lat, 6), round(float(c), 3), ci])
    # thin: one candidate per ~120 m cell, keeping the most confident
    keep = {}
    for o in out:
        gx, gy = ll2px(o[2], o[3]); key = (int(gx // (120 / M_PER_PX)), int(gy // (120 / M_PER_PX)))
        if key not in keep or o[4] > keep[key][4]: keep[key] = o
    thin = sorted(keep.values(), key=lambda o: -o[4])
    return thin, {'patches': len(centres), 'matched_patches': sum(1 for s in stats if s[2] >= MIN_INLIERS), 'raw': len(out), 'kept': len(thin),
                  'seed_residual_median_px': round(float(np.median(res)), 1)}

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    kind = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--matcher=')), 'loftr')
    fid = args[0]; refs = args[1:] or ['esri', 'layers']
    meta = json.load(open(f'archive/maps/preview/usgs/{fid}.json'))
    ov = cv2.imread(download(meta['overview']['url'], f'{WORK}/{fid}-overview.jpg'), cv2.IMREAD_GRAYSCALE)
    seeds = np.array(json.load(open(f'archive/maps/seeds/{fid}.json')), float)
    print(fid, 'overview', ov.shape, 'seeds', len(seeds), 'matcher', kind)
    matcher = make_matcher(kind)
    os.makedirs('archive/maps/matches', exist_ok=True)
    for refname in refs:
        t = time.time()
        cands, info = match_frame(fid, refname, matcher, ov, seeds)
        info.update({'matcher': kind, 'reference': refname, 'seconds': round(time.time() - t)})
        json.dump({'info': info, 'candidates': cands}, open(f'archive/maps/matches/{fid}-{refname}-{kind}.json', 'w'), indent=0)
        print(fid, refname, info)

if __name__ == '__main__':
    main()
