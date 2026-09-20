import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  createHingeStore,
  HingeContext,
  normalizeHinge,
  unavailableHinge,
  useHingeChange,
} from '../src/hinge.ts';
import type { HingeState } from '../src/types.ts';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

test('missing hardware is unavailable, and unknown future statuses stay unknown', () => {
  assert.deepEqual(
    normalizeHinge({ available: false, angle: Math.PI, status: 'fullyOpen' }),
    unavailableHinge
  );
  assert.deepEqual(
    normalizeHinge({ available: true, angle: 1.25, status: 'futureStatus' }),
    { available: true, angle: 1.25, status: 'unknown' }
  );
  assert.equal(
    normalizeHinge({ available: true, angle: NaN, status: 'partiallyOpen' })
      .angle,
    null
  );
});

test('native radians are preserved without angle-based status inference', () => {
  const event = { available: true, angle: 0.1, status: 'fullyOpen' } as const;
  assert.deepEqual(normalizeHinge(event), event);
});

test('independent arrangements do not leak events, and unsubscribe stops delivery', () => {
  const first = createHingeStore();
  const second = createHingeStore();
  let notifications = 0;
  const unsubscribe = first.subscribe(() => {
    notifications++;
  });
  const open = normalizeHinge({
    available: true,
    angle: Math.PI,
    status: 'fullyOpen',
  });
  first.update(open);
  first.update({ ...open });
  assert.equal(notifications, 1);
  assert.equal(second.getSnapshot(), unavailableHinge);
  unsubscribe();
  first.update(unavailableHinge);
  assert.equal(notifications, 1);
});

test('hook receives changes, uses the latest callback, and cleans up on unmount', async () => {
  const store = createHingeStore();
  const first: HingeState[] = [];
  const second: HingeState[] = [];
  function Probe({ callback }: { callback: (hinge: HingeState) => void }) {
    const hinge = useHingeChange(callback);
    return createElement('div', null, hinge.status);
  }
  const render = (callback: (hinge: HingeState) => void) =>
    createElement(
      HingeContext,
      { value: store },
      createElement(Probe, { callback })
    );
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(render((hinge) => first.push(hinge)));
  });
  assert.deepEqual(first, [unavailableHinge]);
  await act(() => {
    root.update(render((hinge) => second.push(hinge)));
  });
  await act(() => {
    store.update({ available: true, angle: 1.5, status: 'partiallyOpen' });
  });
  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(root.root.findByType('div').children[0], 'partiallyOpen');
  await act(() => {
    root.unmount();
  });
  store.update(unavailableHinge);
  assert.equal(second.length, 1);
});
