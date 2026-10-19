"""Line up the declassified satellite cut-outs with today's imagery automatically, so nobody has to click control points.

For each satellite overlay in archive/maps/overlays.json that has a cut-out but no "gcps":
1. Builds a reference picture of Tripoli from Esri World Imagery at zoom 16 (about 2 m a pixel).
2. Global match: SIFT features on both pictures at about 10 m a pixel, matched and filtered with RANSAC, give a first
   projective guess. Old and new Tripoli differ a lot; the old city, the coast, the harbour and the main roads still agree.
3. Local match: the cut-out is split into a grid. In every cell, features are matched again at full reference detail,
   inside the window the first guess predicts, and the cell centre becomes one control point if enough of them agree.
4. A second-order polynomial is fitted through the points, outliers are dropped, and the leave-one-out error is reported
   in metres. The points go into overlays.json, where build-overlays.sh warps and tiles the image.
5. Writes archive/maps/preview/usgs/<id>-check.jpg, a checkerboard of the warped frame against today's imagery.
Frames that do not reach MIN_POINTS keep no gcps and are listed in the status file for hand placement."""
import concurrent.futures, datetime, json, math, os, time, urllib.request
import cv2
import numpy as np
from osgeo import gdal

gdal.UseExceptions()
Z = 16
AOI = (13.04, 32.72, 13.38, 32.95)  # lon0, lat0, lon1, lat1: reference picture
CITY = (13.09, 32.78, 13.32, 32.92)  # the part of each frame that is cut out and tiled (Tripoli as it was in the 1970s-80s)
ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)'
WORK = os.environ.get('USGS_WORK', 'work/usgs')
PREV = 'archive/maps/preview/usgs'
COARSE = 4         # reference pixels per coarse pixel (about 8 m)
GRID = 12          # local cells per side of the cut-out
CELL_M = 1600      # ground width of each local window, metres
MIN_POINTS = 12
M_PER_PX = 156543.03392 * math.cos(math.radians(32.85)) / 2 ** Z

def ll2px(lon, lat):
    n = 256 * 2 ** Z
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n

def px2ll(x, y):
    n = 256 * 2 ** Z
    return x / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))

_REF = None
def reference():
    global _REF
    if _REF is not None: return _REF
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
    print('reference', img.shape, 'from', len(tiles), 'tiles')
    _REF = img, (tx0 * 256, ty0 * 256)
    return _REF

SIFT = cv2.SIFT_create(nfeatures=30000, contrastThreshold=0.02)
CLAHE = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

def feats(a):
    return SIFT.detectAndCompute(CLAHE.apply(a), None)

def match(fa, fb, ratio=0.8):
    (ka, da), (kb, db) = fa, fb
    if da is None or db is None or len(ka) < 8 or len(kb) < 8: return np.empty((0, 2)), np.empty((0, 2))
    pairs = cv2.BFMatcher(cv2.NORM_L2).knnMatch(da, db, k=2)
    good = [m for m, *n in pairs if n and m.distance < ratio * n[0].distance]
    return np.float32([ka[m.queryIdx].pt for m in good]), np.float32([kb[m.trainIdx].pt for m in good])

def apply_h(H, pts):
    p = np.c_[pts, np.ones(len(pts))] @ H.T
    return p[:, :2] / p[:, 2:]

def poly_terms(p):
    x, y = p[:, 0], p[:, 1]
    return np.c_[np.ones_like(x), x, y, x * x, x * y, y * y]

def fit_poly(src, dst):
    sx, sy = src.mean(0), src.std(0) + 1e-9  # scale for a well-conditioned fit
    A = poly_terms((src - sx) / sy)
    coef, *_ = np.linalg.lstsq(A, dst, rcond=None)
    return lambda p: poly_terms((np.asarray(p, float) - sx) / sy) @ coef

def locate(preview, frame_px_per_preview_px):
    """Find Tripoli on a whole-frame preview. Returns the CITY window in preview pixels as [x, y, w, h], and how many matches agreed."""
    ref, origin = reference()
    ref_c = cv2.resize(ref, None, fx=1 / 8, fy=1 / 8, interpolation=cv2.INTER_AREA)  # about 16 m a pixel
    fr = feats(ref_c); best = None
    for guess_m in (1.0, 0.6, 1.8):
        f = 8 * M_PER_PX / (guess_m * frame_px_per_preview_px)  # ref_c px per preview px
        small = cv2.resize(preview, None, fx=f, fy=f, interpolation=cv2.INTER_AREA if f < 1 else cv2.INTER_LINEAR)
        a, b = match(feats(small), fr)
        if len(a) < 10: continue
        Hc, mask = cv2.findHomography(a, b, cv2.RANSAC, 4.0, maxIters=20000, confidence=0.999)
        n = int(mask.sum()) if mask is not None else 0
        print('locate at', guess_m, 'm/px:', len(a), 'pairs,', n, 'agree')
        if Hc is not None and (best is None or n > best[0]): best = (n, Hc, f)
    if not best or best[0] < 15: return None, best[0] if best else 0
    n, Hc, f = best
    corners = np.array([ll2px(CITY[0], CITY[3]), ll2px(CITY[2], CITY[3]), ll2px(CITY[2], CITY[1]), ll2px(CITY[0], CITY[1])]) - origin
    pv = apply_h(np.linalg.inv(Hc), corners / 8) / f
    x0, y0 = np.floor(pv.min(0)); x1, y1 = np.ceil(pv.max(0))
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(preview.shape[1], x1), min(preview.shape[0], y1)
    if x1 - x0 < 50 or y1 - y0 < 50: return None, n
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], n

