import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { arrange, type Geometry } from '../src/arrange.ts';
import {
  createLayoutStore,
  describeLayout,
  LayoutContext,
  useArrangementLayout,
  useLayoutStore,
} from '../src/layout.ts';
import type { ArrangementLayout } from '../src/types.ts';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const window = (width: number, height: number): Geometry => ({
  width,
  height,
  window: { width, height },
});
const inner = window(850, 880);
const coverPortrait = window(440, 960);
const phone = window(400, 700);
const book: Geometry = {
  ...inner,
  fold: {
    x: 425,
    y: 0,
    width: 0,
    height: 880,
    orientation: 'vertical',
    separating: true,
    halfOpened: true,
  },
};
const split = { arrangement: 'split', axes: 'both' } as const;
const overlay = { arrangement: 'overlay', axes: 'both' } as const;

test('the layout says whether the secondary pane shows, and along which axis', () => {
  const cases: [Geometry, typeof split | typeof overlay, ArrangementLayout][] =
    [
      [inner, split, { secondaryVisible: true, axis: 'horizontal' }],
      [coverPortrait, split, { secondaryVisible: true, axis: 'vertical' }],
      [phone, split, { secondaryVisible: false, axis: null }],
      [inner, overlay, { secondaryVisible: true, axis: null }],
      [book, overlay, { secondaryVisible: true, axis: 'horizontal' }],
      [book, split, { secondaryVisible: true, axis: 'horizontal' }],
    ];
  for (const [geometry, options, layout] of cases) {
    assert.deepEqual(describeLayout(arrange(geometry, options)), layout);
  }
  // Whichever side the primary pane is on.
  assert.deepEqual(
    describeLayout(arrange(inner, { ...split, primaryEdge: 'trailing' })),
    { secondaryVisible: true, axis: 'horizontal' }
  );
});

test('the store starts unknown and notifies only when the layout changes', () => {
  const store = createLayoutStore();
  assert.equal(store.getSnapshot(), null);
  let notifications = 0;
  store.subscribe(() => notifications++);
  store.update({ secondaryVisible: true, axis: 'horizontal' });
  store.update({ secondaryVisible: true, axis: 'horizontal' });
  assert.equal(notifications, 1);
  store.update({ secondaryVisible: false, axis: null });
  assert.equal(notifications, 2);
});

test('the hook and the arrangement callback receive each known layout', async () => {
  const fromPane: (ArrangementLayout | null)[] = [];
  const fromHook: ArrangementLayout[] = [];
  const fromProp: ArrangementLayout[] = [];
  let store!: ReturnType<typeof createLayoutStore>;
  function Pane() {
    fromPane.push(useArrangementLayout((layout) => fromHook.push(layout)));
    return null;
  }
  function Arrangement() {
    store = useLayoutStore((layout) => fromProp.push(layout));
    return createElement(LayoutContext, { value: store }, createElement(Pane));
  }
  let root!: ReactTestRenderer;
  await act(() => {
    root = create(createElement(Arrangement));
  });
  const side = { secondaryVisible: true, axis: 'horizontal' } as const;
  await act(() => store.update(side));
  await act(() => store.update({ secondaryVisible: false, axis: null }));
  assert.deepEqual(fromPane, [
    null,
    side,
    { secondaryVisible: false, axis: null },
  ]);
  assert.deepEqual(fromHook, fromPane.slice(1));
  assert.deepEqual(fromProp, fromPane.slice(1));
  await act(() => root.unmount());
});
