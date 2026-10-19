import {
  arrangeAll,
  type ArrangeOptions,
  type Fold,
  type Frame,
  type Geometry,
  type PaneFrames,
} from '../harness/arrange.ts';
import { untyped } from '../untyped.ts';

const { describeLayout }: typeof import('../../src/layout.ts') = await import(
  process.env.LAYOUT_SOURCE ?? '../../src/layout.ts'
);

type Axis = 'horizontal' | 'vertical';
interface Case {
  geometry: Geometry;
  options: Required<Omit<ArrangeOptions, 'primaryEdge'>> &
    Pick<ArrangeOptions, 'primaryEdge'>;
}

// The axis the panes split along, and a frame's or fold's span on it.
const foldAxis = (fold: Fold): Axis =>
  fold.orientation === 'vertical' ? 'horizontal' : 'vertical';
const foldSpan = (axis: Axis, f: Fold) =>
  axis === 'horizontal'
    ? ([f.x, f.x + f.width] as const)
    : ([f.y, f.y + f.height] as const);
const frameSpan = (axis: Axis, f: Frame) =>
  axis === 'horizontal'
    ? ([f.left, f.left + f.width] as const)
    : ([f.top, f.top + f.height] as const);
const extentOf = (axis: Axis, g: Geometry) =>
  axis === 'horizontal' ? g.width : g.height;
const isFull = (f: Frame, g: Geometry) =>
  f.left === 0 && f.top === 0 && f.width === g.width && f.height === g.height;

const overlaid = ({ primary, secondary }: PaneFrames, g: Geometry) =>
  secondary !== null && isFull(primary, g) && isFull(secondary, g);

function policyFold({ geometry: g, options: o }: Case) {
  const fold = g.fold;
  if (!fold) return null;
  const avoided =
    o.hingePolicy === 'alwaysAvoid' ||
    (o.hingePolicy === 'avoidSeparating' && fold.separating);
  if (!avoided) return null;
  const axis = foldAxis(fold);
  const [start, end] = foldSpan(axis, fold);
  const middle = (start + end) / 2;
  const half = Math.max(end - start, o.hingeGap) / 2;
  const fits = middle - half > 0 && middle + half < extentOf(axis, g);
  return { fold, axis, start, end, fits };
}

function avoidedFold(c: Case) {
  const hinge = policyFold(c);
  return hinge?.fits ? hinge : null;
}

const EPS = 1e-6;

function paneAxis(r: PaneFrames, g: Geometry): Axis | null {
  const { primary, secondary } = r;
  if (!secondary || overlaid(r, g)) return null;
  if (primary.top === secondary.top && primary.height === secondary.height)
    return 'horizontal';
  if (primary.left === secondary.left && primary.width === secondary.width)
    return 'vertical';
  return null;
}

function edges(value: ArrangeOptions['primaryEdge']) {
  const horizontal = (e: unknown) =>
    e === 'leading' || e === 'trailing' ? e : undefined;
  const vertical = (e: unknown) =>
    e === 'top' || e === 'bottom' ? e : undefined;
  if (typeof value === 'string') return [horizontal(value), vertical(value)];
  const [h, v] = value ?? [];
  return value?.length === 2 && horizontal(h) && vertical(v)
    ? [horizontal(h), vertical(v)]
    : [undefined, undefined];
}

type Property = (
  c: Case,
  r: PaneFrames,
  neverAvoidResult: PaneFrames | undefined
) => string | null;

