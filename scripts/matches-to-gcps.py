"""Turn grow-mode match files into the control points usgs-download.py cuts and warps a frame with.
  python3 scripts/matches-to-gcps.py <frame id> <cell metres> <matches file> [<matches file> ...]
Keeps the most confident point per cell (the thin-plate warp slows sharply past a few thousand points) and converts overview
pixels to frame pixels. Earlier files win a cell over later ones, so list the fine-scale matches first and the gap-filling
ones after. Writes archive/maps/gcps/<id>.json as [frame x, frame y, lon, lat]."""
import json, math, os, sys
fid, cell = sys.argv[1], float(sys.argv[2])
fo = json.load(open(f'archive/maps/preview/usgs/{fid}.json'))['overview']['reduced_by']
kx, ky = 111320 * math.cos(math.radians(32.88)), 110900
best, per_file = {}, []
for src in sys.argv[3:]:
    n = 0
    mine = {}
    for o in json.load(open(src))['candidates']:
        key = (int((o[2] - 13.0) * kx // cell), int((o[3] - 32.7) * ky // cell))
        if key in best: continue                         # an earlier file already has this cell
        if key not in mine or o[4] > mine[key][4]: mine[key] = o
    best.update(mine); per_file.append(len(mine))
out = [[round(o[0] * fo + fo / 2, 1), round(o[1] * fo + fo / 2, 1), o[2], o[3]] for o in best.values()]
os.makedirs('archive/maps/gcps', exist_ok=True)
json.dump(out, open(f'archive/maps/gcps/{fid}.json', 'w'))
print(fid, len(out), 'control points (', cell, 'm cells; per file', per_file, '; overview x', fo, ')')
