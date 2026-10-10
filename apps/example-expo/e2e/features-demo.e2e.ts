import { beforeEach, describe, test } from '@e2e-dev/mobile';
import { expect, type Locator } from 'e2e';

// Every test starts on the outer display. The engine never resets the hinge,
// and a fresh emulator boots unfolded.
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
    await screen.getByRole('button', 'Overlay').tap();

    await expect(screen.getByText('Overlapping')).toHaveCount(2);
    await expect(screen.getByText('Primary')).toBeVisible();
    await expect(screen.getByText('Secondary')).toBeVisible();
  });
});

describe('axes', () => {
  test('horizontal shows the primary pane alone on the outer display', async ({
    screen,
  }) => {
    await screen.getByRole('button', 'Horizontal').tap();

    await expect(screen.getByText('Primary only')).toBeVisible();
    await expect(screen.getByText('Secondary')).toBeHidden();
  });

  test('vertical shows the primary pane alone across the hinge', async ({
    device,
    screen,
  }) => {
    await device.fold('half-open');
    await expect(screen.getByText('Side by side')).toHaveCount(2);

    await screen.getByRole('button', 'Vertical').tap();

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

    await screen.getByRole('button', 'Primary trailing').tap();
    await expect.poll(() => isLeftOf(secondary, primary)).toBe(true);

    await screen.getByRole('button', 'Primary leading').tap();
    await expect.poll(() => isLeftOf(primary, secondary)).toBe(true);
  });
});

async function isLeftOf(a: Locator, b: Locator) {
  const [boxA, boxB] = await Promise.all([a.boundingBox(), b.boundingBox()]);
  return boxA !== null && boxB !== null && boxA.x + boxA.width <= boxB.x;
}
