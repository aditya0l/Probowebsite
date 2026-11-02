#!/usr/bin/env python3
"""Prepare photos and video clips for the site, from the original files.

  python3 tools/media.py video ~/Downloads/IMG_6091.MOV banner            # whole clip
  python3 tools/media.py video IMG_6094.MOV cardio-row --start 2 --dur 8  # a cut
  python3 tools/media.py image ~/Downloads/DSC_0412.jpg products/press-front
  python3 tools/media.py images ~/Downloads/catalogue-shoot products       # a whole folder
  python3 tools/media.py check                                             # what still lacks modern formats

Always feed it the camera original (not a WhatsApp or screenshot copy): every output is made from it once.

Video, into assets/v/:  NAME.av1.mp4 (Chrome, Android, Firefox, newer iPhones), NAME.hevc.mp4 (every iPhone and
Mac, most Android), NAME.mp4 (H.264, plays everywhere) and the poster NAME.jpg. The page plays the smallest one the
device can decode, so quality is the same everywhere and phones download about half. iPhone HDR footage is converted
to normal colour first (otherwise reds and yellows look washed out on the web). No audio: clips play muted.

Photos, into assets/img/:  NAME.jpg (fallback) plus NAME-800/-1200/-1600/-2400 in AVIF and WebP, never upscaled.
tools/build_pages.py turns every <img> of it into a <picture> so each screen gets the right width and format.
"""
import argparse, json, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VID, IMG = ROOT / 'assets' / 'v', ROOT / 'assets' / 'img'
WIDTHS = (800, 1200, 1600, 2400)
run = lambda *a: subprocess.run([str(x) for x in a], check=True, capture_output=True)


def probe(src):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,color_transfer:stream_side_data=rotation',
                          '-show_entries', 'format=duration', '-of', 'json', str(src)], check=True, capture_output=True, text=True).stdout
    d = json.loads(out); s = d['streams'][0]
    rot = abs(int(next((x.get('rotation', 0) for x in s.get('side_data_list', [])), 0)))
    w, h = (s['height'], s['width']) if rot in (90, 270) else (s['width'], s['height'])
    return w, h, s.get('color_transfer', ''), float(d['format']['duration'])


def video(src, name, start=0.0, dur=None, width=1920, poster_at=0.3):
    src = Path(src).expanduser(); w, h, trc, total = probe(src)
    dur = dur or total - start
    tmp = Path(tempfile.mkdtemp())
    if trc in ('arib-std-b67', 'smpte2084'):
        # HDR (iPhone default): Apple's own converter maps it to normal web colour
        if not shutil.which('avconvert'): sys.exit('This clip is HDR. Run on a Mac (avconvert) or export it as SDR first.')
        sdr = tmp / 'sdr.mov'
        run('avconvert', '-s', src, '-p', 'Preset3840x2160' if max(w, h) > 1920 else 'Preset1920x1080', '-o', sdr, '--start', start, '--duration', dur, '--replace')
        src, start = sdr, 0
        print('  HDR converted to SDR')
    long_edge = min(width, max(w, h))
    scale = f'scale={long_edge}:-2' if w >= h else f'scale=-2:{long_edge}'
    # light denoise: phone sensor noise costs bitrate and looks like grain once compressed
    vf = f'{scale}:flags=lanczos,fps=30,hqdn3d=1.2:1.2:5:5,format=yuv420p'
    cut = ['-ss', start, '-t', dur, '-i', src, '-an', '-vf', vf, '-g', 60, '-movflags', '+faststart']
    out = {'av1': VID / f'{name}.av1.mp4', 'hevc': VID / f'{name}.hevc.mp4', 'h264': VID / f'{name}.mp4'}
    VID.mkdir(parents=True, exist_ok=True)
    run('ffmpeg', '-v', 'error', '-y', *cut, '-c:v', 'libsvtav1', '-preset', 5, '-crf', 42, '-svtav1-params', 'tune=0', out['av1'])
    run('ffmpeg', '-v', 'error', '-y', *cut, '-c:v', 'libx265', '-preset', 'medium', '-crf', 28, '-tag:v', 'hvc1', '-x265-params', 'log-level=error', out['hevc'])
    run('ffmpeg', '-v', 'error', '-y', *cut, '-c:v', 'libx264', '-preset', 'slow', '-crf', 26, '-profile:v', 'high', out['h264'])
    run('ffmpeg', '-v', 'error', '-y', '-ss', poster_at, '-i', out['h264'], '-frames:v', 1, '-q:v', 5, VID / f'{name}.jpg')
    shutil.rmtree(tmp, ignore_errors=True)
    for k, p in out.items(): print(f'  {p.name:<28} {p.stat().st_size / 1e6:5.1f} MB')
    print(f'  {name}.jpg poster. Use it with vid("{name}") in tools/build_pages.py, then rebuild.')


def image(src, name, max_w=2400):
    src = Path(src).expanduser(); tmp = Path(tempfile.mkdtemp())
    if src.suffix.lower() == '.heic':  # iPhone photos: macOS decodes them
        p = tmp / 'src.png'; run('sips', '-s', 'format', 'png', src, '--out', p); src = p
    w, h, _, _ = probe(src)
    base = IMG / name; base.parent.mkdir(parents=True, exist_ok=True)
    for tw in sorted({min(x, w) for x in WIDTHS if x <= max_w}):
        png = tmp / f'{tw}.png'
        run('ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f'scale={tw}:-2:flags=lanczos', '-frames:v', 1, png)
        run('avifenc', '-q', 62, '-s', 6, '-j', 'all', png, f'{base}-{tw}.avif')
        run('cwebp', '-quiet', '-q', 80, '-m', 6, png, '-o', f'{base}-{tw}.webp')
    big = min(w, 1920)
    run('ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f'scale={big}:-2:flags=lanczos', '-frames:v', 1, '-q:v', 3, f'{base}.jpg')
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'  assets/img/{name}.jpg + AVIF/WebP at', ', '.join(sorted({str(min(x, w)) for x in WIDTHS})))


def check():
    miss = [p.name for p in sorted(VID.glob('*.mp4')) if p.name.count('.') == 1 and not (VID / p.name.replace('.mp4', '.hevc.mp4')).exists()]
    print('clips without AV1/HEVC versions:', ', '.join(miss) or 'none')
    miss = [str(p.relative_to(IMG)) for p in sorted(IMG.rglob('*.jpg')) if not p.with_name(p.stem + '-800.avif').exists()]
    print('photos without AVIF/WebP sizes:', ', '.join(miss) or 'none')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    v = sub.add_parser('video'); v.add_argument('src'); v.add_argument('name'); v.add_argument('--start', type=float, default=0); v.add_argument('--dur', type=float); v.add_argument('--width', type=int, default=1920); v.add_argument('--poster-at', type=float, default=.3)
    i = sub.add_parser('image'); i.add_argument('src'); i.add_argument('name')
    ii = sub.add_parser('images'); ii.add_argument('folder'); ii.add_argument('prefix')
    sub.add_parser('check')
    a = ap.parse_args()
    if a.cmd == 'video': video(a.src, a.name, a.start, a.dur, a.width, a.poster_at)
    elif a.cmd == 'image': image(a.src, a.name)
    elif a.cmd == 'images':
        for f in sorted(Path(a.folder).expanduser().iterdir()):
            if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff', '.webp'):
                print(f.name); image(f, f'{a.prefix}/{f.stem.lower().replace(" ", "-")}')
    else: check()
