"""Usage: python3 -I diff.py <dir a> <dir b>
Counts differing pixels between same-named PNGs, below a 120 px status bar whose clock differs."""
import pathlib, subprocess, sys

def rgb(path):
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height',
                            '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout
    w, h = map(int, probe.strip().split(','))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    return w, h, raw

a, b = map(pathlib.Path, sys.argv[1:3])
for pa in sorted(a.glob('*.png')):
    pb = b / pa.name
    if not pb.exists():
        continue
    wa, ha, ra = rgb(pa)
    wb, hb, rb = rgb(pb)
    if (wa, ha) != (wb, hb):
        print(f'{pa.name}: size {wa}x{ha} vs {wb}x{hb}')
        continue
    start = 120 * wa * 3
    diff = sum(1 for i in range(start, len(ra), 3) if ra[i:i + 3] != rb[i:i + 3])
    print(f'{pa.name}: {diff} of {wa * (ha - 120)} pixels differ below the status bar')
