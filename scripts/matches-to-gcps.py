"""Turn a grow-mode match file into the control points usgs-download.py cuts and warps a frame with.
  python3 scripts/matches-to-gcps.py <frame id> <matches file> [spacing metres]
Keeps the most confident point per ~250 m cell (the thin-plate warp slows sharply past a few thousand points) and converts
overview pixels to frame pixels. Writes archive/maps/gcps/<id>.json as [frame x, frame y, lon, lat]."""
import json, math, os, sys
fid, src = sys.argv[1], sys.argv[2]
cell = float(sys.argv[3]) if len(sys.argv) > 3 else 250.0
fo = json.load(open(f'archive/maps/preview/usgs/{fid}.json'))['overview']['reduced_by']
cands = json.load(open(src))['candidates']
kx, ky = 111320 * math.cos(math.radians(32.88)), 110900
best = {}
for o in cands:
    key = (int((o[2] - 13.0) * kx // cell), int((o[3] - 32.7) * ky // cell))
    if key not in best or o[4] > best[key][4]: best[key] = o
out = [[round(o[0] * fo + fo / 2, 1), round(o[1] * fo + fo / 2, 1), o[2], o[3]] for o in best.values()]
os.makedirs('archive/maps/gcps', exist_ok=True)
json.dump(out, open(f'archive/maps/gcps/{fid}.json', 'w'))
print(fid, len(cands), 'matches ->', len(out), 'control points (', cell, 'm cells; overview x', fo, ')')