const PROPERTIES: Record<string, Property> = {
  'inside the arrangement': ({ geometry: g }, r) => {
    for (const f of [r.primary, r.secondary]) {
      if (!f) continue;
      if (
        !(f.width >= 0 && f.height >= 0 && f.left >= 0 && f.top >= 0) ||
        f.left + f.width > g.width + EPS ||
        f.top + f.height > g.height + EPS
      )
        return `frame ${JSON.stringify(f)} leaves the ${g.width}x${g.height} arrangement`;
    }
    return null;
  },

  'no empty pane': (_, r) => {
    for (const [name, f] of [
      ['primary', r.primary],
      ['secondary', r.secondary],
    ] as const) {
      if (f && (f.width <= 0 || f.height <= 0))
        return `${name} pane is shown with size ${f.width}x${f.height}`;
    }
    return null;
  },

  'split panes do not overlap': ({ geometry: g }, r) => {
    if (!r.secondary || overlaid(r, g)) return null;
    const axis = paneAxis(r, g);
    if (!axis) return 'split panes are neither side by side nor stacked';
    const across = axis === 'horizontal' ? 'vertical' : 'horizontal';
    for (const f of [r.primary, r.secondary]) {
      const [a, b] = frameSpan(across, f);
      if (a !== 0 || b !== extentOf(across, g))
        return `a split pane doesn't span the arrangement ${across}ly`;
    }
    const [p0, p1] = frameSpan(axis, r.primary);
    const [s0, s1] = frameSpan(axis, r.secondary);
    if (Math.min(p1, s1) > Math.max(p0, s0) + EPS)
      return `panes overlap on [${Math.max(p0, s0)}, ${Math.min(p1, s1)}]`;
    return null;
  },

  'clear of an avoided hinge': (c, r) => {
    const hinge = avoidedFold(c);
    if (!hinge || overlaid(r, c.geometry)) return null;
    for (const f of [r.primary, r.secondary]) {
      if (!f) continue;
      const [a, b] = frameSpan(hinge.axis, f);
      if (!(b <= hinge.start + EPS || a >= hinge.end - EPS))
        return `pane [${a}, ${b}] lies across the hinge [${hinge.start}, ${hinge.end}]`;
    }
    return null;
  },

  'hingeGap between panes': (c, r) => {
    const hinge = avoidedFold(c);
    if (!hinge || !r.secondary || overlaid(r, c.geometry)) return null;
    const [p0, p1] = frameSpan(hinge.axis, r.primary);
    const [s0, s1] = frameSpan(hinge.axis, r.secondary);
    const gap = Math.max(p0, s0) - Math.min(p1, s1);
    const wanted = Math.max(c.options.hingeGap, hinge.end - hinge.start);
    if (gap < wanted - EPS)
      return `panes are ${gap} apart around the hinge, not ${wanted}`;
    return null;
  },

  'a hinge without room for the gap is ignored': (_, r, neverAvoidResult) => {
    if (
      !neverAvoidResult ||
      JSON.stringify(r) === JSON.stringify(neverAvoidResult)
    )
      return null;
    return `${JSON.stringify(r)} differs from the layout that ignores the hinge, ${JSON.stringify(neverAvoidResult)}`;
  },

  'a separating hinge always splits': (c, r) => {
    const hinge = avoidedFold(c);
    if (!hinge?.fold.separating) return null;
    const { axes } = c.options;
    if (axes !== 'both' && axes !== hinge.axis) return null;
    if (!r.secondary || overlaid(r, c.geometry))
      return 'a separating hinge left the panes unsplit';
    if (paneAxis(r, c.geometry) !== hinge.axis)
      return `split along ${paneAxis(r, c.geometry)}, not along the hinge's ${hinge.axis} axis`;
    return null;
  },

  'tabletop shows both panes': ({ geometry: g, options: o }, r) => {
    const tabletop = g.fold?.halfOpened && g.fold.orientation === 'horizontal';
    if (!tabletop || o.arrangement !== 'split' || o.axes === 'horizontal')
      return null;
    return r.secondary ? null : 'tabletop showed one pane';
  },

  'axes is respected': ({ geometry: g, options: { axes } }, r) => {
    const axis = paneAxis(r, g);
    if (!axis || axes === 'both' || axes === axis) return null;
    return `split along ${axis} with axes '${axes}'`;
  },

  // Side by side, the primary pane takes the horizontal side `primaryEdge`
  // names: by default leading for split and trailing for overlay. Leading is
  // left in LTR and right in RTL. Stacked, a split's primary pane is always on
  // top, and an overlay's takes the vertical side `primaryEdge` names, by
  // default below the hinge. A single pane beside a hinge takes the side the
  // primary would split to.
  'primary on its edge': (c, r) => {
    const { arrangement, primaryEdge, rtl } = c.options;
    const [horizontal, vertical] = edges(primaryEdge);
    let axis = paneAxis(r, c.geometry);
    let primaryFirst: boolean;
    if (r.secondary) {
      if (!axis) return null;
      const [p0] = frameSpan(axis, r.primary);
      const [s0] = frameSpan(axis, r.secondary);
      primaryFirst = p0 < s0;
    } else {
      const hinge = avoidedFold(c);
      if (!hinge) return null;
      axis = hinge.axis;
      primaryFirst = frameSpan(axis, r.primary)[1] <= hinge.start + EPS;
    }
    const overlay = arrangement === 'overlay';
    const expectFirst =
      axis === 'horizontal'
        ? ((horizontal ?? (overlay ? 'trailing' : 'leading')) === 'leading') !==
          rtl
        : !overlay || vertical === 'top';
    if (primaryFirst !== expectFirst)
      return `primary is ${primaryFirst ? 'before' : 'after'} the secondary along ${axis}`;
    return null;
  },

  'layout matches the frames': ({ geometry: g }, r) => {
    const layout = describeLayout(r);
    if (layout.secondaryVisible !== (r.secondary !== null))
      return `secondaryVisible is ${layout.secondaryVisible}`;
    if (layout.isOverlapping !== overlaid(r, g))
      return `isOverlapping is ${layout.isOverlapping}`;
    const axis = paneAxis(r, g);
    if (layout.axis !== axis)
      return `axis is ${layout.axis}, frames say ${axis}`;
    return null;
  },
};

