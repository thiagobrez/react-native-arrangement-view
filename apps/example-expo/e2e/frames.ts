/**
 * Frame budgets: whether Android draws the panes where the arrangement puts
 * them on every frame after a change, without waiting for JavaScript.
 *
 * The input is the RAVFRAMES log (`adb logcat -v raw -s RAVFRAMES:I`). The
 * frame probe (modules/frame-probe) writes every line but `change`, which the
 * test writes before each change it drives. Times are System.nanoTime. No
 * budget reads `posture`: it tells a reader of the log what WindowManager
 * reported, which an emulator image may leave empty.
 *
 *   draw ns=812 window=2076x2152 arrangement=91:2076x1900 primary=0,0,1038,1900 secondary=none
 *   draw ns=830 window=2076x2152 arrangement=none primary=none secondary=none
 *   posture ns=815 from=flat to=halfOpened
 *   mark ns=790 label=hold
 *   change label=fold-closed
 */

/** One frame the window drew. Sizes and pane rects stay strings: they are only compared and printed. */
export interface Draw {
  readonly kind: 'draw';
  readonly ns: number;
  /** `WxH` in px. */
  readonly window: string;
  /** The bench's ArrangementView: its React tag, which a remount changes, and its `WxH` in px. */
  readonly arrangement: { readonly tag: string; readonly size: string } | null;
  /** `left,top,width,height` in px from the arrangement's origin, or `none` when hidden. */
  readonly primary: string;
  readonly secondary: string;
}

export type Posture = 'flat' | 'halfOpened' | 'none';

export interface PostureChange {
  readonly kind: 'posture';
  readonly ns: number;
  readonly from: Posture;
  readonly to: Posture;
}

/** Logged on the JavaScript thread just before it blocks, and just after. */
export interface Mark {
  readonly kind: 'mark';
  readonly ns: number;
  readonly label: 'hold' | 'release';
}

/** Written by the test just before it drives one change. */
export interface Change {
  readonly kind: 'change';
  readonly label: string;
}

export type ProbeEvent = Draw | PostureChange | Mark | Change;

interface Rule {
  readonly title: string;
  /** What a change must alter for its trial to count: the window's size, or the arrangement's React tag. */
  readonly trigger: 'window' | 'arrangement';
  /** Where the settled panes must be: away from where they were before the change, or back there. */
  readonly settle: 'moved' | 'unmoved';
  /** The settled panes must be drawn before the JavaScript hold the change landed in ends. */
  readonly whileJavaScriptHeld: boolean;
}

/** Each scenario is a row: frames.e2e.ts drives it, and frames.test.ts pins its rules. */
export const scenarios = {
  hold: {
    title: 'fold while JavaScript is held',
    trigger: 'window',
    settle: 'moved',
    whileJavaScriptHeld: true,
  },
  resize: {
    title: 'window resize',
    trigger: 'window',
    settle: 'moved',
    whileJavaScriptHeld: false,
  },
  mount: {
    title: 'new arrangement',
    trigger: 'arrangement',
    settle: 'unmoved',
    whileJavaScriptHeld: false,
  },
} as const satisfies Record<string, Rule>;

export type Scenario = keyof typeof scenarios;

export interface Judgement {
  readonly scenario: Scenario;
  /** Changes whose trigger the log shows. */
  readonly changes: number;
  /** Frames drawn from the first change on, so a reader sees the work happened. */
  readonly frames: number;
  /** Empty when every budget held. Each one names the change and the frame. */
  readonly problems: readonly string[];
}

const fields = {
  ns: /^\d+$/,
  window: /^\d+x\d+$/,
  arrangement: /^(none|\d+:\d+x\d+)$/,
  pane: /^(none|-?\d+,-?\d+,\d+,\d+)$/,
  posture: /^(flat|halfOpened|none)$/,
  mark: /^(hold|release)$/,
  change: /^\S+$/,
};

const lineShapes = {
  draw: {
    ns: fields.ns,
    window: fields.window,
    arrangement: fields.arrangement,
    primary: fields.pane,
    secondary: fields.pane,
  },
  posture: { ns: fields.ns, from: fields.posture, to: fields.posture },
  mark: { ns: fields.ns, label: fields.mark },
  change: { label: fields.change },
};

