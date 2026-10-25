import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { SystemLayoutEvent } from '../src/SystemLayoutObserverNativeComponent.ts';
import {
  createSystemLayoutStore,
  parseSystemLayout,
  SystemLayoutContext,
  useSystemLayout,
} from '../src/systemLayout.ts';
import type { Fold, SystemLayout } from '../src/types.ts';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type NativeFold = SystemLayoutEvent['folds'][number];

const noBars = { top: -1, bottom: -1, leading: -1, trailing: -1 };

/** The iPhone Duo's inner display in landscape, as T3 Code's fixtures have it. */
function duoEvent(
  overrides: Partial<SystemLayoutEvent> = {}
): SystemLayoutEvent {
  return {
    width: 960,
    height: 560,
    hasHinge: true,
    keepsLines: false,
    safeArea: { top: 0, right: 72, bottom: 20, left: 8 },
    folds: [],
    occlusions: [],
    horizontalSizeClass: 'regular',
    verticalBarEdge: 'trailing',
    barInsets: noBars,
    ...overrides,
  };
}

/** A Pixel Fold's inner display, in dp. */
function pixelEvent(
  overrides: Partial<SystemLayoutEvent> = {}
): SystemLayoutEvent {
  return {
    width: 841,
    height: 900,
    hasHinge: true,
    keepsLines: true,
    safeArea: { top: 24, right: 0, bottom: 16, left: 0 },
    folds: [],
    occlusions: [],
    horizontalSizeClass: '',
    verticalBarEdge: '',
    barInsets: noBars,
    ...overrides,
  };
}

function fold(
  x: number,
  y: number,
  width: number,
  height: number,
  overrides: Partial<NativeFold> = {}
): NativeFold {
  return {
    x,
    y,
    width,
    height,
    window: { x, y, width, height },
    separating: true,
    state: '',
    ...overrides,
  };
}

const parse = (event: SystemLayoutEvent) => parseSystemLayout(event, null);

test('iOS clips a division to the view with the bits CGRect.intersection gives', () => {
  // Expected values printed by CoreGraphics for these rects intersected with the view's bounds.
  const layout = parse(
    duoEvent({
      width: 960,
      height: 600,
      folds: [fold(456.1, 0.3, 48.3, 560.7)],
    })
  );
  assert.deepEqual(
    layout.folds.map(({ x, y, width, height }) => [x, y, width, height]),
    [[456.1, 0.3, 48.30000000000001, 560.7]]
  );
  const clipped = parse(
    duoEvent({ width: 960.3, height: 600, folds: [fold(920.4, 0, 48.9, 560)] })
  );
  assert.equal(clipped.folds[0]?.width, 39.89999999999998);
  assert.deepEqual(clipped.folds[0]?.window, {
    x: 920.4,
    y: 0,
    width: 48.9,
    height: 560,
  });
});

test('iOS drops a region that only touches the view, or is empty, as T3 Code did', () => {
  const column = duoEvent({
    width: 456,
    folds: [
      fold(456, 0, 48, 560),
      fold(-48, 0, 48, 560),
      fold(200, 0, 0, 560),
      fold(600, 0, 48, 560),
    ],
    occlusions: [
      { x: 456, y: 0, width: 60, height: 60 },
      { x: 8, y: 510, width: 60, height: 0 },
    ],
  });
  assert.deepEqual(parse(column).folds, []);
  assert.deepEqual(parse(column).occlusions, []);
});

test('Android keeps a fold line strictly inside the view, and drops one on its edge', () => {
  const inside = parse(pixelEvent({ folds: [fold(420.5, 0, 0, 900)] }));
  assert.deepEqual(inside.folds[0], {
    x: 420.5,
    y: 0,
    width: 0,
    height: 900,
    window: { x: 420.5, y: 0, width: 0, height: 900 },
    orientation: 'vertical',
    separating: true,
    state: null,
  });
  const onEdges = parse(
    pixelEvent({ folds: [fold(0, 0, 0, 900), fold(841, 0, 0, 900)] })
  );
  assert.deepEqual(onEdges.folds, []);
  const band = parse(pixelEvent({ folds: [fold(841, 0, 24, 900)] }));
  assert.deepEqual(band.folds, [], 'a hinge band touching the edge');
});