def read_cut(ds, x, y, w, h, scale):
    """Read a window of the cut-out, resampled by scale (output px per cut px)."""
    x, y = max(0, int(x)), max(0, int(y)); w, h = min(ds.RasterXSize - x, int(w)), min(ds.RasterYSize - y, int(h))
    if w < 32 or h < 32: return None, x, y
    a = ds.GetRasterBand(1).ReadAsArray(x, y, w, h, buf_xsize=max(1, round(w * scale)), buf_ysize=max(1, round(h * scale)))
    return a.astype(np.uint8), x, y

def register(oid, cut_path, ref, origin):
    ds = gdal.Open(cut_path); W, H = ds.RasterXSize, ds.RasterYSize
    # 1. global guess, both pictures at about 8 m a pixel; the frames are about 1 m a pixel, so shrink the cut-out ~8x
    ref_c = cv2.resize(ref, None, fx=1 / COARSE, fy=1 / COARSE, interpolation=cv2.INTER_AREA)
    best = None
    for guess_m in (1.0, 0.6, 1.8):  # metres per frame pixel: HEXAGON and GAMBIT scans sit in this range
        f = COARSE * M_PER_PX / guess_m
        cut_c, _, _ = read_cut(ds, 0, 0, W, H, 1 / f)
        a, b = match(feats(cut_c), feats(ref_c))
        if len(a) < 10: continue
        Hc, mask = cv2.findHomography(a, b, cv2.RANSAC, 6.0, maxIters=20000, confidence=0.999)
        n = int(mask.sum()) if mask is not None else 0
        print(oid, f'global match at {guess_m} m/px: {len(a)} candidate pairs, {n} agree')
        if Hc is not None and (best is None or n > best[0]): best = (n, Hc, f)
    if not best or best[0] < 15: return None, {'error': 'global match failed', 'agree': best[0] if best else 0}
    n0, Hc, f = best
    # full-resolution cut px -> reference px
    Hf = np.diag([COARSE, COARSE, 1.0]) @ Hc @ np.diag([1 / f, 1 / f, 1.0])
    # 2. local matches on a grid
    gcps = []
    for gy in range(GRID):
        for gx in range(GRID):
            cx, cy = (gx + 0.5) * W / GRID, (gy + 0.5) * H / GRID
            pc = apply_h(Hf, np.array([[cx, cy]]))[0]
            d = apply_h(Hf, np.array([[cx + 100, cy], [cx, cy + 100]])) - pc
            k = math.sqrt(abs(np.linalg.det(d / 100)))            # reference px per cut px here
            half = CELL_M / M_PER_PX / 2 / k                         # half window, cut px
            patch, x0, y0 = read_cut(ds, cx - half, cy - half, 2 * half, 2 * half, k)
            if patch is None or patch.std() < 8: continue
            m = int(CELL_M / M_PER_PX * 0.75)
            rx0, ry0 = int(pc[0] - m), int(pc[1] - m)
            if rx0 < 0 or ry0 < 0 or rx0 + 2 * m > ref.shape[1] or ry0 + 2 * m > ref.shape[0]: continue
            win = ref[ry0:ry0 + 2 * m, rx0:rx0 + 2 * m]
            if win.std() < 8: continue
            a, b = match(feats(patch), feats(win), 0.85)
            if len(a) < 8: continue
            A, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=5000)
            if A is None or inl.sum() < 8: continue
            if not 0.7 < math.hypot(A[0, 0], A[1, 0]) < 1.4: continue  # scale should already be right
            q = A @ np.array([(cx - x0) * k, (cy - y0) * k, 1.0]) + [rx0, ry0]
            if np.hypot(*(q - pc)) > 0.6 * m: continue
            gcps.append((cx, cy, q[0], q[1], int(inl.sum())))
    print(oid, 'local points', len(gcps), 'of', GRID * GRID, 'cells')
    if len(gcps) < MIN_POINTS: return None, {'error': 'too few local points', 'points': len(gcps), 'global_agree': n0}
    # 3. polynomial fit with outlier removal, leave-one-out error
    P = np.array(gcps, float); keep = np.ones(len(P), bool)
    for _ in range(5):
        fwd = fit_poly(P[keep, :2], P[keep, 2:4])
        r = np.hypot(*(fwd(P[:, :2]) - P[:, 2:4]).T)
        lim = max(3 * np.median(r[keep]), 4.0)
        new = r < lim
        if (new == keep).all() or new.sum() < MIN_POINTS: break
        keep = new
    Q = P[keep]
    loo = []
    for i in range(len(Q)):
        mk = np.arange(len(Q)) != i
        loo.append(float(np.hypot(*(fit_poly(Q[mk, :2], Q[mk, 2:4])(Q[i:i + 1, :2])[0] - Q[i, 2:4]))))
    rms_m = float(np.sqrt(np.mean(np.square(loo)))) * M_PER_PX
    out = [[round(x, 1), round(y, 1), *[round(v, 7) for v in px2ll(rx + origin[0], ry + origin[1])]] for x, y, rx, ry, _ in Q]
    info = {'points': len(Q), 'dropped': int((~keep).sum()), 'global_agree': n0, 'rms_m': round(rms_m, 1),
            'median_m': round(float(np.median(loo)) * M_PER_PX, 1), 'method': 'SIFT + RANSAC against Esri World Imagery z16, 2nd-order polynomial',
            'at': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    check_image(oid, ds, Q, ref)
    return out, info

def check_image(oid, ds, Q, ref, size=2400, block=150):
    """Checkerboard of today's imagery and the warped frame, so the fit can be judged by eye."""
    inv = fit_poly(Q[:, 2:4], Q[:, :2])
    x0, y0 = Q[:, 2].min(), Q[:, 3].min(); x1, y1 = Q[:, 2].max(), Q[:, 3].max()
    s = max(x1 - x0, y1 - y0) / size
    gx, gy = np.meshgrid(np.arange(int((x1 - x0) / s)), np.arange(int((y1 - y0) / s)))
    rp = np.c_[x0 + gx.ravel() * s, y0 + gy.ravel() * s]
    shrink = max(1, int(max(ds.RasterXSize, ds.RasterYSize) / 6000))
    small = ds.GetRasterBand(1).ReadAsArray(buf_xsize=ds.RasterXSize // shrink, buf_ysize=ds.RasterYSize // shrink).astype(np.uint8)
    cp = inv(rp) / shrink
    warped = cv2.remap(small, cp[:, 0].reshape(gx.shape).astype(np.float32), cp[:, 1].reshape(gx.shape).astype(np.float32), cv2.INTER_LINEAR)
    today = cv2.remap(ref, rp[:, 0].reshape(gx.shape).astype(np.float32), rp[:, 1].reshape(gx.shape).astype(np.float32), cv2.INTER_AREA)
    board = ((gx // block + gy // block) % 2).astype(bool)
    out = np.where(board, CLAHE.apply(warped), CLAHE.apply(today))
    os.makedirs(PREV, exist_ok=True)
    cv2.imwrite(f'{PREV}/{oid}-check.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 80])

def fetch(url, dest):
    if os.path.exists(dest): return
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=600) as r, open(dest + '.part', 'wb') as f:
        while chunk := r.read(16 << 20): f.write(chunk)
    os.replace(dest + '.part', dest)

def main():
    overlays = json.load(open('archive/maps/overlays.json'))
    todo = [o for o in overlays if o.get('kind') == 'satellite' and o.get('url') and not o.get('gcps') and not o.get('registration', {}).get('manual')]
    only = set(filter(None, os.environ.get('USGS_ONLY', '').split(',')))
    if only: todo = [o for o in todo if o['id'] in only]
    if not todo: print('nothing to register'); return
    ref, origin = reference()
    status = {}
    for o in todo:
        try:
            cut = os.path.join(WORK, o['id'] + '.cut.tif'); fetch(o['url'], cut)
            gcps, info = register(o['id'], cut, ref, origin)
            o['registration'] = info
            if gcps:
                o['gcps'], o['gcp_srs'] = gcps, 'EPSG:4326'
                o['note'] = o.get('note', '').split(' Lined up automatically')[0] + f" Lined up automatically with today's imagery; typical error about {info['median_m']:.0f} m."
            status[o['id']] = info
            os.remove(cut)
        except Exception as e:
            status[o['id']] = {'error': str(e)[:300]}
        print(o['id'], '->', status[o['id']])
        json.dump(overlays, open('archive/maps/overlays.json', 'w'), indent=1, ensure_ascii=False)
    json.dump({'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'frames': status}, open('archive/maps/usgs-register-status.json', 'w'), indent=1)

if __name__ == '__main__':
    main()
