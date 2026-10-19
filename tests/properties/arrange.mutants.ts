import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface Mutant {
  bug: string;
  file: 'arrange.h' | 'primaryEdge.ts' | 'layout.ts';
  find: string;
  replace: string;
  breaks: string;
}

const MUTANTS: Mutant[] = [
  {
    bug: 'A hinge whose gap reaches or runs past the edge is still avoided, so a pane shown on that side has zero or negative size.',
    file: 'arrange.h',
    find: 'if (before > 0 && after < extent) {',
    replace: 'if (start > 0 && end < extent) {',
    breaks: 'no empty pane',
  },
  {
    bug: 'A hinge whose gap ends exactly on the edge is still avoided, so a pane shown on that side has zero size.',
    file: 'arrange.h',
    find: 'if (before > 0 && after < extent) {',
    replace: 'if (before >= 0 && after <= extent) {',
    breaks: 'a hinge without room for the gap is ignored',
  },
  {
    bug: 'The gap ignores a hinge wider than hingeGap.',
    file: 'arrange.h',
    find: 'jsMax(end - start, hingeGap) / 2',
    replace: 'hingeGap / 2',
    breaks: 'clear of an avoided hinge',
  },
  {
    bug: 'A single pane beside a hinge spans it.',
    file: 'arrange.h',
    find: 'return {split(axis, before, after).primary, std::nullopt};',
    replace: 'return {full, std::nullopt};',
    breaks: 'clear of an avoided hinge',
  },
  {
    bug: 'The gap around a hinge is half as wide.',
    file: 'arrange.h',
    find: 'jsMax(end - start, hingeGap) / 2',
    replace: 'jsMax(end - start, hingeGap) / 4',
    breaks: 'hingeGap between panes',
  },
  {
    bug: 'A separating hinge splits only where two panes fit anyway.',
    file: 'arrange.h',
    find: 'fold->separating ? allows(axis) : fits(axis)',
    replace: 'fits(axis)',
    breaks: 'a separating hinge always splits',
  },
  {
    bug: 'Tabletop is read from the window size alone.',
    file: 'arrange.h',
    find: 'const bool tabletop =',
    replace: 'const bool tabletop = false &&',
    breaks: 'tabletop shows both panes',
  },
  {
    bug: 'Panes split along an axis that axes excludes.',
    file: 'arrange.h',
    find: 'const auto allows = [&](Axis axis) { return axes == Axes::Both || axes == axis; };',
    replace: 'const auto allows = [&](Axis) { return true; };',
    breaks: 'axes is respected',
  },
  {
    bug: 'primaryEdge ignores RTL.',
    file: 'arrange.h',
    find: '(primaryEdge == HorizontalEdge::Trailing) != rtl',
    replace: 'primaryEdge == HorizontalEdge::Trailing',
    breaks: 'primary on its edge',
  },
  {
    bug: "A vertical primaryEdge reaches split's stacked panes too.",
    file: 'arrange.h',
    find: 'arrangement == Arrangement::Overlay && primaryVerticalEdge',
    replace: 'primaryVerticalEdge',
    breaks: 'primary on its edge',
  },
  {
    bug: 'A pair is read vertical first.',
    file: 'primaryEdge.ts',
    find: 'const [horizontal, vertical] = value;',
    replace: 'const [vertical, horizontal] = value;',
    breaks: 'primary on its edge',
  },
  {
    bug: "Overlay's primary pane goes before the hinge.",
    file: 'arrange.h',
    find: 'split(axis, before, after, arrangement == Arrangement::Overlay)',
    replace: 'split(axis, before, after)',
    breaks: 'primary on its edge',
  },
  {
    bug: "The pane after a vertical hinge is measured from the gap's start to the far edge, so it runs past that edge by the gap's width.",
    file: 'arrange.h',
    find: 'Frame{end, 0, width - end, height}',
    replace: 'Frame{end, 0, width - start, height}',
    breaks: 'inside the arrangement',
  },
  {
    bug: 'The pane before the span runs on past it.',
    file: 'arrange.h',
    find: 'Frame{0, 0, start, height}',
    replace: 'Frame{0, 0, width - start, height}',
    breaks: 'split panes do not overlap',
  },
  {
    bug: 'describeLayout swaps the two axes.',
    file: 'layout.ts',
    find: "axis: columns ? 'vertical' : 'horizontal'",
    replace: "axis: columns ? 'horizontal' : 'vertical'",
    breaks: 'layout matches the frames',
  },
];

const source = (file: Mutant['file']) =>
  fileURLToPath(
    new URL(
      `../../${file === 'arrange.h' ? 'cpp' : 'src'}/${file}`,
      import.meta.url
    )
  );
// Inside the repo, so the copies resolve node_modules as src does.
const scratch = fileURLToPath(new URL('./.mutants/', import.meta.url));
const check = fileURLToPath(new URL('./arrange.check.ts', import.meta.url));

async function run(mutant: Mutant, i: number) {
  const original = readFileSync(source(mutant.file), 'utf8');
  const label = `${mutant.breaks}: ${mutant.bug}\n          ${mutant.file}: ${mutant.find} -> ${mutant.replace}`;
  if (!original.includes(mutant.find))
    return `  STALE   ${label}\n          the line is gone; update this mutant`;
  const dir = `${scratch}${i}/`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    `${dir}${mutant.file}`,
    original.replace(mutant.find, mutant.replace)
  );
  const variable = {
    'arrange.h': 'ARRANGE_CPP_DIR',
    'primaryEdge.ts': 'PRIMARY_EDGE_SOURCE',
    'layout.ts': 'LAYOUT_SOURCE',
  }[mutant.file];
  const env = {
    ...process.env,
    [variable]: mutant.file === 'arrange.h' ? dir : `${dir}${mutant.file}`,
  };
  const { stdout } = await execFileAsync(
    process.execPath,
    ['--no-warnings', check],
    { env, maxBuffer: 1_048_576 }
  ).catch((error: { stdout: string }) => error);
  const caught = stdout.includes(`FAIL  ${mutant.breaks}:`);
  return `  ${caught ? 'caught' : 'MISSED'}  ${label}`;
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
