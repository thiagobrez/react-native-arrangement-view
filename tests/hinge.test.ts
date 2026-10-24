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
import type { Fold, HingeState } from '../src/types.ts';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type NativeHinge = Parameters<typeof normalizeHinge>[0];

const nativeFold = (
  x: number,
  y: number,
  width: number,
  height: number
): NativeHinge => ({
  available: true,
  angle: 1.5,
  status: 'partiallyOpen',
  hasFold: true,
  fold: { x, y, width, height },
});

const fold = (x: number, y: number, width: number, height: number): Fold =>
  normalizeHinge(nativeFold(x, y, width, height)).fold!;

const noFold = {
  available: true,
  angle: 1.5,
  status: 'partiallyOpen',
  hasFold: false,
  fold: { x: 0, y: 0, width: 0, height: 0 },
} as const;

test('missing hardware is unavailable, and unknown future statuses stay unknown', () => {
  assert.deepEqual(
    normalizeHinge({
      available: false,
      angle: Math.PI,
      status: 'fullyOpen',
      hasFold: true,
      fold: { x: 1, y: 2, width: 3, height: 4 },
    }),
    unavailableHinge
  );
  assert.deepEqual(
    normalizeHinge({ ...noFold, angle: 1.25, status: 'futureStatus' }),
    { available: true, angle: 1.25, status: 'unknown', fold: null }
  );
  assert.equal(normalizeHinge({ ...noFold, angle: NaN }).angle, null);
});

test('native radians are preserved without angle-based status inference', () => {
  const event = {
    available: true,
    angle: Math.PI,
    status: 'fullyOpen',
    hasFold: false,
    fold: { x: 0, y: 0, width: 0, height: 0 },
  } as const;
  assert.deepEqual(normalizeHinge(event), {
    available: true,
    angle: Math.PI,
    status: 'fullyOpen',
    fold: null,
  });
});

test('the fold a native event describes becomes a Fold, and its absence is null', () => {
  assert.deepEqual(normalizeHinge(noFold).fold, null);
  assert.deepEqual(normalizeHinge(nativeFold(426, 0, 0, 2152)).fold, {
    x: 426,
    y: 0,
    width: 0,
    height: 2152,
    orientation: 'vertical',
  });
});

test('orientation follows the rect, not which platform sent it', () => {
  const pixelBookLine = fold(426, 0, 0, 2152);
  const pixelTabletopLine = fold(0, 426, 2152, 0);
  const duoBookBand = fold(170, 0, 40, 750);
  const duoTabletopBand = fold(0, 170, 750, 40);
  const squareBand = fold(0, 0, 40, 40);
  assert.equal(pixelBookLine.orientation, 'vertical');
  assert.equal(pixelTabletopLine.orientation, 'horizontal');
  assert.equal(duoBookBand.orientation, 'vertical');
  assert.equal(duoTabletopBand.orientation, 'horizontal');
  assert.equal(squareBand.orientation, 'vertical');
});

test('a rect that is not a fold parses as no fold', () => {
  for (const rect of [
    { x: NaN, y: 0, width: 0, height: 100 },
    { x: 0, y: Infinity, width: 0, height: 100 },
    { x: 0, y: 0, width: NaN, height: 100 },
    { x: 0, y: 0, width: 0, height: -1 },
    { x: 0, y: 0, width: -5, height: 100 },
  ]) {
    assert.equal(
      normalizeHinge({ ...noFold, hasFold: true, fold: rect }).fold,
      null,
      `${JSON.stringify(rect)}`
    );
  }
  assert.equal(normalizeHinge(noFold).fold, null);
  assert.deepEqual(normalizeHinge(nativeFold(0, 0, 0, 0)).fold, {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    orientation: 'vertical',
  });
});

test('a closed hinge reports no fold, whatever the native event says', () => {
  const closed = { ...nativeFold(170, 0, 40, 750), angle: 0, status: 'closed' };
  assert.equal(normalizeHinge(closed).fold, null);
  assert.equal(normalizeHinge(closed).status, 'closed');
  assert.equal(normalizeHinge(closed).angle, 0);
  assert.deepEqual(
    normalizeHinge({ ...closed, status: 'partiallyOpen' }).fold,
    fold(170, 0, 40, 750)
  );
});

test('a fold is frozen', () => {
  assert.ok(Object.isFrozen(fold(1, 2, 3, 4)));
});

test('the store keeps one fold object while its rect is unchanged', () => {
  const store = createHingeStore();
  store.update(normalizeHinge(nativeFold(426, 0, 0, 2152)));
  const first = store.getSnapshot().fold;
  assert.ok(first);
  store.update(normalizeHinge({ ...nativeFold(426, 0, 0, 2152), angle: 2.1 }));
  assert.equal(store.getSnapshot().fold, first);
  assert.equal(store.getSnapshot().angle, 2.1);
  store.update(normalizeHinge(nativeFold(427, 0, 0, 2152)));
  const moved = store.getSnapshot().fold;
  assert.notEqual(moved, first);
  assert.equal(moved?.x, 427);
  store.update(normalizeHinge(nativeFold(426, 0, 0, 2152)));
  assert.notEqual(store.getSnapshot().fold, moved);
  assert.equal(store.getSnapshot().fold?.x, 426);
});

test('the store keeps a null fold, and reports one that appears or goes away', () => {
  const store = createHingeStore();
  store.update(normalizeHinge(noFold));
  assert.equal(store.getSnapshot().fold, null);
  store.update(normalizeHinge(noFold));
  assert.equal(store.getSnapshot().fold, null);
  store.update(normalizeHinge(nativeFold(0, 170, 750, 40)));
  const band = store.getSnapshot().fold;
  assert.equal(band?.orientation, 'horizontal');
  store.update(normalizeHinge(noFold));
  assert.equal(store.getSnapshot().fold, null);
});

