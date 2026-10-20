"""Line up the declassified satellite frames with today's imagery automatically, so nobody has to click control points.

1970s film and today's colour imagery share few point features (the city has grown, the film's tones differ), so the
matching leans on what lasts: the coastline and the pattern of edges (shore, harbour moles, old streets, main roads).

locate(): finds Tripoli on a whole frame. Land and sea are separated on both pictures and the coastline shapes are slid
  over each other across rotation, film scale and panoramic stretch (normalised cross-correlation of the masks).
register(): lines up a cut-out in stages. The coastline search again, narrowly; then edge maps matched in windows at
  16 m, 4 m and 2 m a pixel, each stage refitting a polynomial through the windows that matched clearly. The final
  window centres become control points; outliers are dropped and the leave-one-out error is reported in metres.
  Writes archive/maps/preview/usgs/<id>-check.jpg, a checkerboard of the warped frame against today's imagery.

Reference: Esri World Imagery at zoom 16 (about 2 m a pixel), the same imagery the site's Satellite style shows.
Frames that fail keep no "gcps" and are listed in archive/maps/usgs-register-status.json."""
import concurrent.futures, datetime, json, math, os, time, urllib.request
import cv2
import numpy as np
from osgeo import gdal

gdal.UseExceptions()
Z = 16
AOI = (13.04, 32.72, 13.38, 32.95)  # lon0, lat0, lon1, lat1: reference picture
CITY = (13.09, 32.78, 13.32, 32.92)  # the part of each frame that is cut out and tiled (Tripoli as it was in the 1970s-80s)
COAST = (13.05, 32.80, 13.36, 32.93)  # the stretch of coast whose shape is matched
ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)'
WORK = os.environ.get('USGS_WORK', 'work/usgs')
PREV = 'archive/maps/preview/usgs'
MIN_POINTS = 12
M_PER_PX = 156543.03392 * math.cos(math.radians(32.85)) / 2 ** Z
CLAHE = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

def ll2px(lon, lat):
    n = 256 * 2 ** Z
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n

def px2ll(x, y):
    n = 256 * 2 ** Z
    return x / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))

_REF = None
def reference():
    """Today's imagery over AOI as one grey picture, and the global zoom-16 pixel of its top-left corner."""
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

def ref_px(lon, lat):
    """Reference-picture pixel of a lon/lat."""
    _, origin = reference()
    x, y = ll2px(lon, lat)
    return np.array([x - origin[0], y - origin[1]])

def poly_terms(p):
    x, y = p[:, 0], p[:, 1]
    return np.c_[np.ones_like(x), x, y, x * x, x * y, y * y]

def fit_poly(src, dst, order=2):
    """Least-squares map src -> dst (order 1 = affine, 2 = quadratic). Returns a function of an (n, 2) array."""
    src, dst = np.asarray(src, float), np.asarray(dst, float)
    sx, sy = src.mean(0), src.std(0) + 1e-9
    terms = (lambda p: poly_terms(p)[:, :3]) if order == 1 else poly_terms
    coef, *_ = np.linalg.lstsq(terms((src - sx) / sy), dst, rcond=None)
    return lambda p: terms((np.asarray(p, float).reshape(-1, 2) - sx) / sy) @ coef

def affine_fn(M):
    """2x3 matrix -> function of an (n, 2) array."""
    M = np.asarray(M, float)
    return lambda p: np.asarray(p, float).reshape(-1, 2) @ M[:, :2].T + M[:, 2]

# ---------- coastline search ----------

