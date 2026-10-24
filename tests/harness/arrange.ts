import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Frame, PaneFrames } from '../../src/layout.ts';
import type {
  Arrangement,
  ArrangementAxes,
  HingePolicy,
  HorizontalEdge,
  PrimaryEdge,
  VerticalEdge,
} from '../../src/types.ts';

const { resolvePrimaryEdge }: typeof import('../../src/primaryEdge.ts') =
  await import(process.env.PRIMARY_EDGE_SOURCE ?? '../../src/primaryEdge.ts');

export type { Frame, PaneFrames };

export interface Fold {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'vertical' | 'horizontal';
  separating: boolean;
  halfOpened: boolean;
}

export interface Geometry {
  width: number;
  height: number;
  window: Readonly<{ width: number; height: number }>;
  fold?: Readonly<Fold>;
}

export interface ArrangeOptions {
  arrangement: Arrangement;
  axes: ArrangementAxes;
  hingePolicy?: HingePolicy;
  hingeGap?: number;
  primaryEdge?: PrimaryEdge | readonly [HorizontalEdge, VerticalEdge];
  rtl?: boolean;
}

export interface Case {
  geometry: Geometry;
  options: ArrangeOptions;
}

const here = fileURLToPath(new URL('.', import.meta.url));
const policyDir =
  process.env.ARRANGE_CPP_DIR ??
  fileURLToPath(new URL('../../cpp/', import.meta.url));

function compileAtomically(compiler: string, flags: string[], binary: string) {
  const building = `${binary}.${process.pid}`;
  execFileSync(compiler, [...flags, join(here, 'harness.cpp'), '-o', building]);
  renameSync(building, binary);
}

function cachedHarnessBinary() {
  const compiler = process.env.CXX ?? 'c++';
  const flags = ['-std=c++20', '-O2', '-ffp-contract=off', `-I${policyDir}`];
  const hash = createHash('sha256').update([compiler, ...flags].join(' '));
  for (const file of [join(policyDir, 'arrange.h'), join(here, 'harness.cpp')])
    hash.update(readFileSync(file));
  const dir = join(tmpdir(), 'arrangement-view-harness');
  const binary = join(dir, hash.digest('hex').slice(0, 16));
  if (!existsSync(binary)) {
    mkdirSync(dir, { recursive: true });
    compileAtomically(compiler, flags, binary);
  }
  return binary;
}
const binary = cachedHarnessBinary();

const DOUBLES_PER_CASE = 19;
const DOUBLES_PER_RESULT = 9;
const code = {
  arrangement: { split: 0, overlay: 1 },
  axes: { both: 0, horizontal: 1, vertical: 2 },
  hingePolicy: { avoidSeparating: 0, alwaysAvoid: 1, neverAvoid: 2 },
  horizontal: { auto: 0, leading: 1, trailing: 2 },
  vertical: { auto: 0, top: 1, bottom: 2 },
} as const;

export function arrangeAll(cases: readonly Case[]): PaneFrames[] {
  const input = new Float64Array(cases.length * DOUBLES_PER_CASE);
  cases.forEach(({ geometry: g, options: o }, i) => {
    const edge = resolvePrimaryEdge(o.primaryEdge);
    const r = i * DOUBLES_PER_CASE;
    input[r] = g.width;
    input[r + 1] = g.height;
    input[r + 2] = g.window.width;
    input[r + 3] = g.window.height;
    if (g.fold) {
      input[r + 4] = 1;
      input[r + 5] = g.fold.x;
      input[r + 6] = g.fold.y;
      input[r + 7] = g.fold.width;
      input[r + 8] = g.fold.height;
      input[r + 9] = g.fold.orientation === 'vertical' ? 1 : 0;
      input[r + 10] = g.fold.separating ? 1 : 0;
      input[r + 11] = g.fold.halfOpened ? 1 : 0;
    }
    input[r + 12] = code.arrangement[o.arrangement];
    input[r + 13] = code.axes[o.axes];
    input[r + 14] = code.hingePolicy[o.hingePolicy ?? 'avoidSeparating'];
    input[r + 15] = o.hingeGap ?? 24;
    input[r + 16] = code.horizontal[edge.horizontal ?? 'auto'];
    input[r + 17] = code.vertical[edge.vertical ?? 'auto'];
    input[r + 18] = o.rtl ? 1 : 0;
  });
  const casesFile = `${binary}.${process.pid}.in`;
  writeFileSync(casesFile, input);
  const stdin = openSync(casesFile, 'r');
  const run = spawnSync(binary, {
    stdio: [stdin, 'pipe', 'pipe'],
    maxBuffer: cases.length * DOUBLES_PER_RESULT * 8 + 1024,
  });
  closeSync(stdin);
  unlinkSync(casesFile);
  if (run.status !== 0)
    throw new Error(`${binary} exited with ${run.status}: ${run.stderr}`);
  const out = new Float64Array(
    run.stdout.buffer.slice(
      run.stdout.byteOffset,
      run.stdout.byteOffset + run.stdout.byteLength
    )
  );
  if (out.length !== cases.length * DOUBLES_PER_RESULT)
    throw new Error(
      `${binary} wrote ${out.length} numbers, not ${cases.length * DOUBLES_PER_RESULT}`
    );
  const frame = (at: number): Frame => ({
    left: out[at]!,
    top: out[at + 1]!,
    width: out[at + 2]!,
    height: out[at + 3]!,
  });
  return cases.map((_, i) => ({
    primary: frame(i * DOUBLES_PER_RESULT),
    secondary: out[i * DOUBLES_PER_RESULT + 4]
      ? frame(i * DOUBLES_PER_RESULT + 5)
      : null,
  }));
}

export const arrange = (geometry: Geometry, options: ArrangeOptions) =>
  arrangeAll([{ geometry, options }])[0]!;
