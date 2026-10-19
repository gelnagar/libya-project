"""Download the scanned spy-satellite frames listed in archive/maps/usgs-picks.json from USGS EarthExplorer (M2M API),
join their film segments, and cut out Tripoli. Needs USGS_USERNAME and USGS_TOKEN; uploading needs gh and GH_TOKEN.

For each pick: writes archive/maps/preview/usgs/<id>-whole.jpg (whole frame, small) and <id>.json, then finds Tripoli
on the frame by matching it against today's imagery (usgs-register.py locate). A pick's own "crop": [x, y, w, h] in
preview pixels overrides that. The Tripoli window is cut at full detail, attached to the 'usgs-frames' release as
<id>.tif, previewed with a grid (<id>-cut.jpg) and added to archive/maps/overlays.json. usgs-register.py then lines it
up and build-overlays.sh tiles it."""
import datetime, glob, json, math, os, shutil, subprocess, tarfile, time, urllib.request, zipfile
import importlib.util
import numpy as np
from osgeo import gdal

gdal.UseExceptions()
API = 'https://m2m.cr.usgs.gov/api/api/json/stable/'
UA = 'TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)'
REPO = os.environ.get('GITHUB_REPOSITORY', 'gelnagar/libya-project')
RELEASE = 'usgs-frames'
WORK = os.environ.get('USGS_WORK', 'work/usgs')
PREV = 'archive/maps/preview/usgs'
PREVIEW_LONG = 6000   # long side of the whole-frame preview, px
CUT_PREVIEW_LONG = 5000
MAX_ASSET = 1_900_000_000  # GitHub release assets must be under 2 GiB

def call(endpoint, payload, key=None):
    req = urllib.request.Request(API + endpoint, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', **({'X-Auth-Token': key} if key else {})})
    with urllib.request.urlopen(req, timeout=120) as r:
        j = json.load(r)
    if j.get('errorCode'):
        raise RuntimeError(f"{endpoint}: {j.get('errorCode')} {j.get('errorMessage')}")
    return j['data']

def scrub(msg):
    for v in (os.environ.get('USGS_TOKEN') or '', os.environ.get('USGS_USERNAME') or ''):
        if v: msg = msg.replace(v, '***')
    return msg

def request_url(key, pick):
    opts = [o for o in call('download-options', {'datasetName': pick['dataset'], 'entityIds': [pick['entityId']]}, key) or [] if o.get('available')]
    if not opts: raise RuntimeError('not scanned yet (no free download)')
    o = opts[0]
    label = f"tripoli-{pick['id']}-{int(time.time())}"
    r = call('download-request', {'downloads': [{'entityId': o['entityId'], 'productId': o['id']}], 'label': label}, key)
    urls = [d['url'] for d in r.get('availableDownloads') or [] if d.get('url')]
    for _ in range(40):  # up to 20 minutes for USGS to stage it
        if urls: break
        time.sleep(30)
        rr = call('download-retrieve', {'label': label}, key) or {}
        urls = [d['url'] for d in rr.get('available') or [] if d.get('url')]
    if not urls: raise RuntimeError('USGS never made the download ready')
    return urls[0], o.get('filesize')

def fetch(url, dest):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=600) as r, open(dest, 'wb') as f:
                shutil.copyfileobj(r, f, 16 << 20)
            return
        except Exception as e:
            print('download attempt', attempt + 1, 'failed:', e)
            time.sleep(20)
    raise RuntimeError('download failed three times')

def unpack(path, dest):
    os.makedirs(dest, exist_ok=True)
    if tarfile.is_tarfile(path):
        with tarfile.open(path) as t: t.extractall(dest, filter='data')
    elif zipfile.is_zipfile(path):
        zipfile.ZipFile(path).extractall(dest)
    else:
        shutil.move(path, os.path.join(dest, 'frame.tif'))
    if os.path.exists(path): os.remove(path)
    tifs = sorted(p for p in glob.glob(dest + '/**/*', recursive=True) if p.lower().endswith(('.tif', '.tiff')))
    if not tifs: raise RuntimeError('no TIFF inside the download: ' + ', '.join(os.listdir(dest))[:300])
    return tifs