def land_mask(img, sigma):
    """1 = land, 0 = sea, 0.5 = no data (film margins, black borders). Land is brighter than sea on film and today alike."""
    b = cv2.GaussianBlur(img.astype(np.float32), (0, 0), sigma)
    valid = b > 6
    if valid.sum() < 100: return np.full(img.shape, 0.5, np.float32)
    t, _ = cv2.threshold(b[valid].astype(np.uint8).reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    m = ((b > t) & valid).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    out = m.astype(np.float32); out[~valid] = 0.5
    return out

def coast_template(res_m):
    """Today's land mask over COAST at res_m metres a pixel, and the reference pixel of its top-left corner."""
    ref, _ = reference()
    (x0, y0), (x1, y1) = ref_px(COAST[0], COAST[3]), ref_px(COAST[2], COAST[1])
    k = M_PER_PX / res_m
    sub = ref[int(y0):int(y1), int(x0):int(x1)]
    return land_mask(cv2.resize(sub, None, fx=k, fy=k, interpolation=cv2.INTER_AREA), 1.5), np.array([int(x0), int(y0)])

def coast_search(film, film_m, tmpl, tmpl_m, scales, aspects, angles):
    """Slide the template mask over the film mask. film_m: frame pixels per film-mask pixel. Returns
    (score, metres per frame px, aspect, angle, M) with M a 2x3 map from template px to film-mask px."""
    best = (-1.0, None, None, None, None)
    th, tw = tmpl.shape
    for g in scales:
        for a in aspects:
            for ang in angles:
                k = tmpl_m / (film_m * g)
                c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
                A = np.array([[k * a * c, -k * a * s], [k * s, k * c]])
                corners = np.array([[0, 0], [tw, 0], [tw, th], [0, th]]) @ A.T
                lo = corners.min(0); size = np.ceil(corners.max(0) - lo).astype(int)
                if size[0] >= film.shape[1] or size[1] >= film.shape[0] or min(size) < 16: continue
                M = np.c_[A, -lo]
                w = cv2.warpAffine(tmpl, M, (int(size[0]), int(size[1])), flags=cv2.INTER_LINEAR, borderValue=0.5)
                r = cv2.matchTemplate(film, w, cv2.TM_CCOEFF_NORMED)
                _, v, _, loc = cv2.minMaxLoc(r)
                if v > best[0]: best = (v, g, a, ang, M + np.array([[0, 0, loc[0]], [0, 0, loc[1]]]))
    return best

def coast_fit(img, img_frame_px, wide=True, near=None):
    """Find COAST on img (each img pixel = img_frame_px frame pixels). Coarse search, then a finer one around the best.
    Returns (score, ref->img 2x3 matrix) or (score, None)."""
    # the pass runs roughly north-south, so the film's long axis is near east-west: upright or upside down, +-25 degrees
    angles = list(range(-25, 26, 5)) + list(range(155, 206, 5)) if wide else list(range(int(near[2]) - 8, int(near[2]) + 9, 4))
    scales = np.arange(0.6, 3.01, 0.15) if wide else np.arange(near[0] * 0.85, near[0] * 1.16, near[0] * 0.05)
    aspects = (0.8, 0.9, 1.0, 1.1, 1.25) if wide else (near[1] * 0.92, near[1], near[1] * 1.08)
    best, res = None, None
    for stage, mask_m in enumerate((110.0, 55.0)):  # metres per mask pixel, at about 1.4 m a frame pixel
        red = max(1, mask_m / ((near[0] if near else 1.4) * img_frame_px))  # near[0]: film metres per frame pixel
        film = land_mask(cv2.resize(img, None, fx=1 / red, fy=1 / red, interpolation=cv2.INTER_AREA), 2)
        tmpl, t0 = coast_template(mask_m)
        if stage == 1 and best and best[4] is not None:
            v, g, a, ang, _ = best
            angles = [ang + d for d in (-3, -1.5, 0, 1.5, 3)]; scales = [g * f for f in (0.95, 0.975, 1, 1.025, 1.05)]; aspects = [a * f for f in (0.96, 1, 1.04)]
        best = coast_search(film, img_frame_px * red, tmpl, mask_m, scales, aspects, angles)
        res = (red, t0, mask_m)
        print(f'  coast search at {mask_m:.0f} m: score {best[0]:.3f}, {best[1] and round(best[1], 2)} m/px, aspect {best[2] and round(best[2], 2)}, angle {best[3]}')
    v, g, a, ang, M = best
    if M is None: return v, None, best
    red, t0, mask_m = res
    # ref px -> template px -> film-mask px -> img px
    k = M_PER_PX / mask_m
    R2T = np.array([[k, 0, -k * t0[0]], [0, k, -k * t0[1]], [0, 0, 1]])
    F = np.vstack([M, [0, 0, 1]])
    S = np.diag([red, red, 1.0])
    return v, (S @ F @ R2T)[:2], best

def locate(overview, frame_px_per_px):
    """Find Tripoli on a frame overview. Returns ([x, y, w, h] window of CITY in overview px, padded, or None, score, ref->overview 2x3)."""
    score, A, _ = coast_fit(overview, frame_px_per_px)
    if A is None or score < 0.6:
        return None, round(float(score), 3), None
    to_ov = affine_fn(A)
    corners = to_ov(np.array([ref_px(CITY[0], CITY[3]), ref_px(CITY[2], CITY[3]), ref_px(CITY[2], CITY[1]), ref_px(CITY[0], CITY[1])]))
    (x0, y0), (x1, y1) = corners.min(0), corners.max(0)
    pad = 0.12 * max(x1 - x0, y1 - y0)  # the coastline fit can be off by a kilometre or two
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad); x1, y1 = min(overview.shape[1], x1 + pad), min(overview.shape[0], y1 + pad)
    if x1 - x0 < 50 or y1 - y0 < 50: return None, round(float(score), 3), None
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], round(float(score), 3), A.tolist()

