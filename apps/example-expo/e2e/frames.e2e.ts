import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { beforeEach, describe, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  judge,
  parseProbeLog,
  summaryHeader,
  summaryRow,
  type ProbeEvent,
  type Scenario,
} from './frames.ts';

// Long enough for the frames a change causes to finish drawing.
const QUIET_MS = 1_000;
const WAIT_MS = 30_000;

interface Step {
  readonly label: string;
  readonly run: () => Promise<unknown>;
}

// A retry would let a regression that strikes only some of the time through.
describe(
  'frame budget',
  { platforms: ['android'], tags: ['frames'], retries: 0, timeout: 240_000 },
  () => {
    beforeEach(async ({ app, device }) => {
      await device.fold('open');
      probeLog.clear();
      await app.open();
      // A cold start makes the link the app's initial URL. A link sent while
      // the app was still loading its JavaScript has gone missing.
      await device.closeApp();
      await device.openLink('arrangementview://frames');
    });

    test('the panes follow a fold while JavaScript is held', async ({
      device,
      screen,
    }) => {
      const poses = ['closed', 'open'] as const;
      const judgement = await measure(
        'hold',
        poses.map((pose, index) => ({
          label: `fold-${pose}`,
          run: async () => {
            await screen.getByRole('button', 'Hold JavaScript').tap();
            await waitForProbe('the JavaScript hold', (events) =>
              hasMarks(events, 'hold', index + 1)
            );
            await device.fold(pose);
            await waitForProbe('JavaScript to come back', (events) =>
              hasMarks(events, 'release', index + 1)
            );
          },
        }))
      );
      expect(judgement.problems).toEqual([]);
    });

    test('the panes are in place on every frame after the window resizes', async ({
      device,
    }) => {
      const poses = ['closed', 'open', 'closed', 'open'] as const;
      const judgement = await measure(
        'resize',
        poses.map((pose) => ({
          label: `fold-${pose}`,
          run: () => device.fold(pose),
        }))
      );
      expect(judgement.problems).toEqual([]);
    });

    test('a new arrangement draws its panes on its first frame', async ({
      screen,
    }) => {
      const mounts = [2, 3, 4, 5, 6];
      const judgement = await measure(
        'mount',
        mounts.map((mount) => ({
          label: `remount-${mount}`,
          run: () => screen.getByRole('button', 'Remount').tap(),
        }))
      );
      expect(judgement.problems).toEqual([]);
    });
  }
);

/** Marks the log before each step, waits for its frames to stop, then judges the whole log. */
async function measure(scenario: Scenario, steps: readonly Step[]) {
  await waitForProbe('the bench to draw', (events) =>
    events.some((event) => event.kind === 'draw' && event.arrangement)
  );
  for (const step of steps) {
    probeLog.write(`change label=${step.label}`);
    const marked = lineCount();
    await step.run();
    await settle(marked);
  }
  const text = probeLog.read();
  const judgement = judge(scenario, parseProbeLog(text), steps.length);
  mkdirSync('.e2e/frames', { recursive: true });
  writeFileSync(`.e2e/frames/${scenario}-${Date.now()}.log`, text);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    if (!readFileSync(summary, 'utf8').includes(summaryHeader)) {
      appendFileSync(summary, `\n${summaryHeader}\n`);
    }
    appendFileSync(summary, `${summaryRow(judgement)}\n`);
  }
  return judgement;
}

const lineCount = () => probeLog.read().split('\n').length;

/** Waits for a line after the change mark, then for QUIET_MS without a new one. */
async function settle(marked: number) {
  const deadline = Date.now() + WAIT_MS;
  let seen = lineCount();
  let quietSince = Date.now();
  while (seen <= marked || Date.now() - quietSince < QUIET_MS) {
    if (Date.now() > deadline) return;
    await sleep(200);
    const now = lineCount();
    if (now !== seen) {
      seen = now;
      quietSince = Date.now();
    }
  }
}

async function waitForProbe(
  what: string,
  ready: (events: ProbeEvent[]) => boolean
) {
  const deadline = Date.now() + WAIT_MS;
  while (!ready(parseProbeLog(probeLog.read()))) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(200);
  }
}

function hasMarks(
  events: readonly ProbeEvent[],
  label: 'hold' | 'release',
  count: number
) {
  return (
    events.filter((event) => event.kind === 'mark' && event.label === label)
      .length >= count
  );
}

/** The probe's logcat tag. adb honours ANDROID_SERIAL, which picks the device when more than one is connected. */
const probeLog = {
  clear: () => {
    // The CI emulator logs enough to roll the default 256 KB buffer over
    // within a minute, taking a scenario's early lines with it.
    adb('logcat', '-G', '16M');
    adb('logcat', '-c');
  },
  write: (line: string) => adb('shell', 'log', '-t', 'RAVFRAMES', line),
  read: () => adb('logcat', '-d', '-v', 'raw', '-s', 'RAVFRAMES:I'),
};

function adb(...args: string[]) {
  return execFileSync('adb', args, { encoding: 'utf8' });
}
