import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  cover,
  describeDevice,
  inner,
  postures,
} from '../apps/docs/components/FoldableLogo/device.ts';

const posture = (id: string) =>
  describeDevice(postures.find((each) => each.id === id)!.pose);

test("the docs logo's postures each show the layout the library arranges", () => {
  const shown = postures.map(({ id }) => {
    const { posture: named, screen, panes } = posture(id);
    return [named, screen, panes];
  });
  assert.deepEqual(shown, [
    ['closed', 'cover', 'Stacked'],
    ['open', 'inner', 'Side by side'],
    ['tabletop', 'inner', 'Stacked'],
    ['book', 'inner', 'Side by side'],
    ['tent', 'cover', 'Primary only'],
  ]);
});

test("the docs logo's panes keep clear of a half-open hinge, and touch across a flat one", () => {
  const gap = ({ primary, secondary }: ReturnType<typeof describeDevice>) =>
    secondary!.left - primary.left - primary.width;
  assert.equal(gap(posture('book')), 24);
  assert.equal(gap(posture('open')), 0);
});

test("the docs logo's panes are placed on the display upright, whichever way the app is turned", () => {
  // On a table the app is turned a quarter: its top pane is the display's
  // left half, the one stood up.
  const tabletop = posture('tabletop');
  assert.equal(tabletop.landscape, true);
  assert.deepEqual(tabletop.primary, {
    left: 0,
    top: 0,
    width: inner.width / 2 - 12,
    height: inner.height,
  });
  assert.deepEqual(tabletop.secondary, {
    left: inner.width / 2 + 12,
    top: 0,
    width: inner.width / 2 - 12,
    height: inner.height,
  });
  assert.deepEqual(posture('tent').primary, { left: 0, top: 0, ...cover });
});

test('the docs logo names the posture a fold reaches in each orientation', () => {
  const named = (orientation: 'upright' | 'tabletop' | 'tent', angle: number) =>
    describeDevice({ orientation, angle }).posture;
  assert.equal(named('upright', 29), 'closed');
  assert.equal(named('upright', 30), 'book');
  assert.equal(named('upright', 160), 'open');
  assert.equal(named('tabletop', 90), 'tabletop');
  assert.equal(named('tent', 90), 'tent');
  // A tent stays on the cover display however far it opens.
  assert.equal(
    describeDevice({ orientation: 'tent', angle: 170 }).screen,
    'cover'
  );
});