# ---------- edge matching ----------

def edges(img):
    g = cv2.GaussianBlur(CLAHE.apply(img), (0, 0), 1.0).astype(np.float32)
    m = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
    return np.sqrt(m)  # soften: strong film edges should not drown everything else

class Pyramid:
    """The cut-out at several reductions, so warping to a coarse grid does not alias."""
    def __init__(self, img):
        self.levels = [img]
        while min(self.levels[-1].shape) > 256: self.levels.append(cv2.pyrDown(self.levels[-1]))
    def warp(self, ref_to_cut, x0, y0, w, h, step):
        """Picture of the cut-out on a grid of reference pixels: (x0 + i*step, y0 + j*step) for i < w, j < h."""
        gx, gy = np.meshgrid(x0 + np.arange(w) * step, y0 + np.arange(h) * step)
        cp = ref_to_cut(np.c_[gx.ravel(), gy.ravel()])
        d = np.diff(ref_to_cut(np.array([[x0, y0], [x0 + step, y0]])), axis=0)[0]
        level = max(0, min(len(self.levels) - 1, int(math.log2(max(1.0, math.hypot(*d))))))
        cp = cp / 2 ** level
        return cv2.remap(self.levels[level], cp[:, 0].reshape(gx.shape).astype(np.float32), cp[:, 1].reshape(gx.shape).astype(np.float32),
                         cv2.INTER_LINEAR, borderValue=0)

