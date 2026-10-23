"""Compare final-<side>-<scenario>-<round>.log captures side by side.

Per scenario and side: every event pooled across rounds (median, p90, max),
the per-round medians, frames drawn with stale or hidden panes, React renders
of ArrangementView, and events that never settled (counted as errors).
"""
import collections, pathlib, re, statistics, sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from analyze import analyze, parse

KIND = {'fold': 'fold', 'fold-load': 'fold', 'remount': 'attach', 'unfold': 'resize'}
NAME = re.compile(r'-(base|nativec|native)-(fold-load|fold|remount|unfold)-(\d+)\.log$')


def pct(values, p):
    values = sorted(values)
    return values[min(len(values) - 1, int(round(p / 100 * (len(values) - 1))))]


rows = collections.defaultdict(lambda: collections.defaultdict(list))
expected = collections.defaultdict(lambda: collections.defaultdict(int))
for path in sys.argv[1:]:
    m = NAME.search(path)
    if not m:
        continue
    side, scenario, rnd = m.group(1), m.group(2), int(m.group(3))
    events = analyze(path)[KIND[scenario]]
    rows[scenario][side].append((rnd, events))
    folds = [e for e in parse(path) if e['kind'] == 'fold']
    changes = sum(1 for a, b in zip(folds, folds[1:]) if a['state'] != b['state'])
    expected[scenario][side] += changes if scenario.startswith('fold') else 0

for scenario in ['fold', 'fold-load', 'remount', 'unfold']:
    if scenario not in rows:
        continue
    print(f'\n{scenario}')
    for side in [s for s in ['base', 'native', 'nativec'] if rows[scenario][s]]:
        runs = sorted(rows[scenario][side])
        pooled = [e for _, events in runs for e in events]
        if not pooled:
            print(f'  {side:6} no events')
            continue
        ms = [e['ms'] for e in pooled]
        per_round = [round(statistics.median([e['ms'] for e in ev]), 1) for _, ev in runs if ev]
        stale = [e['stale_frames'] for e in pooled]
        renders = [e['renders'] for e in pooled]
        missing = ''
        if scenario.startswith('fold'):
            missing = f' unsettled={expected[scenario][side] - len(pooled)}'
        print(f'  {side:6} n={len(ms):3} median={statistics.median(ms):6.1f}ms p90={pct(ms, 90):6.1f}ms '
              f'max={max(ms):6.1f}ms  rounds={per_round}  '
              f'stale/hidden frames: total={sum(stale)} max={max(stale)}  '
              f'renders/event median={statistics.median(renders)}{missing}')
