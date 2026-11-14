import { execFile } from 'node:child_process';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface Mutant {
  bug: string;
  file: string;
  edits: [find: string, replace: string][];
}

const MUTANTS: Mutant[] = [
  {
    bug: 'Android ArrangementView reads the hinge and passes its angle to the native view.',
    file: 'ArrangementView.android.tsx',
    edits: [
      [
        "import { StyleSheet, View } from 'react-native';",
        "import { useSyncExternalStore } from 'react';\nimport { StyleSheet, View } from 'react-native';",
      ],
      [
        'const onPanesChange = usePanesChange(layoutStore);',
        'const onPanesChange = usePanesChange(layoutStore);\n  const hinge = useSyncExternalStore(store.subscribe, store.getSnapshot);',
      ],
      [
        'onPanesChange={onPanesChange}',
        'onPanesChange={onPanesChange}\n          hingeAngle={hinge.angle}',
      ],
    ],
  },
  {
    bug: 'The hinge store notifies on a sample equal to the last one.',
    file: 'hinge.ts',
    edits: [['next.available === current.available &&', 'false &&']],
  },
  {
    bug: 'The layout store notifies on a layout equal to the last one.',
    file: 'layout.ts',
    edits: [
      ['next?.secondaryVisible === current?.secondaryVisible &&', 'false &&'],
    ],
  },
  {
    bug: 'useHingeSelector renders on every hinge change, not only when its value changes.',
    file: 'hinge.ts',
    edits: [
      [
        'return useSyncExternalStore(store.subscribe, select, select);',
        'useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);\n  return select();',
      ],
    ],
  },
  {
    bug: "Android ArrangementView gives the hinge context a new value on every render, so a parent's render reaches every hinge reader.",
    file: 'ArrangementView.android.tsx',
    edits: [
      ['<HingeContext value={store}>', '<HingeContext value={{ ...store }}>'],
    ],
  },
  {
    bug: 'useHingeChange mirrors the hinge into state, an extra render per change.',
    file: 'hinge.ts',
    edits: [
      [
        '    callback.current?.(hinge);\n  }, [hinge]);',
        '    callback.current?.(hinge);\n  }, [hinge]);\n  const [, mirror] = useState(hinge);\n  useEffect(() => mirror(hinge), [hinge]);',
      ],
    ],
  },
];

const root = fileURLToPath(new URL('../../', import.meta.url));
const loader = fileURLToPath(new URL('./loader.ts', import.meta.url));
// Inside the repo, so the copies resolve node_modules as src does.
const scratch = fileURLToPath(new URL('./.mutants/', import.meta.url));

async function runTests(suite: string, sourceDir: string) {
  const args = ['--no-warnings', '--import', loader, '--test', suite];
  const env = { ...process.env, BUDGETS_SRC: sourceDir };
  const { stdout } = await execFileAsync(process.execPath, args, {
    cwd: root,
    env,
    maxBuffer: 16_777_216,
  }).catch((error: { stdout: string }) => error);
  const count = (label: string) =>
    Number(new RegExp(`^ℹ ${label} (\\d+)$`, 'm').exec(stdout)?.[1]);
  // A mutant that crashes the suite proves nothing about the budgets.
  const crashed = count('fail') > 0 && !stdout.includes('ERR_ASSERTION');
  return { tests: count('tests'), failed: count('fail'), crashed };
}

async function run(name: string, mutant?: Mutant) {
  const dir = `${scratch}${name}`;
  cpSync(`${root}src`, dir, { recursive: true });
  if (mutant) {
    const path = `${dir}/${mutant.file}`;
    let text = readFileSync(path, 'utf8');
    for (const [find, replace] of mutant.edits) {
      if (!text.includes(find))
        throw new Error(`Stale mutant: ${mutant.file} has no ${find}`);
      text = text.replace(find, replace);
    }
    writeFileSync(path, text);
  }
  const [budgets, existing] = await Promise.all([
    runTests('tests/budgets/*.test.ts', dir),
    runTests('tests/*.test.ts', dir),
  ]);
  return { budgets, existing };
}

const lines: string[] = [];
try {
  const head = await run('head');
  if (head.budgets.failed || head.existing.failed)
    throw new Error(
      `Unmutated src must pass first: budgets fail ${head.budgets.failed}, yarn test fails ${head.existing.failed}.`
    );
  const results = await Promise.all(
    MUTANTS.map((mutant, i) => run(String(i), mutant))
  );
  results.forEach(({ budgets, existing }, i) => {
    const verdict = budgets.crashed
      ? 'CRASHED'
      : budgets.failed
        ? 'caught '
        : 'MISSED ';
    lines.push(
      `  ${verdict} ${MUTANTS[i]!.bug}\n          ${MUTANTS[i]!.file}: ${budgets.failed} of ${budgets.tests} budgets fail; yarn test ${existing.failed ? `fails ${existing.failed}` : 'misses it'}`
    );
  });
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
lines.forEach((line) => console.log(line));
const missed = lines.filter((line) => !line.startsWith('  caught')).length;
console.log(
  missed
    ? `${missed} mutant(s) not caught.`
    : 'The budgets caught every mutant.'
);
process.exitCode = missed ? 1 : 0;