// The grid. Window sizes sit on each side of Material's breakpoints (compact
// height 480, expanded width 840, expanded height 900); arrangement sizes,
// fold positions and gaps are small integers that put the fold before, on,
// inside and past each edge, and the gap below, at and above the fold's width.
const WINDOWS = [839, 840].flatMap((width) =>
  [479, 480, 899, 900].map((height) => ({ width, height }))
);
const EXTENTS = [1, 2, 3, 4, 5, 8];
const CROSS = [1, 3];
const FOLD_SIZES = [0, 1, 2, 3];
const GAPS = [0, 1, 2, 3, 4, 6, 24];
const FOLD_KINDS = [
  { separating: false, halfOpened: false },
  { separating: true, halfOpened: false },
  // WindowManager reports a half-open fold as separating.
  { separating: true, halfOpened: true },
];
const PRIMARY_EDGES: ArrangeOptions['primaryEdge'][] = [
  undefined,
  'leading',
  'trailing',
  'top',
  'bottom',
  ['leading', 'top'],
  ['leading', 'bottom'],
  ['trailing', 'top'],
  ['trailing', 'bottom'],
  untyped(['top', 'trailing']),
];
const OPTIONS = (['split', 'overlay'] as const).flatMap((arrangement) =>
  (['both', 'horizontal', 'vertical'] as const).flatMap((axes) =>
    (['avoidSeparating', 'alwaysAvoid', 'neverAvoid'] as const).flatMap(
      (hingePolicy) =>
        PRIMARY_EDGES.flatMap((primaryEdge) =>
          [false, true].map((rtl) => ({
            arrangement,
            axes,
            hingePolicy,
            primaryEdge,
            rtl,
          }))
        )
    )
  )
);

function* grid(): Generator<Case> {
  for (const window of WINDOWS)
    for (const options of OPTIONS)
      for (const hingeGap of GAPS) {
        const o = { ...options, hingeGap };
        for (const width of EXTENTS)
          for (const height of CROSS) {
            yield { geometry: { width, height, window }, options: o };
            yield* folds({ width, height, window }, o, 'vertical');
          }
        for (const width of CROSS)
          for (const height of EXTENTS)
            yield* folds({ width, height, window }, o, 'horizontal');
      }
}

