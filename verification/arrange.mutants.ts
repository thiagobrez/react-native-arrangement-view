// Shows that each property in arrange.check.ts can fail: it breaks one line of
// src/arrange.ts or src/layout.ts at a time, in a copy, and expects the check
// to report the named property. Run with `yarn verify:arrange:mutants`.
import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface Mutant {
  file: 'arrange.ts' | 'layout.ts';
  find: string;
  replace: string;
  /** The property the check must report as failing. */
  breaks: string;
}

const MUTANTS: Mutant[] = [
  {
    // A hinge within hingeGap / 2 of the edge still splits, leaving a pane
    // with no room.
    file: 'arrange.ts',
    find: 'if (before > 0 && after < extent) {',
    replace: 'if (start > 0 && end < extent) {',
    breaks: 'no empty pane',
  },
  {
    // A hinge exactly hingeGap / 2 from the edge splits off a 0 dp pane.
    file: 'arrange.ts',
    find: 'if (before > 0 && after < extent) {',
    replace: 'if (before >= 0 && after <= extent) {',
    breaks: 'a hinge without room for the gap is ignored',
  },
  {
    // The gap ignores a hinge wider than hingeGap.
    file: 'arrange.ts',
    find: 'Math.max(end - start, hingeGap) / 2',
    replace: 'hingeGap / 2',
    breaks: 'clear of an avoided hinge',
  },
  {
    // A single pane beside a hinge spans it.
    file: 'arrange.ts',
    find: 'return { primary: split(axis, before, after).primary, secondary: null };',
    replace: 'return { primary: full, secondary: null };',
    breaks: 'clear of an avoided hinge',
  },
  {
    file: 'arrange.ts',
    find: 'Math.max(end - start, hingeGap) / 2',
    replace: 'Math.max(end - start, hingeGap) / 4',
    breaks: 'hingeGap between panes',
  },
  {
    // A separating hinge splits only where two panes fit anyway.
    file: 'arrange.ts',
    find: 'fold.separating ? allows(axis) : fits(axis)',
    replace: 'fits(axis)',
    breaks: 'a separating hinge always splits',
  },
  {
    // Tabletop is read from the window size alone.
    file: 'arrange.ts',
    find: 'const tabletop =',
    replace: 'const tabletop = false &&',
    breaks: 'tabletop shows both panes',
  },
  {
    file: 'arrange.ts',
    find: "const allows = (axis: Axis) => axes === 'both' || axes === axis;",
    replace: 'const allows = (_axis: Axis) => true;',
    breaks: 'axes is respected',
  },
  {
    // primaryEdge ignores RTL.
    file: 'arrange.ts',
    find: "(edge.horizontal === 'trailing') !== rtl",
    replace: "edge.horizontal === 'trailing'",
    breaks: 'primary on its edge',
  },
  {
    // A vertical primaryEdge reaches split's stacked panes too.
    file: 'arrange.ts',
    find: "arrangement === 'overlay' && edge.vertical",
    replace: 'edge.vertical',
    breaks: 'primary on its edge',
  },
  {
    // A pair is read vertical first.
    file: 'arrange.ts',
    find: 'const [horizontal, vertical] = value;',
    replace: 'const [vertical, horizontal] = value;',
    breaks: 'primary on its edge',
  },
  {
    // Overlay's primary pane goes before the hinge.
    file: 'arrange.ts',
    find: "split(axis, before, after, arrangement === 'overlay')",
    replace: 'split(axis, before, after)',
    breaks: 'primary on its edge',
  },
  {
    // The pane after the span runs on past the arrangement's end.
    file: 'arrange.ts',
    find: '{ ...full, left: end, width: width - end }',
    replace: '{ ...full, left: end, width: width - start }',
    breaks: 'inside the arrangement',
  },
  {
    // The pane before the span runs on past it.
    file: 'arrange.ts',
    find: '{ ...full, width: start }',
    replace: '{ ...full, width: width - start }',
    breaks: 'split panes do not overlap',
  },
  {
    file: 'layout.ts',
    find: "axis: columns ? 'vertical' : 'horizontal'",
    replace: "axis: columns ? 'horizontal' : 'vertical'",
    breaks: 'layout matches the frames',
  },
];

const src = (file: string) =>
  fileURLToPath(new URL(`../src/${file}`, import.meta.url));
// Inside the repo, so the copies resolve node_modules as src does.
const scratch = fileURLToPath(new URL('./.mutants/', import.meta.url));
const check = fileURLToPath(new URL('./arrange.check.ts', import.meta.url));

// Each mutant runs the whole check, so they run side by side, one per core.
async function run(mutant: Mutant, i: number) {
  const original = readFileSync(src(mutant.file), 'utf8');
  const label = `${mutant.file}: ${mutant.find} -> ${mutant.replace}`;
  if (!original.includes(mutant.find))
    return `  STALE   ${label}\n          the line is gone; update this mutant`;
  const copy = `${scratch}${i}-${mutant.file}`;
  writeFileSync(copy, original.replace(mutant.find, mutant.replace));
  const env = {
    ...process.env,
    [mutant.file === 'arrange.ts' ? 'ARRANGE_SOURCE' : 'LAYOUT_SOURCE']: copy,
  };
  const { stdout } = await execFileAsync(
    process.execPath,
    ['--no-warnings', check],
    { env, maxBuffer: 1_048_576 }
  ).catch((error: { stdout: string }) => error);
  const caught = stdout.includes(`FAIL  ${mutant.breaks}:`);
  return `  ${caught ? 'caught' : 'MISSED'}  ${mutant.breaks}  (${label})`;
}

mkdirSync(scratch, { recursive: true });
const lines: string[] = [];
try {
  let next = 0;
  const worker = async () => {
    while (next < MUTANTS.length) {
      const i = next++;
      lines[i] = await run(MUTANTS[i]!, i);
    }
  };
  await Promise.all(Array.from({ length: availableParallelism() }, worker));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
lines.forEach((line) => console.log(line));
const missed = lines.filter((line) => !line.startsWith('  caught')).length;
console.log(
  missed ? `${missed} mutant(s) not caught.` : 'Every mutant caught.'
);
process.exitCode = missed ? 1 : 0;