/**
 * Throws on any line it doesn't know, so a probe and an analyzer that drift
 * apart fail the budget instead of passing it. Skips logcat's own
 * `--------- beginning of main` dividers.
 */
export function parseProbeLog(text: string): ProbeEvent[] {
  return text.split('\n').flatMap((line, index) => {
    if (line.trim() === '' || line.startsWith('--------- ')) return [];
    const event = parseLine(line);
    if (!event) throw new Error(`frame probe line ${index + 1}: ${line}`);
    return [event];
  });
}

function parseLine(line: string): ProbeEvent | null {
  const [kind, ...pairs] = line.trim().split(' ');
  if (!(kind && Object.hasOwn(lineShapes, kind))) return null;
  const shape: Record<string, RegExp> =
    lineShapes[kind as keyof typeof lineShapes];
  const values = new Map(
    pairs.map((pair): [string, string] => {
      const at = pair.indexOf('=');
      return at < 0 ? [pair, ''] : [pair.slice(0, at), pair.slice(at + 1)];
    })
  );
  const valid =
    values.size === pairs.length &&
    values.size === Object.keys(shape).length &&
    Object.entries(shape).every(([key, pattern]) =>
      pattern.test(values.get(key) ?? '')
    );
  if (!valid) return null;
  const get = (key: string) => values.get(key)!;
  switch (kind) {
    case 'draw': {
      const [tag, size] = get('arrangement').split(':');
      return {
        kind,
        ns: Number(get('ns')),
        window: get('window'),
        arrangement: tag && size ? { tag, size } : null,
        primary: get('primary'),
        secondary: get('secondary'),
      };
    }
    case 'posture':
      return {
        kind,
        ns: Number(get('ns')),
        from: get('from') as Posture,
        to: get('to') as Posture,
      };
    case 'mark':
      return {
        kind,
        ns: Number(get('ns')),
        label: get('label') as Mark['label'],
      };
    default:
      return { kind: 'change', label: get('label') };
  }
}

/**
 * Splits the log at the test's `change` lines and judges each change on its
 * own: it must alter what its scenario's trigger names, settle the panes as
 * the rule says, and draw no frame whose window and arrangement already have
 * their settled size but whose panes don't. A host that resizes the
 * arrangement a frame after the window changes the arrangement's size too, so
 * that frame is the host's lag, not the library's.
 */
export function judge(
  scenario: Scenario,
  events: readonly ProbeEvent[],
  driven: number
): Judgement {
  const rule = scenarios[scenario];
  const starts = events.flatMap((event, index) =>
    event.kind === 'change' ? [index] : []
  );
  const problems: string[] = [];
  if (starts.length !== driven) {
    problems.push(
      `the test drove ${driven} changes but the log holds ${starts.length}: logcat lost lines`
    );
  }
  const first = starts[0];
  if (first === undefined) {
    return { scenario, changes: 0, frames: 0, problems };
  }
  let before = draws(events.slice(0, first)).at(-1);
  if (!before) {
    problems.push(
      'nothing was drawn before the first change: the probe was not running'
    );
  }
  let changes = 0;
  starts.forEach((start, index) => {
    const change = events[start] as Change;
    const segment = events.slice(start + 1, starts[index + 1]);
    const result = judgeChange(rule, change.label, before, segment);
    if (result.triggered) changes++;
    problems.push(...result.problems);
    before = draws(segment).at(-1) ?? before;
  });
  return {
    scenario,
    changes,
    frames: draws(events.slice(first)).length,
    problems,
  };
}

