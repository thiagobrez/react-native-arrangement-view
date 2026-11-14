import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { judge, parseProbeLog, summaryRow } from './frames.ts';

const ms = 1_000_000;
const inner = 'window=2076x2152 arrangement=7:2076x1900';
const cover = 'window=1080x2364 arrangement=7:1080x2100';
const alone = 'primary=0,0,2076,1900 secondary=none';
const sideBySide = 'primary=0,0,1016,1900 secondary=1060,0,1016,1900';
const stacked = 'primary=0,0,1080,1050 secondary=0,1050,1080,1050';
const draw = (at: number, sizes: string, panes: string) =>
  `draw ns=${at * ms} ${sizes} ${panes}`;
const log = (...lines: string[]) => parseProbeLog(lines.join('\n'));

test('panes that settle while JavaScript is held pass the hold budget', () => {
  const judgement = judge(
    'hold',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      `mark ns=${10 * ms} label=hold`,
      `posture ns=${880 * ms} from=flat to=none`,
      draw(900, cover, stacked),
      `mark ns=${8010 * ms} label=release`,
      draw(8030, cover, stacked)
    ),
    1
  );
  assert.deepEqual(judgement.problems, []);
  assert.equal(judgement.changes, 1);
  assert.equal(judgement.frames, 2);
});

test('panes that move only once JavaScript comes back fail the hold budget', () => {
  const judgement = judge(
    'hold',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      `mark ns=${10 * ms} label=hold`,
      draw(900, cover, alone),
      `mark ns=${8010 * ms} label=release`,
      draw(8040, cover, stacked)
    ),
    1
  );
  assert.deepEqual(judgement.problems, [
    'fold-closed: 1 frame(s) drew the panes out of place; the first, 0.0 ms after the window change, ' +
      `drew ${alone} where the settled frame draws ${stacked}`,
    'fold-closed: the panes waited for JavaScript: they settled 7140.0 ms after the window change ' +
      'and 30.0 ms after JavaScript came back',
  ]);
});

test('a window change outside the hold is an invalid trial, not a pass', () => {
  const judgement = judge(
    'hold',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      `mark ns=${10 * ms} label=hold`,
      `mark ns=${8010 * ms} label=release`,
      draw(9010, cover, stacked)
    ),
    1
  );
  assert.match(
    judgement.problems.join('\n'),
    /fold-closed: invalid trial: the window changed outside the JavaScript hold/
  );
});

test('a hold without its release mark fails', () => {
  const judgement = judge(
    'hold',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      `mark ns=${10 * ms} label=hold`,
      draw(900, cover, stacked)
    ),
    1
  );
  assert.match(
    judgement.problems.join('\n'),
    /fold-closed: no JavaScript hold was logged/
  );
});

test('a resize that leaves the panes where they were proves nothing', () => {
  const judgement = judge(
    'resize',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      draw(900, 'window=1080x2364 arrangement=7:2076x1900', alone)
    ),
    1
  );
  assert.match(
    judgement.problems.join('\n'),
    /fold-closed: the panes never moved from primary=0,0,2076,1900 secondary=none, so the trial proves nothing/
  );
});

test('a change that alters nothing its scenario watches fails as invalid', () => {
  const judgement = judge(
    'resize',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      draw(16, inner, alone)
    ),
    1
  );
  assert.equal(judgement.changes, 0);
  assert.match(
    judgement.problems.join('\n'),
    /fold-closed: no window change followed, so it proves nothing/
  );
});

test('one frame at the new size with the old panes fails the resize budget', () => {
  const judgement = judge(
    'resize',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      draw(500, cover, alone),
      draw(516, cover, stacked)
    ),
    1
  );
  assert.equal(judgement.problems.length, 1);
  assert.match(
    judgement.problems[0]!,
    /fold-closed: 1 frame\(s\) drew the panes out of place; the first, 0\.0 ms after the window change/
  );
});

test('a host that resizes the arrangement a frame late is not counted against the library', () => {
  const judgement = judge(
    'resize',
    log(
      draw(1, inner, alone),
      'change label=fold-closed',
      draw(500, 'window=1080x2364 arrangement=7:2076x1900', alone),
      draw(516, cover, stacked),
      'change label=fold-open',
      draw(1500, 'window=2076x2152 arrangement=7:1080x2100', stacked),
      draw(1516, inner, alone)
    ),
    2
  );
  assert.deepEqual(judgement.problems, []);
  assert.equal(judgement.changes, 2);
});

test('a log that lost change lines fails, however clean its frames', () => {
  const judgement = judge(
    'resize',
    log('change label=fold-open', draw(516, inner, alone)),
    4
  );
  assert.match(
    judgement.problems.join('\n'),
    /the test drove 4 changes but the log holds 1: logcat lost lines/
  );
  assert.match(
    judgement.problems.join('\n'),
    /nothing was drawn before the first change: the probe was not running/
  );
});

test('a new arrangement whose first frame hides its panes fails the mount budget', () => {
  const judgement = judge(
    'mount',
    log(
      draw(1, inner, alone),
      'change label=remount-2',
      draw(
        300,
        'window=2076x2152 arrangement=9:2076x1900',
        'primary=none secondary=none'
      ),
      draw(316, 'window=2076x2152 arrangement=9:2076x1900', alone)
    ),
    1
  );
  assert.equal(judgement.problems.length, 1);
  assert.match(
    judgement.problems[0]!,
    /remount-2: 1 frame\(s\) drew the panes blank/
  );
});

test('a new arrangement must settle where the one it replaced was', () => {
  const judgement = judge(
    'mount',
    log(
      draw(1, inner, alone),
      'change label=remount-2',
      draw(300, 'window=2076x2152 arrangement=9:2076x1900', sideBySide)
    ),
    1
  );
  assert.match(
    judgement.problems.join('\n'),
    /remount-2: the panes settled at primary=0,0,1016,1900 secondary=1060,0,1016,1900, not at primary=0,0,2076,1900 secondary=none where they were/
  );
});

test('the probe log parser fails on any line it does not know', () => {
  assert.deepEqual(log('--------- beginning of main', ''), []);
  for (const line of [
    'frame ns=12',
    'draw ns=12 window=1x1',
    `draw ns=12 ${inner} ${alone} extra=1`,
    `draw ns=twelve ${inner} ${alone}`,
    'posture ns=1 from=flat to=tent',
    'mark ns=1 label=hold label=release',
    'toString',
  ]) {
    assert.throws(() => log(line), /frame probe line 1/, line);
  }
});

test('the job summary shows one row per scenario with its first problem', () => {
  assert.equal(
    summaryRow({ scenario: 'resize', changes: 4, frames: 31, problems: [] }),
    '| window resize | 4 | 31 | ok |'
  );
  assert.equal(
    summaryRow({
      scenario: 'mount',
      changes: 5,
      frames: 12,
      problems: ['a | b', 'c'],
    }),
    '| new arrangement | 5 | 12 | failed (2): a \\| b |'
  );
});