test('a fold taller than the view is clipped to it, and its orientation comes from the whole fold', () => {
  const shortRow = parse(
    pixelEvent({
      height: 30,
      folds: [fold(420.5, -100, 0, 900), fold(0, 15, 841, 0)],
    })
  );
  assert.deepEqual(
    shortRow.folds.map(({ y, height, orientation }) => ({
      y,
      height,
      orientation,
    })),
    [
      { y: 0, height: 30, orientation: 'vertical' },
      { y: 15, height: 0, orientation: 'horizontal' },
    ]
  );
  const square = parse(duoEvent({ folds: [fold(100, 100, 40, 40)] }));
  assert.equal(square.folds[0]?.orientation, 'vertical');
});

test('folds and occlusions keep the platform order', () => {
  const layout = parse(
    duoEvent({
      folds: [
        fold(456, 0, 48, 560, { separating: false }),
        fold(0, 240, 960, 40),
      ],
      occlusions: [
        { x: 8, y: 510, width: 60, height: 50 },
        { x: 8, y: 0, width: 60, height: 60 },
      ],
    })
  );
  assert.deepEqual(
    layout.folds.map((f) => [f.orientation, f.separating]),
    [
      ['vertical', false],
      ['horizontal', true],
    ]
  );
  assert.deepEqual(layout.occlusions, [
    { x: 8, y: 510, width: 60, height: 50 },
    { x: 8, y: 0, width: 60, height: 60 },
  ]);
});

test('wire values map to the public ones, and empty or unknown ones to null or absent', () => {
  const ios = parse(
    duoEvent({
      horizontalSizeClass: 'regular',
      verticalBarEdge: 'trailing',
      barInsets: { top: -1, bottom: 34, leading: 0, trailing: -1 },
    })
  );
  assert.equal(ios.horizontalSizeClass, 'regular');
  assert.equal(ios.verticalBarEdge, 'trailing');
  assert.deepEqual(ios.barInsets, { bottom: 34, leading: 0 });

  const android = parse(
    pixelEvent({
      folds: [
        fold(420.5, 0, 0, 900, { state: 'halfOpen' }),
        fold(420.5, 0, 0, 900, { state: 'flat' }),
        fold(420.5, 0, 0, 900, { state: 'tilted' }),
      ],
    })
  );
  assert.equal(android.horizontalSizeClass, null);
  assert.equal(android.verticalBarEdge, null);
  assert.deepEqual(android.barInsets, {});
  assert.deepEqual(
    android.folds.map((f) => f.state),
    ['halfOpen', 'flat', null]
  );

  const future = parse(
    duoEvent({ horizontalSizeClass: 'huge', verticalBarEdge: 'top' })
  );
  assert.equal(future.horizontalSizeClass, null);
  assert.equal(future.verticalBarEdge, null);
});

test('an equal report returns the previous layout itself', () => {
  const event = () =>
    duoEvent({
      folds: [fold(456, 0, 48, 560)],
      occlusions: [{ x: 535, y: 0, width: 134, height: 82 }],
      barInsets: { ...noBars, bottom: 34 },
    });
  const first = parse(event());
  assert.equal(parseSystemLayout(event(), first), first);
});

test('a new layout keeps the identity of every part that did not change', () => {
  const book = duoEvent({
    folds: [
      fold(456, 0, 48, 560),
      fold(0, 240, 960, 40, { separating: false }),
    ],
    occlusions: [{ x: 535, y: 0, width: 134, height: 82 }],
    barInsets: { ...noBars, bottom: 34 },
  });
  const first = parse(book);

  const insetsMoved = parseSystemLayout(
    { ...book, safeArea: { ...book.safeArea, top: 24 } },
    first
  );
  assert.notEqual(insetsMoved, first);
  assert.notEqual(insetsMoved.safeArea, first.safeArea);
  assert.equal(insetsMoved.folds, first.folds);
  assert.equal(insetsMoved.occlusions, first.occlusions);
  assert.equal(insetsMoved.barInsets, first.barInsets);

  const [vertical, horizontal] = book.folds as [NativeFold, NativeFold];
  const oneFoldMoved = parseSystemLayout(
    { ...book, folds: [vertical, { ...horizontal, separating: true }] },
    first
  );
  assert.notEqual(oneFoldMoved.folds, first.folds);
  assert.equal(oneFoldMoved.folds[0], first.folds[0]);
  assert.notEqual(oneFoldMoved.folds[1], first.folds[1]);
  assert.equal(oneFoldMoved.folds[1]?.window, first.folds[1]?.window);
  assert.equal(oneFoldMoved.safeArea, first.safeArea);
});

