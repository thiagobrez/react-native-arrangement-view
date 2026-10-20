import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  arrangeInput,
  displayKey,
  type Display,
} from '../docs/components/FoldableLogo/device.ts';
import { PANES } from '../docs/components/FoldableLogo/panes.ts';
import { arrangeAll } from '../verification/native/arrange.ts';

const displays: Display[] = [
  { screen: 'cover', landscape: false, halfOpened: false },
  { screen: 'cover', landscape: true, halfOpened: false },
  { screen: 'inner', landscape: false, halfOpened: false },
  { screen: 'inner', landscape: false, halfOpened: true },
  { screen: 'inner', landscape: true, halfOpened: false },
  { screen: 'inner', landscape: true, halfOpened: true },
];

test("the docs logo shows the panes where Android's policy puts them", () => {
  const frames = arrangeAll(displays.map(arrangeInput));
  const expected = Object.fromEntries(
    displays.map((display, i) => [displayKey(display), frames[i]])
  );
  assert.deepEqual(
    PANES,
    expected,
    `PANES in docs/components/FoldableLogo/panes.ts is stale. Replace it with:\n${JSON.stringify(expected, null, 2)}`
  );
});