def edge_stage(pyr, ref, ref_to_cut, cut_to_ref, res_m, patch_m, search_m, grid_n, box):
    """Match windows of the cut-out (warped by the current estimate) against today's imagery. Returns (cut point, ref point, score) list."""
    step = res_m / M_PER_PX  # ref px per work px
    ref_work = cv2.resize(ref, None, fx=1 / step, fy=1 / step, interpolation=cv2.INTER_AREA) if step > 1 else ref
    pw, sw = int(patch_m / res_m), int(search_m / res_m)
    (bx0, by0), (bx1, by1) = box
    out = []
    for cy in np.linspace(by0, by1, grid_n + 2)[1:-1]:
        for cx in np.linspace(bx0, bx1, grid_n + 2)[1:-1]:
            tx, ty = int(cx / step) - pw // 2, int(cy / step) - pw // 2
            if tx < 0 or ty < 0 or tx + pw > ref_work.shape[1] or ty + pw > ref_work.shape[0]: continue
            tmpl = ref_work[ty:ty + pw, tx:tx + pw]
            if tmpl.std() < 6 or (tmpl < 5).mean() > 0.2: continue
            sx0, sy0 = (tx - sw) * step, (ty - sw) * step
            win = pyr.warp(ref_to_cut, sx0, sy0, pw + 2 * sw, pw + 2 * sw, step)
            if (win < 3).mean() > 0.3 or win.std() < 6: continue  # off the film, or blank
            te, we = edges(tmpl), edges(win)
            r = cv2.matchTemplate(we, te, cv2.TM_CCOEFF_NORMED)
            _, v, _, loc = cv2.minMaxLoc(r)
            # a clear match: the best peak stands well above the best one elsewhere
            r2 = r.copy(); cv2.circle(r2, loc, max(3, pw // 8), -1, -1)
            v2 = r2.max()
            if v < 0.15 or v - v2 < 0.04: continue
            # today's window centre sits at (loc + pw/2) in the warped window, i.e. this ref point on the current estimate:
            shown = np.array([sx0 + (loc[0] + pw / 2) * step, sy0 + (loc[1] + pw / 2) * step])
            ref_pt = np.array([(tx + pw / 2) * step, (ty + pw / 2) * step])
            out.append((ref_to_cut(shown)[0], ref_pt, float(v)))
    return out

def robust_fit(pairs, order, min_n, res_m):
    """Fit cut -> ref through pairs, dropping outliers. Returns (forward, inverse, kept cut pts, kept ref pts, residuals m) or None."""
    if len(pairs) < min_n: return None
    C = np.array([p[0] for p in pairs]); R = np.array([p[1] for p in pairs]); keep = np.ones(len(C), bool)
    for _ in range(6):
        fwd = fit_poly(C[keep], R[keep], order)
        r = np.hypot(*(fwd(C) - R).T)
        lim = max(3 * np.median(r[keep]), 1.5 * res_m / M_PER_PX)  # never tighter than the stage can measure
        new = r < lim
        if (new == keep).all() or new.sum() < min_n: break
        keep = new
    return fit_poly(C[keep], R[keep], order), fit_poly(R[keep], C[keep], order), C[keep], R[keep], r[keep] * M_PER_PX

def register(oid, cut_path, ref, origin, init=None, init_gcps=None):
    """Line up one cut-out. init: optional 2x3 cut px -> ref px guess. init_gcps: hand-marked landmarks
    [[cut x, cut y, lon, lat], ...]; the fit starts from them, and they are the result if edge matching cannot improve on them.
    Returns (gcps, info)."""
    ds = gdal.Open(cut_path)
    cut = ds.GetRasterBand(1).ReadAsArray().astype(np.uint8); ds = None
    pyr = Pyramid(cut)
    H, W = cut.shape
    if init_gcps:
        return register_from_landmarks(oid, pyr, ref, origin, np.array(init_gcps, float), W, H)
    # 1. coastline, narrowed around the guess from locate() when there is one
    near = None
    if init is not None:
        M = np.vstack([np.asarray(init, float), [0, 0, 1]])
        sc = math.sqrt(abs(np.linalg.det(M[:2, :2])))  # ref px per cut px
        near = (M_PER_PX * sc, 1.0, round(math.degrees(math.atan2(-M[1, 0], M[1, 1]))) % 360)
    score, A, best = coast_fit(cut, 1.0, wide=near is None, near=near)
    if A is None or score < 0.6: return None, {'error': 'coastline not found on the cut-out', 'coast_score': round(float(score), 3)}
    A3 = np.vstack([A, [0, 0, 1]]); Ainv = np.linalg.inv(A3)[:2]
    ref_to_cut, cut_to_ref = affine_fn(A), affine_fn(Ainv)
    # the part of today's picture this cut-out covers
    corners = cut_to_ref(np.array([[0, 0], [W, 0], [W, H], [0, H]]))
    lo, hi = np.maximum(corners.min(0), 0), np.minimum(corners.max(0), [ref.shape[1], ref.shape[0]])
    box = (lo + 0.04 * (hi - lo), hi - 0.04 * (hi - lo))
    info = {'coast_score': round(float(score), 3), 'film_m_per_px': round(float(best[1]), 2), 'stages': []}
    # 2-4. edge matching, coarse to fine; each stage refits the map and narrows the search
    fit = None
    for res_m, patch_m, search_m, grid_n, order in ((16, 3200, 1600, 5, 1), (4, 800, 160, 10, 2), (2, 400, 40, 14, 2)):
        pairs = edge_stage(pyr, ref, ref_to_cut, cut_to_ref, res_m, patch_m, search_m, grid_n, box)
        f = robust_fit(pairs, order, 6 if order == 1 else MIN_POINTS, res_m)
        info['stages'].append({'res_m': res_m, 'windows_matched': len(pairs), 'kept': 0 if f is None else len(f[2]),
                               'median_m': None if f is None else round(float(np.median(f[4])), 1)})
        print(oid, f'edges at {res_m} m: {len(pairs)} windows matched,', 'no fit' if f is None else f'{len(f[2])} kept, median {np.median(f[4]):.1f} m')
        if f is None:
            if fit is None and res_m == 16: return None, {**info, 'error': 'edge matching failed at 16 m'}
            break
        fit = f
        cut_to_ref, ref_to_cut = f[0], f[1]
    if fit is None or len(fit[2]) < MIN_POINTS: return None, {**info, 'error': 'too few control points'}
    _, _, C, R, _ = fit
    # leave-one-out error of the final quadratic
    loo = [float(np.hypot(*(fit_poly(np.delete(C, i, 0), np.delete(R, i, 0))(C[i:i + 1])[0] - R[i]))) * M_PER_PX for i in range(len(C))]
    info.update({'points': len(C), 'rms_m': round(float(np.sqrt(np.mean(np.square(loo)))), 1), 'median_m': round(float(np.median(loo)), 1),
                 'method': 'coastline shape, then edge matching at 16, 4 and 2 m against Esri World Imagery z16; 2nd-order polynomial',
                 'at': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    gcps = [[round(float(x), 1), round(float(y), 1), *[round(v, 7) for v in px2ll(rx + origin[0], ry + origin[1])]] for (x, y), (rx, ry) in zip(C, R)]
    check_image(oid, pyr, fit_poly(R, C), ref, box)
    return gcps, info

def loo_errors(C, R, order=2):
    """Leave-one-out error of each point, metres: how far off the fit is where that point was not used."""
    return [float(np.hypot(*(fit_poly(np.delete(C, i, 0), np.delete(R, i, 0), order)(C[i:i + 1])[0] - R[i]))) * M_PER_PX for i in range(len(C))]

def register_from_landmarks(oid, pyr, ref, origin, L, W, H):
    """Start from hand-marked landmarks, then add edge-matched points between them. Keeps the landmarks in the final fit."""
    C0 = L[:, :2]; R0 = np.array([ref_px(lo, la) for lo, la in L[:, 2:4]])
    order = 2 if len(L) >= 8 else 1
    cut_to_ref, ref_to_cut = fit_poly(C0, R0, order), fit_poly(R0, C0, order)
    base = loo_errors(C0, R0, order)
    info = {'landmarks': len(L), 'landmarks_median_m': round(float(np.median(base)), 1), 'landmarks_worst_m': round(float(max(base)), 1), 'stages': []}
    print(oid, f'{len(L)} landmarks, leave-one-out median {np.median(base):.1f} m, worst {max(base):.1f} m')
    corners = cut_to_ref(np.array([[0, 0], [W, 0], [W, H], [0, H]]))
    lo, hi = np.maximum(corners.min(0), 0), np.minimum(corners.max(0), [ref.shape[1], ref.shape[0]])
    box = (lo + 0.03 * (hi - lo), hi - 0.03 * (hi - lo))
    C, R = C0, R0
    for res_m, patch_m, search_m, grid_n in ((4, 800, 200, 12), (2, 400, 50, 16)):
        pairs = edge_stage(pyr, ref, ref_to_cut, cut_to_ref, res_m, patch_m, search_m, grid_n, box)
        # landmarks always take part; edge points must agree with them
        allp = [(c, r, 1.0) for c, r in zip(C0, R0)] + pairs
        f = robust_fit(allp, 2, MIN_POINTS, res_m)
        kept = 0 if f is None else len(f[2]) - len(C0)
        info['stages'].append({'res_m': res_m, 'windows_matched': len(pairs), 'edge_points_kept': max(0, kept)})
        print(oid, f'edges at {res_m} m: {len(pairs)} windows matched, {max(0, kept)} kept')
        if f is None or kept < 6: continue
        cut_to_ref, ref_to_cut, C, R, _ = f
    # never let edge points pull the fit away from the landmarks: compare the landmarks' leave-one-out error both ways
    final = loo_errors(C, R) if len(C) > len(C0) else base
    if len(C) > len(C0):
        lm_err = [float(np.hypot(*(cut_to_ref(C0[i:i + 1])[0] - R0[i]))) * M_PER_PX for i in range(len(C0))]
        if np.median(lm_err) > 1.5 * np.median(base) + 5:
            print(oid, 'edge points disagree with the landmarks; keeping the landmarks alone')
            C, R, final = C0, R0, base
    info.update({'points': len(C), 'rms_m': round(float(np.sqrt(np.mean(np.square(final)))), 1), 'median_m': round(float(np.median(final)), 1),
                 'method': 'hand-marked landmarks' + (', refined by edge matching against Esri World Imagery z16' if len(C) > len(C0) else '') + '; 2nd-order polynomial',
                 'at': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    gcps = [[round(float(x), 1), round(float(y), 1), *[round(v, 7) for v in px2ll(rx + origin[0], ry + origin[1])]] for (x, y), (rx, ry) in zip(C, R)]
    check_image(oid, pyr, fit_poly(R, C, 2 if len(C) >= 8 else 1), ref, box)
    return gcps, info

def check_image(oid, pyr, ref_to_cut, ref, box, size=2400, block=160):
    """Checkerboard of today's imagery and the warped frame, so the fit can be judged by eye."""
    (x0, y0), (x1, y1) = box
    step = max(x1 - x0, y1 - y0) / size
    w, h = int((x1 - x0) / step), int((y1 - y0) / step)
    warped = pyr.warp(ref_to_cut, x0, y0, w, h, step)
    today = cv2.resize(ref[int(y0):int(y0 + h * step), int(x0):int(x0 + w * step)], (w, h), interpolation=cv2.INTER_AREA)
    board = ((np.arange(w)[None, :] // block + np.arange(h)[:, None] // block) % 2).astype(bool)
    out = np.where(board, CLAHE.apply(warped), CLAHE.apply(today))
    os.makedirs(PREV, exist_ok=True)
    cv2.imwrite(f'{PREV}/{oid}-check.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 80])

def fetch(url, dest):
    if os.path.exists(dest): return
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=600) as r, open(dest + '.part', 'wb') as f:
        while chunk := r.read(16 << 20): f.write(chunk)
    os.replace(dest + '.part', dest)

def main():
    overlays = json.load(open('archive/maps/overlays.json', encoding='utf8'))
    todo = [o for o in overlays if o.get('kind') == 'satellite' and o.get('url') and not o.get('gcps') and not o.get('registration', {}).get('manual')]
    only = set(filter(None, os.environ.get('USGS_ONLY', '').split(',')))
    if only: todo = [o for o in todo if o['id'] in only]
    if not todo: print('nothing to register'); return
    ref, origin = reference()
    status = {}
    for o in todo:
        try:
            cut = os.path.join(WORK, o['id'] + '.cut.tif'); fetch(o['url'], cut)
            gcps, info = register(o['id'], cut, ref, origin, o.get('init'), o.get('init_gcps'))
            o['registration'] = info
            if gcps:
                o['gcps'], o['gcp_srs'] = gcps, 'EPSG:4326'
                o['note'] = o.get('note', '').split(' Lined up automatically')[0] + f" Lined up automatically with today's imagery; typical error about {info['median_m']:.0f} m."
            status[o['id']] = info
            os.remove(cut)
        except Exception as e:
            status[o['id']] = {'error': str(e)[:300]}
        print(o['id'], '->', status[o['id']])
        json.dump(overlays, open('archive/maps/overlays.json', 'w', encoding='utf8', newline='\n'), indent=1, ensure_ascii=False)
    json.dump({'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'frames': status}, open('archive/maps/usgs-register-status.json', 'w'), indent=1)

if __name__ == '__main__':
    main()