test('the store notifies only for a changed layout, and says which', () => {
  const store = createSystemLayoutStore();
  let notifications = 0;
  store.subscribe(() => {
    notifications++;
  });
  assert.equal(store.getSnapshot(), null);
  const first = store.update(duoEvent());
  assert.equal(first, store.getSnapshot());
  assert.equal(store.update(duoEvent()), null);
  assert.equal(notifications, 1);
  const wider = store.update(duoEvent({ width: 1000 }));
  assert.equal(wider?.width, 1000);
  assert.equal(notifications, 2);
});

test('useSystemLayout is null outside an observer, and before its first report', async () => {
  const seen: unknown[] = [];
  let selections = 0;
  function Probe() {
    seen.push(useSystemLayout());
    seen.push(
      useSystemLayout((layout) => {
        selections++;
        return layout.width;
      })
    );
    return null;
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(createElement(Probe));
  });
  assert.deepEqual(seen, [null, null]);
  await act(() => {
    root.update(
      createElement(
        SystemLayoutContext,
        { value: createSystemLayoutStore() },
        createElement(Probe)
      )
    );
  });
  assert.deepEqual(seen.slice(-2), [null, null]);
  assert.equal(selections, 0);
});

test('a selector renders again only when the value it selects changes', async () => {
  const store = createSystemLayoutStore();
  const creases: (Fold | null)[] = [];
  const layouts: (SystemLayout | null)[] = [];
  const crease = (layout: SystemLayout) =>
    layout.folds.find((f) => f.separating && f.orientation === 'vertical') ??
    null;
  function Menu() {
    creases.push(useSystemLayout(crease));
    return null;
  }
  function Screen() {
    layouts.push(useSystemLayout());
    return null;
  }
  await act(() => {
    create(
      createElement(
        SystemLayoutContext,
        { value: store },
        createElement(Menu),
        createElement(Screen)
      )
    );
  });
  const book = duoEvent({ folds: [fold(456, 0, 48, 560)] });
  await act(() => {
    store.update(book);
  });
  await act(() => {
    store.update({ ...book, safeArea: { ...book.safeArea, bottom: 0 } });
  });
  await act(() => {
    store.update({ ...book, safeArea: { ...book.safeArea, bottom: 0 } });
  });
  await act(() => {
    store.update({ ...book, folds: [] });
  });
  assert.equal(creases.length, 3, 'null, the fold, then null again');
  assert.equal(creases[1]?.x, 456);
  assert.equal(creases[1], layouts[1]?.folds[0]);
  assert.equal(
    creases[1],
    layouts[2]?.folds[0],
    'kept through the inset change'
  );
  assert.equal(creases[2], null);
  assert.equal(layouts.length, 4, 'one render per new layout');
});

test('a selector that builds a value renders once per new layout', async () => {
  const store = createSystemLayoutStore();
  const seen: (readonly Fold[] | null)[] = [];
  function Controls() {
    seen.push(
      useSystemLayout((layout) => layout.folds.filter((f) => f.separating))
    );
    return null;
  }
  await act(() => {
    create(
      createElement(
        SystemLayoutContext,
        { value: store },
        createElement(Controls)
      )
    );
  });
  const book = duoEvent({ folds: [fold(456, 0, 48, 560)] });
  await act(() => {
    store.update(book);
  });
  await act(() => {
    store.update(book);
  });
  await act(() => {
    store.update({ ...book, width: 1000 });
  });
  assert.equal(seen.length, 3, 'null, then one render for each new layout');
  assert.equal(seen[2]?.[0]?.x, 456);
});
