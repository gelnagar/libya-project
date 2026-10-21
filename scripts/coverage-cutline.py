"""Cutline for a thin-plate-warped film layer: the zone within RADIUS metres of any control point.
A convex outline around the points would show stretched, unverified film across gaps where nothing matched; this leaves gaps empty.
Reads a JSON list of [lon, lat] on stdin, writes a GeoJSON polygon collection on stdout. Falls back to a padded convex hull without shapely."""
import json, math, sys
RADIUS = float(sys.argv[1]) if len(sys.argv) > 1 else 450.0
P = json.load(sys.stdin)
lat0 = sum(p[1] for p in P) / len(P); kx = 111320 * math.cos(math.radians(lat0)); ky = 110900
def to_m(p): return ((p[0] - P[0][0]) * kx, (p[1] - P[0][1]) * ky)
def to_deg(x, y): return [x / kx + P[0][0], y / ky + P[0][1]]
try:
    from shapely.geometry import MultiPoint
    from shapely.ops import unary_union
    zone = MultiPoint([to_m(p) for p in P]).buffer(RADIUS, quad_segs=6)
    geoms = list(zone.geoms) if zone.geom_type == 'MultiPolygon' else [zone]
    feats = [{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[to_deg(*c) for c in g.exterior.coords]] + [[to_deg(*c) for c in h.coords] for h in g.interiors]}} for g in geoms]
except ImportError:
    pts = sorted(map(tuple, P))
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0: hi.pop()
        hi.append(p)
    H = lo[:-1] + hi[:-1]; cx, cy = sum(p[0] for p in H) / len(H), sum(p[1] for p in H) / len(H); ring = []
    for x, y in H:
        d = math.hypot(x - cx, y - cy) or 1; ring.append([x + (x - cx) / d * 0.0033, y + (y - cy) / d * 0.0027])
    ring.append(ring[0]); feats = [{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [ring]}}]
print(json.dumps({"type": "FeatureCollection", "features": feats}))
