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
  useHingeSelector,
  useHingeStore,
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
  // Android sends an unknown angle as negative, since Reanimated drops NaN.
  assert.equal(
    normalizeHinge({ available: true, angle: -1, status: 'partiallyOpen' })
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

test('an arrangement feeds native events to its store, and resets it when observation stops', async () => {
  let store!: ReturnType<typeof createHingeStore>;
  let onHingeChange!: ReturnType<typeof useHingeStore>[1]['onHingeChange'];
  function Arrangement({ observeHinge }: { observeHinge: boolean }) {
    [store, { onHingeChange }] = useHingeStore(observeHinge);
    return null;
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(createElement(Arrangement, { observeHinge: true }));
  });
  const initialStore = store;
  assert.equal(store.getSnapshot(), unavailableHinge);

  const nativeEvent = { available: true, angle: Math.PI, status: 'fullyOpen' };
  onHingeChange({ nativeEvent });
  assert.deepEqual(store.getSnapshot(), nativeEvent);

  await act(() => {
    root.update(createElement(Arrangement, { observeHinge: false }));
  });
  assert.equal(store, initialStore);
  assert.equal(store.getSnapshot(), unavailableHinge);
});

test('the native view counts the worklets following it, until each is released', async () => {
  let store!: ReturnType<typeof createHingeStore>;
  const counts: number[] = [];
  function Observer() {
    const [observed, { hingeWorklets }] = useHingeStore(true);
    store = observed;
    counts.push(hingeWorklets);
    return null;
  }
  await act(() => {
    create(createElement(Observer));
  });
  let releaseFirst!: () => void;
  let releaseSecond!: () => void;
  await act(() => {
    releaseFirst = store.addWorklet();
    releaseSecond = store.addWorklet();
  });
  assert.equal(counts.at(-1), 2);
  await act(() => {
    releaseFirst();
  });
  assert.equal(counts.at(-1), 1);
  await act(() => {
    releaseSecond();
  });
  assert.equal(counts.at(-1), 0);
});

test('the hook reads the nearest observer, and needs one', async () => {
  const outer = createHingeStore();
  const inner = createHingeStore();
  function Probe() {
    return createElement('div', null, useHingeChange().status);
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(
      createElement(
        HingeContext,
        { value: outer },
        createElement(HingeContext, { value: inner }, createElement(Probe))
      )
    );
  });
  await act(() => {
    outer.update({ available: true, angle: Math.PI, status: 'fullyOpen' });
  });
  assert.equal(root.root.findByType('div').children[0], 'unknown');
  await act(() => {
    inner.update({ available: true, angle: 1.5, status: 'partiallyOpen' });
  });
  assert.equal(root.root.findByType('div').children[0], 'partiallyOpen');

  const error = console.error;
  console.error = () => {};
  try {
    await assert.rejects(async () => {
      await act(() => {
        create(createElement(Probe));
      });
    }, /inside a HingeObserver or an ArrangementView pane/);
  } finally {
    console.error = error;
  }
});

test('a selector renders again only when its value changes', async () => {
  const store = createHingeStore();
  let renders = 0;
  function Probe() {
    renders++;
    const halfOpen = useHingeSelector(
      (hinge) => hinge.status === 'partiallyOpen'
    );
    return createElement('div', null, String(halfOpen));
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(
      createElement(HingeContext, { value: store }, createElement(Probe))
    );
  });
  assert.equal(renders, 1);
  for (const angle of [0.5, 1, 1.5]) {
    await act(() => {
      store.update({ available: true, angle, status: 'partiallyOpen' });
    });
  }
  assert.equal(renders, 2);
  assert.equal(root.root.findByType('div').children[0], 'true');
  await act(() => {
    store.update({ available: true, angle: Math.PI, status: 'fullyOpen' });
  });
  assert.equal(renders, 3);
  assert.equal(root.root.findByType('div').children[0], 'false');
});
