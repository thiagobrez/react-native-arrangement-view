import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios, type Scenario } from './frames.ts';

interface Mutant {
  bug: string;
  file: string;
  find: string;
  replace: string;
  breaks: readonly Scenario[];
}

const MUTANTS: Mutant[] = [
  {
    bug: 'Pane placement commits on the JavaScript thread instead of before the next frame.',
    file: 'android/src/main/jni/ArrangementStateBridge.cpp',
    find: 'EventQueue::UpdateMode::unstable_Immediate',
    replace: 'EventQueue::UpdateMode::Asynchronous',
    breaks: ['hold', 'resize', 'mount'],
  },
  {
    bug: 'Pane placement runs after the frame it was measured for.',
    file: 'android/src/main/java/com/arrangementview/ArrangementView.kt',
    find: 'OnPreDrawListener {\n    pushEnvironment()',
    replace: 'OnPreDrawListener {\n    post { pushEnvironment() }',
    breaks: ['hold', 'resize', 'mount'],
  },
  {
    bug: "A new ArrangementView waits for WindowManager's first report before placing its panes.",
    file: 'android/src/main/java/com/arrangementview/ArrangementView.kt',
    find: 'if (WindowSdkExtensions.getInstance().extensionVersion >= 9) {',
    replace: 'if (false) {',
    breaks: ['mount'],
  },
];

const root = fileURLToPath(new URL('../../../', import.meta.url));
const app = fileURLToPath(new URL('../', import.meta.url));

function sh(command: string, args: string[], cwd = app, env = process.env) {
  return execFileSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function installRelease() {
  const abi = sh('adb', ['shell', 'getprop', 'ro.product.cpu.abi']).trim();
  sh(
    './gradlew',
    ['assembleRelease', `-PreactNativeArchitectures=${abi}`, '--console=plain'],
    join(app, 'android')
  );
  sh('adb', [
    'install',
    '-r',
    join(app, 'android/app/build/outputs/apk/release/app-release.apk'),
  ]);
}

type Result = 'ok' | 'failed' | 'missing';

/** Each scenario's result, read from the summary rows frames.e2e.ts writes. */
function runBudgets(): Map<Scenario, Result> {
  const summary = join(mkdtempSync(join(tmpdir(), 'frames-')), 'summary.md');
  writeFileSync(summary, '');
  try {
    sh('yarn', ['e2e', 'run', '--target', 'android', '--tag', 'frames'], app, {
      ...process.env,
      GITHUB_STEP_SUMMARY: summary,
    });
  } catch {
    // A failing budget fails the run; the rows below say which.
  }
  const rows = readFileSync(summary, 'utf8').split('\n');
  return new Map(
    (Object.keys(scenarios) as Scenario[]).map((key) => {
      const row = rows.find((line) =>
        line.startsWith(`| ${scenarios[key].title} |`)
      );
      // No row means the test stopped before judging; .e2e/report.json says why.
      const result: Result = !row
        ? 'missing'
        : row.endsWith('| ok |')
          ? 'ok'
          : 'failed';
      return [key, result];
    })
  );
}

const describe = (results: Map<Scenario, Result>) =>
  [...results].map(([key, result]) => `${key} ${result}`).join(', ');

if (!existsSync(join(app, 'android'))) {
  throw new Error('Run `yarn example expo prebuild --platform android` first.');
}

let restore: (() => void) | undefined;
process.on('SIGINT', () => {
  restore?.();
  process.exit(130);
});

const lines: string[] = [];
try {
  installRelease();
  const baseline = runBudgets();
  const healthy = [...baseline.values()].every((result) => result === 'ok');
  lines.push(
    `  ${healthy ? 'passed' : 'BROKEN'}  HEAD: ${describe(baseline)}` +
      (healthy ? '' : '; mutants prove nothing')
  );
  for (const mutant of healthy ? MUTANTS : []) {
    const path = join(root, mutant.file);
    const original = readFileSync(path, 'utf8');
    const label = `${mutant.bug}\n          ${mutant.file}: ${mutant.find} -> ${mutant.replace}`;
    if (!original.includes(mutant.find)) {
      lines.push(
        `  STALE   ${label}\n          the line is gone; update this mutant`
      );
      continue;
    }
    restore = () => writeFileSync(path, original);
    try {
      writeFileSync(path, original.replace(mutant.find, mutant.replace));
      installRelease();
      const results = runBudgets();
      const caught = mutant.breaks.every(
        (key) => results.get(key) === 'failed'
      );
      lines.push(
        `  ${caught ? 'caught' : 'MISSED'}  ${label}\n          ${describe(results)}; must fail ${mutant.breaks.join(', ')}`
      );
    } finally {
      restore();
      restore = undefined;
    }
  }
} finally {
  installRelease();
}
lines.forEach((line) => console.log(line));
const bad = lines.filter((line) => !/^ {2}(caught|passed)/.test(line)).length;
console.log(bad ? `${bad} result(s) need attention.` : 'Every mutant caught.');
process.exitCode = bad ? 1 : 0;