function judgeChange(
  rule: Rule,
  label: string,
  before: Draw | undefined,
  segment: readonly ProbeEvent[]
): { triggered: boolean; problems: string[] } {
  const drawn = draws(segment);
  const trigger = findTrigger(rule.trigger, before, segment);
  if (trigger === undefined) {
    return {
      triggered: false,
      problems: [
        `${label}: no ${rule.trigger} change followed, so it proves nothing`,
      ],
    };
  }
  const final = drawn.at(-1);
  if (!final) {
    return {
      triggered: true,
      problems: [
        `${label}: nothing was drawn after the ${rule.trigger} change`,
      ],
    };
  }
  const problems: string[] = [];
  if (before && rule.settle === 'moved' && samePanes(final, before)) {
    problems.push(
      `${label}: the panes never moved from ${panes(before)}, so the trial proves nothing`
    );
  }
  if (before && rule.settle === 'unmoved' && !samePanes(final, before)) {
    problems.push(
      `${label}: the panes settled at ${panes(final)}, not at ${panes(before)} where they were`
    );
  }
  const bad = drawn.filter(
    (draw) =>
      draw.ns >= trigger && sameSizes(draw, final) && !samePanes(draw, final)
  );
  const firstBad = bad[0];
  if (firstBad) {
    const blank = firstBad.primary === 'none' && firstBad.secondary === 'none';
    problems.push(
      `${label}: ${bad.length} frame(s) drew the panes ${blank ? 'blank' : 'out of place'}; ` +
        `the first, ${ms(firstBad.ns - trigger)} after the ${rule.trigger} change, drew ` +
        `${panes(firstBad)} where the settled frame draws ${panes(final)}`
    );
  }
  if (rule.whileJavaScriptHeld) {
    problems.push(...judgeHold(label, trigger, drawn, final, segment));
  }
  return { triggered: true, problems };
}

function judgeHold(
  label: string,
  trigger: number,
  drawn: readonly Draw[],
  final: Draw,
  segment: readonly ProbeEvent[]
): string[] {
  const marks = segment.filter((event) => event.kind === 'mark');
  const hold = marks.find((mark) => mark.label === 'hold');
  const release = marks.find(
    (mark) => mark.label === 'release' && hold && mark.ns > hold.ns
  );
  if (!hold || !release) {
    return [`${label}: no JavaScript hold was logged`];
  }
  if (trigger < hold.ns || trigger > release.ns) {
    return [
      `${label}: invalid trial: the window changed outside the JavaScript hold`,
    ];
  }
  const settledAt = drawn.findIndex((_, index) =>
    drawn
      .slice(index)
      .every((draw) => sameSizes(draw, final) && samePanes(draw, final))
  );
  const settled = drawn[settledAt]!;
  if (settled.ns > release.ns) {
    return [
      `${label}: the panes waited for JavaScript: they settled ${ms(settled.ns - trigger)} ` +
        `after the window change and ${ms(settled.ns - release.ns)} after JavaScript came back`,
    ];
  }
  return [];
}

/** When the change took effect: the first frame drawn with a new window or arrangement. */
function findTrigger(
  trigger: Rule['trigger'],
  before: Draw | undefined,
  segment: readonly ProbeEvent[]
): number | undefined {
  return draws(segment).find((draw) =>
    trigger === 'window'
      ? draw.window !== before?.window
      : draw.arrangement?.tag !== before?.arrangement?.tag
  )?.ns;
}

function draws(events: readonly ProbeEvent[]): Draw[] {
  return events.filter((event) => event.kind === 'draw');
}

function sameSizes(a: Draw, b: Draw) {
  return (
    a.window === b.window &&
    a.arrangement?.tag === b.arrangement?.tag &&
    a.arrangement?.size === b.arrangement?.size
  );
}

function samePanes(a: Draw, b: Draw) {
  return a.primary === b.primary && a.secondary === b.secondary;
}

function panes(draw: Draw) {
  return `primary=${draw.primary} secondary=${draw.secondary}`;
}

function ms(ns: number) {
  return `${(ns / 1e6).toFixed(1)} ms`;
}

export const summaryHeader =
  '| Frame budget | Changes | Frames drawn | Result |\n|---|---|---|---|';

/** One Markdown table row for $GITHUB_STEP_SUMMARY. */
export function summaryRow(judgement: Judgement): string {
  const [first] = judgement.problems;
  const result = first
    ? `failed (${judgement.problems.length}): ${first.replaceAll('|', '\\|')}`
    : 'ok';
  return `| ${scenarios[judgement.scenario].title} | ${judgement.changes} | ${judgement.frames} | ${result} |`;
}
