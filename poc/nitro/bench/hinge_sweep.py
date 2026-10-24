"""Drive the emulator's hinge angle sensor through one console connection.
Usage: hinge_sweep.py <from> <to> [<to> ...] --hz 60 --step 1 [--port 5554]"""
import argparse, os, socket, time

p = argparse.ArgumentParser()
p.add_argument('angles', type=float, nargs='+')
p.add_argument('--hz', type=float, default=60)
p.add_argument('--step', type=float, default=1)
p.add_argument('--port', type=int, default=5554)
a = p.parse_args()

s = socket.create_connection(('127.0.0.1', a.port))
f = s.makefile('rwb', buffering=0)
def read_until_ok():
    while True:
        line = f.readline().decode().strip()
        if line.startswith('OK') or line.startswith('KO'):
            return line
token = open(os.path.expanduser('~/.emulator_console_auth_token')).read().strip()
read_until_ok()
f.write(f'auth {token}\n'.encode()); read_until_ok()

def send(angle):
    f.write(f'sensor set hinge-angle0 {angle:.1f}\n'.encode())
    r = read_until_ok()
    if r.startswith('KO'): raise SystemExit(r)

period = 1 / a.hz
sent = 0
t0 = time.perf_counter()
nxt = t0
for start, end in zip(a.angles, a.angles[1:]):
    direction = 1 if end >= start else -1
    angle = start
    while (angle - end) * direction <= 0:
        send(angle); sent += 1
        angle += direction * a.step
        nxt += period
        delay = nxt - time.perf_counter()
        if delay > 0: time.sleep(delay)
elapsed = time.perf_counter() - t0
print(f'sent={sent} elapsed={elapsed:.2f}s rate={sent/elapsed:.1f}Hz')