def small(path, f):
    ds = gdal.Open(path)
    return ds.GetRasterBand(1).ReadAsArray(buf_xsize=max(1, ds.RasterXSize // f), buf_ysize=max(1, ds.RasterYSize // f)).astype(np.float32)

def seam(a, b, f):
    """Where b's leading edge sits inside a's trailing edge, joining along x. Returns (dx, dy) in full pixels from a's origin."""
    band, search = 32, a.shape[1] // 3
    rows = slice(a.shape[0] // 4, 3 * a.shape[0] // 4)
    bb = b[rows, :band]; bb = (bb - bb.mean()) / (bb.std() + 1e-6)
    best = (-2.0, a.shape[1], 0)
    for dy in range(-8, 9):
        r = slice(rows.start + dy, rows.stop + dy)
        if r.start < 0 or r.stop > a.shape[0]: continue
        for x in range(a.shape[1] - search, a.shape[1] - band + 1):
            aa = a[r, x:x + band]
            s = float(((aa - aa.mean()) / (aa.std() + 1e-6) * bb).mean())
            if s > best[0]: best = (s, x, dy)
    score, x, dy = best
    if score < 0.5:  # no clear overlap: butt the pieces together
        return a.shape[1] * f, 0, score
    return x * f, dy * f, score

def mosaic(tifs, vrt):
    """Join the film segments into one virtual image. Segments of one frame share the film's width."""
    sizes = [(gdal.Open(p).RasterXSize, gdal.Open(p).RasterYSize) for p in tifs]
    info = {'segments': [os.path.basename(p) for p in tifs], 'sizes': sizes, 'seams': []}
    along_x = len(tifs) == 1 or max(h for _, h in sizes) - min(h for _, h in sizes) <= max(w for w, _ in sizes) - min(w for w, _ in sizes)
    info['joined_along'] = 'x' if along_x else 'y'
    f = 16
    offs = [(0, 0)]
    prev = small(tifs[0], f)
    for p in tifs[1:]:
        cur = small(p, f)
        a, b = (prev, cur) if along_x else (prev.T, cur.T)
        dx, dy, score = seam(a, b, f)
        ox, oy = offs[-1]
        offs.append((ox + dx, oy + dy) if along_x else (ox + dy, oy + dx))
        info['seams'].append({'offset': offs[-1], 'score': round(score, 3)})
        prev = cur
    mx, my = min(o[0] for o in offs), min(o[1] for o in offs)
    offs = [(x - mx, y - my) for x, y in offs]
    W = max(x + w for (x, _), (w, _) in zip(offs, sizes)); H = max(y + h for (_, y), (_, h) in zip(offs, sizes))
    first = gdal.Open(tifs[0])  # keep the dataset alive while its band is read
    dtype = gdal.GetDataTypeName(first.GetRasterBand(1).DataType)
    src = ''.join(f'<SimpleSource><SourceFilename relativeToVRT="0">{os.path.abspath(p)}</SourceFilename><SourceBand>1</SourceBand>'
                  f'<SrcRect xOff="0" yOff="0" xSize="{w}" ySize="{h}"/><DstRect xOff="{x}" yOff="{y}" xSize="{w}" ySize="{h}"/></SimpleSource>'
                  for p, (w, h), (x, y) in zip(tifs, sizes, offs))
    open(vrt, 'w').write(f'<VRTDataset rasterXSize="{W}" rasterYSize="{H}"><VRTRasterBand dataType="{dtype}" band="1">{src}</VRTRasterBand></VRTDataset>')
    info.update({'width': W, 'height': H, 'dtype': dtype, 'offsets': offs})
    return info

def to_byte(dtype):
    return {} if dtype == 'Byte' else {'outputType': gdal.GDT_Byte, 'scaleParams': [[]]}

def preview(src, out, long_side, dtype, grid_every=None):
    ds = gdal.Open(src); W, H = ds.RasterXSize, ds.RasterYSize
    s = max(W, H) / long_side
    w, h = round(W / s), round(H / s)
    tmp = out + '.tif'
    gdal.Translate(tmp, ds, width=w, height=h, resampleAlg='average', **to_byte(dtype))
    img = gdal.Open(tmp).ReadAsArray()
    if grid_every:  # pale lines every grid_every full-size pixels, labelled in the json, so control points can be read off
        step = grid_every / s
        for k in range(1, int(w / step) + 1): img[:, min(w - 1, round(k * step))] = 255
        for k in range(1, int(h / step) + 1): img[min(h - 1, round(k * step)), :] = 255
    mem = gdal.GetDriverByName('MEM').Create('', w, h, 1, gdal.GDT_Byte); mem.GetRasterBand(1).WriteArray(img)
    gdal.GetDriverByName('JPEG').CreateCopy(out, mem, options=['QUALITY=82'])
    os.remove(tmp)
    for x in glob.glob(out + '.aux.xml'): os.remove(x)
    return s, w, h

def upload(path):
    subprocess.run(['gh', 'release', 'view', RELEASE, '-R', REPO], capture_output=True).returncode == 0 or \
        subprocess.run(['gh', 'release', 'create', RELEASE, '-R', REPO, '--title', 'Declassified satellite frames over Tripoli',
                        '--notes', 'Cut-outs of declassified USGS spy-satellite frames (public domain), made by scripts/usgs-download.py. Read by scripts/build-overlays.sh.'], check=True)
    subprocess.run(['gh', 'release', 'upload', RELEASE, path, '--clobber', '-R', REPO], check=True)
    return f'https://github.com/{REPO}/releases/download/{RELEASE}/{os.path.basename(path)}'

def overlay_entry(pick, url):
    return {'id': pick['id'], 'kind': 'satellite', 'title': pick['title'], 'year': pick['year'],
            'source': f"USGS EarthExplorer, declassified satellite imagery, frame {pick['entityId']}",
            'page': 'https://www.usgs.gov/centers/eros/science/usgs-eros-archive-declassified-data',
            'url': url, 'license': 'Public domain (U.S. government work)', 'zooms': pick.get('zooms', '12-16'),
            'note': pick.get('note', '') + f" Taken {pick['date']}."}

_REG = None
def registrar():
    global _REG
    if _REG is None:
        spec = importlib.util.spec_from_file_location('usgs_register', os.path.join(os.path.dirname(__file__), 'usgs-register.py'))
        _REG = importlib.util.module_from_spec(spec); spec.loader.exec_module(_REG)
    return _REG

def run(key, pick, overlays):
    pid = pick['id']; meta_path = f'{PREV}/{pid}.json'
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    if any(o['id'] == pid for o in overlays): return 'already cut and listed in overlays.json'
    if 'crop' not in pick and meta.get('locate_failed'): return 'Tripoli was not found automatically; add "crop" to the pick'
    d = os.path.join(WORK, pid); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    url, size = request_url(key, pick)
    print(pid, 'downloading', round((size or 0) / 1e9, 2), 'GB'); t = time.time()
    fetch(url, os.path.join(d, 'download'))
    tifs = unpack(os.path.join(d, 'download'), os.path.join(d, 'x'))
    print(pid, 'downloaded and unpacked in', round(time.time() - t), 's:', [os.path.basename(p) for p in tifs])
    vrt = os.path.join(d, 'frame.vrt'); info = mosaic(tifs, vrt)
    print(pid, 'joined', info['joined_along'], info['width'], 'x', info['height'], 'seams', info['seams'])
    os.makedirs(PREV, exist_ok=True)
    s, w, h = preview(vrt, f'{PREV}/{pid}-whole.jpg', PREVIEW_LONG, info['dtype'])
    meta.update({'id': pid, 'entityId': pick['entityId'], 'frame': info, 'whole': {'file': f'{pid}-whole.jpg', 'scale': s, 'width': w, 'height': h},
                 'checked': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    out = 'preview made'
    crop, sc = pick.get('crop'), s  # a hand-set crop is in whole-preview pixels
    if not crop:
        # a detailed overview (about 20 m a pixel for HEXAGON) to search for Tripoli; kept on the release for tuning
        fo = max(4, math.ceil(max(info['width'], info['height']) / 48000))
        ov = os.path.join(d, pid + '-overview.jpg')
        mem = gdal.Translate('', vrt, format='MEM', width=info['width'] // fo, height=info['height'] // fo, resampleAlg='average', **to_byte(info['dtype']))
        gdal.GetDriverByName('JPEG').CreateCopy(ov, mem, options=['QUALITY=85'])
        overview = mem.ReadAsArray(); mem = None
        try: meta['overview'] = {'url': upload(ov), 'reduced_by': fo}
        except Exception as e: print('overview upload failed', e)
        crop, agree = registrar().locate(overview, fo)
        meta['locate'] = {'crop_in_overview': crop, 'agree': agree}
        sc = fo
        if not crop:
            meta['locate_failed'] = True
            out = f'preview made; Tripoli not found automatically ({agree} matches agreed)'
    if crop:
        x, y, cw, ch = crop
        win = [max(0, round(x * sc)), max(0, round(y * sc))]
        win += [min(info['width'] - win[0], round(cw * sc)), min(info['height'] - win[1], round(ch * sc))]
        cut = os.path.join(d, pid + '.tif'); factor = 1
        while True:
            gdal.Translate(cut, vrt, srcWin=win, width=win[2] // factor, height=win[3] // factor, resampleAlg='average',
                           creationOptions=['COMPRESS=JPEG', 'JPEG_QUALITY=88', 'TILED=YES', 'BIGTIFF=IF_SAFER'], **to_byte(info['dtype']))
            if os.path.getsize(cut) < MAX_ASSET: break
            factor *= 2
        cs, cw2, ch2 = preview(cut, f'{PREV}/{pid}-cut.jpg', CUT_PREVIEW_LONG, 'Byte', grid_every=1000)
        meta['cut'] = {'window_in_frame': win, 'reduced_by': factor, 'file': f'{pid}-cut.jpg', 'scale': cs, 'width': cw2, 'height': ch2,
                       'grid_every_px': 1000, 'size_bytes': os.path.getsize(cut)}
        url = upload(cut)
        overlays.append(overlay_entry(pick, url))
        out = f'cut {win} (reduced {factor}x) uploaded to {url}'
    json.dump(meta, open(meta_path, 'w'), indent=1)
    shutil.rmtree(d, ignore_errors=True)
    return out

def main():
    user, tok = os.environ.get('USGS_USERNAME'), os.environ.get('USGS_TOKEN')
    if not user or not tok: raise RuntimeError('USGS_USERNAME / USGS_TOKEN secrets are missing')
    picks = json.load(open('archive/maps/usgs-picks.json'))
    only = set(filter(None, os.environ.get('USGS_ONLY', '').split(',')))
    overlays = json.load(open('archive/maps/overlays.json'))
    key = call('login-token', {'username': user, 'token': tok})
    status = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'frames': {}}
    try:
        for pick in picks:
            if only and pick['id'] not in only: continue
            try:
                status['frames'][pick['id']] = run(key, pick, overlays)
            except Exception as e:
                status['frames'][pick['id']] = 'ERROR ' + scrub(str(e))[:400]
            print(pick['id'], '->', status['frames'][pick['id']])
            json.dump(overlays, open('archive/maps/overlays.json', 'w'), indent=1, ensure_ascii=False)
            json.dump(status, open('archive/maps/usgs-download-status.json', 'w'), indent=1)
    finally:
        try: call('logout', {}, key)
        except Exception: pass

if __name__ == '__main__':
    main()