test('an update that changes nothing notifies nobody', () => {
  const store = createHingeStore();
  store.update(normalizeHinge(nativeFold(426, 0, 0, 2152)));
  let notifications = 0;
  store.subscribe(() => {
    notifications++;
  });
  store.update(normalizeHinge(nativeFold(426, 0, 0, 2152)));
  assert.equal(notifications, 0);
  store.update(normalizeHinge(nativeFold(426, 1, 0, 2152)));
  assert.equal(notifications, 1);
});

test('independent arrangements do not leak events, and unsubscribe stops delivery', () => {
  const first = createHingeStore();
  const second = createHingeStore();
  let notifications = 0;
  const unsubscribe = first.subscribe(() => {
    notifications++;
  });
  const open = normalizeHinge({
    ...noFold,
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
    store.update({
      available: true,
      angle: 1.5,
      status: 'partiallyOpen',
      fold: null,
    });
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

test('an arrangement feeds native events to its store, and keeps it across renders', async () => {
  let store!: ReturnType<typeof createHingeStore>;
  let onHingeChange!: ReturnType<typeof useHingeStore>[1];
  function Arrangement() {
    [store, onHingeChange] = useHingeStore();
    return null;
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(createElement(Arrangement));
  });
  const initialStore = store;
  assert.equal(store.getSnapshot(), unavailableHinge);

  const nativeEvent = {
    available: true,
    angle: Math.PI,
    status: 'fullyOpen',
    hasFold: false,
    fold: { x: 0, y: 0, width: 0, height: 0 },
  };
  onHingeChange({ nativeEvent });
  assert.deepEqual(store.getSnapshot(), normalizeHinge(nativeEvent));

  await act(() => {
    root.update(createElement(Arrangement));
  });
  assert.equal(store, initialStore);
  assert.deepEqual(store.getSnapshot(), normalizeHinge(nativeEvent));

  const foldEvent = nativeFold(355, 0, 40, 750);
  onHingeChange({ nativeEvent: foldEvent });
  assert.deepEqual(store.getSnapshot().fold, {
    x: 355,
    y: 0,
    width: 40,
    height: 750,
    orientation: 'vertical',
  });
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
    outer.update(
      normalizeHinge({ ...noFold, angle: Math.PI, status: 'fullyOpen' })
    );
  });
  assert.equal(root.root.findByType('div').children[0], 'unknown');
  await act(() => {
    inner.update(normalizeHinge(nativeFold(0, 170, 750, 40)));
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
      store.update({
        available: true,
        angle,
        status: 'partiallyOpen',
        fold: null,
      });
    });
  }
  assert.equal(renders, 2);
  assert.equal(root.root.findByType('div').children[0], 'true');
  await act(() => {
    store.update({
      available: true,
      angle: Math.PI,
      status: 'fullyOpen',
      fold: null,
    });
  });
  assert.equal(renders, 3);
  assert.equal(root.root.findByType('div').children[0], 'false');
});

test('a selector that returns the fold renders when it moves, not at every angle', async () => {
  const store = createHingeStore();
  let renders = 0;
  const selections: (Fold | null)[] = [];
  function Probe() {
    renders++;
    selections.push(useHingeSelector((hinge) => hinge.fold));
    return createElement(
      'div',
      null,
      String(selections[selections.length - 1]?.x ?? '-')
    );
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(
      createElement(HingeContext, { value: store }, createElement(Probe))
    );
  });
  assert.equal(renders, 1);
  assert.equal(selections[0], null);

  await act(() => {
    store.update(normalizeHinge(nativeFold(426, 0, 0, 2152)));
  });
  assert.equal(renders, 2);
  const landed = selections[1];
  assert.equal(landed?.x, 426);

  for (const angle of [1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5]) {
    await act(() => {
      store.update(normalizeHinge({ ...nativeFold(426, 0, 0, 2152), angle }));
    });
  }
  assert.equal(renders, 2);
  assert.equal(selections[1], landed);
  assert.equal(store.getSnapshot().angle, 2.5);

  await act(() => {
    store.update(normalizeHinge(nativeFold(426, 0, 0, 2150)));
  });
  assert.equal(renders, 3);
  assert.notEqual(selections[2], landed);
  assert.equal(root.root.findByType('div').children[0], '426');

  await act(() => {
    store.update(normalizeHinge(noFold));
  });
  assert.equal(renders, 4);
  assert.equal(selections[3], null);
});

test('a selector can return one number of the fold, or the fold for one posture', async () => {
  const store = createHingeStore();
  const xs: (number | null)[] = [];
  const books: (Fold | null)[] = [];
  function Probe() {
    xs.push(useHingeSelector((hinge) => hinge.fold?.x ?? null));
    books.push(
      useHingeSelector((hinge) =>
        hinge.fold?.orientation === 'vertical' ? hinge.fold : null
      )
    );
    return null;
  }
  await act(() => {
    create(createElement(HingeContext, { value: store }, createElement(Probe)));
  });
  assert.deepEqual([xs.at(-1), books.at(-1)], [null, null]);

  await act(() => {
    store.update(normalizeHinge(nativeFold(0, 170, 750, 40)));
  });
  assert.deepEqual([xs.at(-1), books.at(-1)], [0, null]);

  await act(() => {
    store.update(normalizeHinge(nativeFold(426, 0, 0, 2152)));
  });
  assert.equal(xs.at(-1), 426);
  assert.equal(books.at(-1)?.orientation, 'vertical');
});
