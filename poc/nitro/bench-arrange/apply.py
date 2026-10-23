"""Apply or remove the temporary benchmark instrumentation in a checkout.

Usage: apply.py <repo> apply|remove [--component src/ArrangementView.android.tsx]
The hooks go at the same points on every build: when the ArrangementView is
attached, when WindowManager reports the window layout, and when the JS
component renders.
"""
import argparse, pathlib, re, shutil, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
p = argparse.ArgumentParser()
p.add_argument('repo')
p.add_argument('mode', choices=['apply', 'remove'])
p.add_argument('--component', default=None)
a = p.parse_args()
repo = pathlib.Path(a.repo).resolve()

KT = repo / 'android/src/main/java/com/arrangementview/ArrangementView.kt'
PROBE = repo / 'android/src/main/java/com/arrangementview/BenchProbe.kt'
APP = repo / 'apps/example-expo/src/App.tsx'
SCREEN = repo / 'apps/example-expo/src/Bench.tsx'
component = a.component or next(
    c for c in ['src/ArrangementView.android.tsx', 'src/ArrangementView.native.tsx']
    if (repo / c).exists())
JS = repo / component

def insert_after(path, anchor_re, line, marker):
    text = path.read_text()
    if marker in text:
        return
    m = re.search(anchor_re, text, re.M)
    if not m:
        sys.exit(f'anchor {anchor_re!r} not found in {path}')
    end = text.index('\n', m.end()) + 1
    indent = re.match(r'\s*', text[m.start():]).group(0).lstrip('\n')
    text = text[:end] + line + '\n' + text[end:]
    path.write_text(text)

if a.mode == 'remove':
    for f in [PROBE, SCREEN]:
        f.unlink(missing_ok=True)
    subprocess.run(['git', '-C', str(repo), 'checkout', '--', str(KT), str(APP), str(JS)], check=True)
    sys.exit(0)

shutil.copy(HERE / 'BenchProbe.kt', PROBE)
shutil.copy(HERE / 'Bench.tsx', SCREEN)
insert_after(KT, r'^\s*super\.onAttachedToWindow\(\)', '    BenchProbe.attach(this) // RAVBENCH', 'BenchProbe.attach')
insert_after(KT, r'Consumer<WindowLayoutInfo> \{ info ->',
             '    BenchProbe.fold(this, info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()?.state) // RAVBENCH',
             'BenchProbe.fold')
insert_after(JS, r'^\}: ArrangementViewProps\) \{', "  console.log('RAVBENCH render');", 'RAVBENCH render')
app = APP.read_text()
if 'Bench' not in app:
    app = app.replace("import { examples } from './examples';",
                      "import { examples } from './examples';\nimport { Bench } from './Bench';")
    app = app.replace('<Stack.Navigator\n', '<Stack.Navigator\n            initialRouteName="bench"\n', 1)
    app = app.replace('            {examples.map(',
                      '            <Stack.Screen name="bench" component={Bench} options={{ headerShown: false }} />\n            {examples.map(', 1)
    APP.write_text(app)
print('applied to', repo, 'component', component)
