"""Summarise RAVBENCH logcat captures.

Usage: analyze.py <capture.log> [...]  (adb logcat -v monotonic output)

For every fold state change, attach, and window resize it finds the first
drawn frame whose pane frames equal the frames the arrangement settles on
before the next event, and reports the time to it and the frames drawn
before it.
"""
import re, statistics, sys

LINE = re.compile(r'^\s*(\d+\.\d+)\s+\d+\s+\d+\s+\w\s+(RAVBENCH|ReactNativeJS)\s*:\s*(.*)$')


def parse(path):
    events = []
    for raw in open(path, errors='replace'):
        m = LINE.match(raw)
        if not m:
            continue
        logtime, tag, msg = float(m.group(1)), m.group(2), m.group(3)
        if tag == 'ReactNativeJS':
            if 'RAVBENCH render' in msg:
                events.append({'kind': 'render', 't': logtime * 1e9})
            continue
        kind, rest = msg.split(' ', 1)
        fields = dict(re.findall(r'(\w+)=(\S+)', rest))
        fields['kind'] = kind
        fields['t'] = int(fields['t'])
        events.append(fields)
    events.sort(key=lambda e: e['t'])
    return events


def panes(draw):
    return (draw['p'], draw['s'])


def settle(draws, start, end):
    """First draw in [start, end) showing the frames held at the end of the window."""
    window = [d for d in draws if start <= d['t'] < end]
    if not window:
        return None, 0
    final = panes(window[-1])
    first = next(i for i, d in enumerate(window) if all(panes(x) == final for x in window[i:]))
    return window[first], first


def analyze(path):
    events = parse(path)
    draws = [e for e in events if e['kind'] == 'draw']
    renders = [e for e in events if e['kind'] == 'render']
    marks = [e for e in events if e['kind'] in ('fold', 'attach')]
    resizes, last_win = [], None
    for d in draws:
        if last_win and d['win'] != last_win:
            resizes.append({'kind': 'resize', 't': d['t'], 'id': d['id'], 'win': d['win']})
        last_win = d['win']
    out = {'fold': [], 'attach': [], 'resize': []}
    # Only a fold state that differs from the last one is a change; the first
    # report after an attach is part of that mount.
    changes, last_state = [], None
    for e in sorted(marks + resizes, key=lambda e: e['t']):
        if e['kind'] == 'fold':
            changed = last_state is not None and e['state'] != last_state
            last_state = e['state']
            if not changed:
                continue
        changes.append(e)
    for i, e in enumerate(changes):
        nxt = changes[i + 1]['t'] if i + 1 < len(changes) else float('inf')
        own = [d for d in draws if d['id'] == e['id']]
        before = [d for d in own if d['t'] < e['t']]
        target, stale = settle(own, e['t'], nxt)
        if target is None:
            continue
        if e['kind'] == 'fold' and before and panes(before[-1]) == panes(target):
            continue
        n_renders = sum(1 for r in renders if e['t'] <= r['t'] <= target['t'])
        out[e['kind']].append({
            'ms': (target['t'] - e['t']) / 1e6,
            'stale_frames': stale,
            'renders': n_renders,
            'to': e.get('state') or e.get('win') or '',
        })
    return out


def summary(rows):
    if not rows:
        return 'n=0'
    ms = sorted(r['ms'] for r in rows)
    stale = [r['stale_frames'] for r in rows]
    renders = [r['renders'] for r in rows]
    return (f"n={len(ms)} median={statistics.median(ms):.1f}ms "
            f"range={ms[0]:.1f}-{ms[-1]:.1f}ms "
            f"stale_frames median={statistics.median(stale)} max={max(stale)} "
            f"js_renders median={statistics.median(renders)}")


if __name__ == '__main__':
    for path in sys.argv[1:]:
        result = analyze(path)
        print(path)
        for kind, rows in result.items():
            print(f'  {kind:7} {summary(rows)}')
