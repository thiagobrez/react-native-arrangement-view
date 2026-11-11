import { beforeEach, describe, test } from '@e2e-dev/mobile';
import { expect, type Locator, type Screen } from 'e2e';

// The engine never resets the hinge, and a fresh emulator boots unfolded.
beforeEach(async ({ app, device, screen }) => {
  await device.fold('closed');
  await app.open();
  await screen.getByRole('button', 'Features demo').tap();
});

describe('arrangement', () => {
  test('split stacks the panes on the outer display', async ({ screen }) => {
    await expect(screen.getByText('Stacked')).toHaveCount(2);
    await expect(screen.getByText('Primary')).toBeVisible();
    await expect(screen.getByText('Secondary')).toBeVisible();
  });

  test('overlay puts the primary pane over the secondary', async ({
    screen,
  }) => {
    await setProp(screen, 'arrangement', 'Overlay');

    await expect(screen.getByText('Overlapping')).toHaveCount(2);
    await expect(screen.getByText('Primary')).toBeVisible();
    await expect(screen.getByText('Secondary')).toBeVisible();
  });
});

describe('axes', () => {
  test('horizontal shows the primary pane alone on the outer display', async ({
    screen,
  }) => {
    await setProp(screen, 'axes', 'Horizontal');

    await expect(screen.getByText('Primary only')).toBeVisible();
    await expect(screen.getByText('Secondary')).toBeHidden();
  });

  test('vertical shows the primary pane alone across the hinge', async ({
    device,
    screen,
  }) => {
    const primary = screen.getByText('Primary');
    const secondary = screen.getByText('Secondary');
    await device.fold('half-open');
    await expect(screen.getByText('Side by side')).toHaveCount(2);
    await expect.poll(() => isLeftOf(primary, secondary)).toBe(true);

    await setProp(screen, 'axes', 'Vertical');

    await expect(screen.getByText('Primary only')).toBeVisible();
    await expect(screen.getByText('Secondary')).toBeHidden();
  });
});

describe('primaryEdge', () => {
  test('puts the primary pane on the chosen side of the hinge', async ({
    device,
    screen,
  }) => {
    const primary = screen.getByText('Primary');
    const secondary = screen.getByText('Secondary');
    await device.fold('half-open');
    await expect.poll(() => isLeftOf(primary, secondary)).toBe(true);

    await setProp(screen, 'primary-edge-horizontal', 'Trailing');
    await expect.poll(() => isLeftOf(secondary, primary)).toBe(true);

    await setProp(screen, 'primary-edge-horizontal', 'Leading');
    await expect.poll(() => isLeftOf(primary, secondary)).toBe(true);
  });
});

// The segments of each control in the props sheet, in order.
const segments = {
  'arrangement': ['Split', 'Overlay'],
  'axes': ['Both', 'Horizontal', 'Vertical'],
  'primary-edge-horizontal': ['Default', 'Leading', 'Trailing'],
} as const;

/** Opens the props sheet, picks one segment of a control, and closes the sheet. */
async function setProp<C extends keyof typeof segments>(
  screen: Screen,
  control: C,
  segment: (typeof segments)[C][number]
) {
  await screen.getByRole('button', 'Props').tap();
  // The sheet slides in; wait until it has settled with its Done button showing.
  await expect(screen.getByTestId('props-done')).toBeVisible();
  const options: readonly string[] = segments[control];
  await tapAt(
    screen.getByTestId(control),
    (options.indexOf(segment) + 0.5) / options.length
  );
  await tapAt(screen.getByTestId('props-done'), 0.5);
  await expect(screen.getByTestId('props-done')).toBeHidden();
}

// Android's segmented buttons and the sheet's Done button are unnamed controls
// inside a group, which the engine won't tap through, so tap a point of the
// group: `fraction` of the way across, halfway down.
async function tapAt(target: Locator, fraction: number) {
  const box = await target.boundingBox();
  if (!box) throw new Error('The control has no box to tap');
  await target.tap({
    position: { x: box.width * fraction, y: box.height / 2 },
  });
}

async function isLeftOf(a: Locator, b: Locator) {
  const [boxA, boxB] = await Promise.all([a.boundingBox(), b.boundingBox()]);
  return boxA !== null && boxB !== null && boxA.x + boxA.width <= boxB.x;
}