function* folds(
  g: Geometry,
  options: Case['options'],
  orientation: Fold['orientation']
): Generator<Case> {
  const extent = orientation === 'vertical' ? g.width : g.height;
  for (const kind of FOLD_KINDS)
    for (let start = -1; start <= extent + 1; start++)
      for (const size of FOLD_SIZES) {
        const fold: Fold =
          orientation === 'vertical'
            ? {
                x: start,
                y: 0,
                width: size,
                height: g.height,
                orientation,
                ...kind,
              }
            : {
                x: 0,
                y: start,
                width: g.width,
                height: size,
                orientation,
                ...kind,
              };
        yield { geometry: { ...g, fold }, options };
      }
}

// Seeded random cases in realistic dp, fractional included, so the grid's
// small integers aren't the only sizes checked.
function* sampled(count: number): Generator<Case> {
  // Park-Miller: the same cases on every run.
  let seed = 49_485_617;
  const next = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)]!;
  const dp = (max: number) =>
    next() < 0.5 ? Math.round(next() * max) : next() * max;
  for (let i = 0; i < count; i++) {
    const window = { width: 1 + dp(1400), height: 1 + dp(1400) };
    const width = 1 + dp(window.width);
    const height = 1 + dp(window.height);
    const options = { ...pick(OPTIONS), hingeGap: dp(60) };
    let fold: Fold | undefined;
    if (next() < 0.8) {
      const orientation = pick(['vertical', 'horizontal'] as const);
      const extent = orientation === 'vertical' ? width : height;
      const start = dp(extent * 1.2) - extent * 0.1;
      const size = next() < 0.5 ? 0 : dp(40);
      fold = {
        ...(orientation === 'vertical'
          ? { x: start, y: 0, width: size, height }
          : { x: 0, y: start, width, height: size }),
        orientation,
        ...pick(FOLD_KINDS),
      };
    }
    yield { geometry: { width, height, window, fold }, options };
  }
}

const KNOWN_FINDINGS: Record<string, string> = {};

const failures = new Map<
  string,
  { case: Case; result: PaneFrames; why: string; count: number }
>();
let checked = 0;
const started = Date.now();
const cases = function* () {
  yield* grid();
  yield* sampled(500_000);
};
const CASES_PER_HARNESS_RUN = 65_536;
let batch: Case[] = [];
const checkBatch = () => {
  const neverAvoid = batch.map((c) =>
    policyFold(c)?.fits === false
      ? { ...c, options: { ...c.options, hingePolicy: 'neverAvoid' as const } }
      : null
  );
  const results = arrangeAll([
    ...batch,
    ...neverAvoid.filter((c) => c !== null),
  ]);
  let nextNeverAvoid = batch.length;
  batch.forEach((c, i) => {
    const result = results[i]!;
    const neverAvoidResult = neverAvoid[i]
      ? results[nextNeverAvoid++]
      : undefined;
    checked++;
    for (const [name, property] of Object.entries(PROPERTIES)) {
      const why = property(c, result, neverAvoidResult);
      if (!why) continue;
      const seen = failures.get(name);
      if (seen) seen.count++;
      else failures.set(name, { case: c, result, why, count: 1 });
    }
  });
  batch = [];
};
for (const c of cases()) {
  batch.push(c);
  if (batch.length === CASES_PER_HARNESS_RUN) checkBatch();
}
checkBatch();

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`Checked ${checked.toLocaleString('en')} cases in ${seconds}s.`);
let broken = 0;
for (const name of Object.keys(PROPERTIES)) {
  const failure = failures.get(name);
  const known = KNOWN_FINDINGS[name];
  if (!failure) {
    console.log(`  pass  ${name}`);
    if (known) {
      console.log(`        was a known finding; remove it from KNOWN_FINDINGS`);
      broken++;
    }
    continue;
  }
  if (!known) broken++;
  console.log(`  FAIL  ${name}: ${failure.count.toLocaleString('en')} cases`);
  if (known) console.log(`        known finding: ${known}`);
  console.log(`        first: ${failure.why}`);
  console.log(`        geometry: ${JSON.stringify(failure.case.geometry)}`);
  console.log(`        options:  ${JSON.stringify(failure.case.options)}`);
  console.log(`        result:   ${JSON.stringify(failure.result)}`);
}
process.exitCode = broken ? 1 : 0;
