"""Usage: python3 -I hinge-report.py <run.json> [...]
Median and range per (mode, render, load) over hinge-bench.sh outputs."""
import json, statistics, sys
from collections import defaultdict

FIELDS = ['count', 'sent', 'badT', 'p50', 'p90', 'p99', 'max', 'jsCpuMs', 'mainCpuMs', 'jsUsPerEvent',
          'commitCount', 'commitP50', 'e2eCount', 'e2eUnmatched', 'e2eP50', 'e2eP90', 'e2eP99', 'e2eMax', 'offsetMs']
groups = defaultdict(list)
for path in sys.argv[1:]:
    r = json.load(open(path))
    if r.get('count'):
        r['jsUsPerEvent'] = r['jsCpuMs'] * 1000 / r['count']
    for k, v in (r.get('e2e') or {}).items():
        r['e2e' + k[0].upper() + k[1:]] = v
    groups[(r['mode'], r['render'], r['load'])].append(r)

for (mode, render, load), runs in sorted(groups.items(), key=lambda kv: str(kv[0])):
    print(f'{mode} render={int(render)} load={load} runs={len(runs)}')
    for f in FIELDS:
        xs = [r[f] for r in runs if isinstance(r.get(f), (int, float))]
        if xs:
            print(f'  {f:10} median {statistics.median(xs):10.3f}  range {min(xs):.3f}..{max(xs):.3f}')
