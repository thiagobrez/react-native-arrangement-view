import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { PaneFrames } from './arrange';
import type { ArrangementLayout, ArrangementLayoutHandler } from './types';

/**
 * What the panes' frames show. Panes that overlap, as in overlay, have no
 * axis but are overlapping. A hidden secondary pane has no frame.
 */
export function describeLayout({
  primary,
  secondary,
}: PaneFrames): ArrangementLayout {
  if (!secondary)
    return { secondaryVisible: false, axis: null, isOverlapping: false };
  const overlap = (
    start: number,
    size: number,
    start2: number,
    size2: number
  ) => Math.min(start + size, start2 + size2) - Math.max(start, start2) > 0;
  const columns = overlap(
    primary.left,
    primary.width,
    secondary.left,
    secondary.width
  );
  const rows = overlap(
    primary.top,
    primary.height,
    secondary.top,
    secondary.height
  );
  if (columns && rows)
    return { secondaryVisible: true, axis: null, isOverlapping: true };
  return {
    secondaryVisible: true,
    axis: columns ? 'vertical' : 'horizontal',
    isOverlapping: false,
  };
}

/** One arrangement's layout: null until its panes are first laid out. */
export function createLayoutStore() {
  let current: ArrangementLayout | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(next: ArrangementLayout | null) {
      if (
        next?.secondaryVisible === current?.secondaryVisible &&
        next?.axis === current?.axis &&
        next?.isOverlapping === current?.isOverlapping
      )
        return;
      current = next;
      listeners.forEach((listener) => listener());
    },
  };
}
export const LayoutContext = createContext<ReturnType<
  typeof createLayoutStore
> | null>(null);

/**
 * One arrangement's store. It reports changes to `onChange` without
 * re-rendering the arrangement itself.
 */
export function useLayoutStore(onChange?: ArrangementLayoutHandler) {
  const [store] = useState(createLayoutStore);
  const callback = useLatest(onChange);
  useEffect(
    () =>
      store.subscribe(() => {
        const layout = store.getSnapshot();
        if (layout) callback.current?.(layout);
      }),
    [store, callback]
  );
  return store;
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * The nearest ArrangementView's layout: whether its secondary pane is on
 * screen, and how the panes are placed. Null until the panes are first laid
 * out. Call inside either pane's component.
 */
export function useArrangementLayout(
  onChange?: ArrangementLayoutHandler
): ArrangementLayout | null {
  const store = useContext(LayoutContext);
  if (!store)
    throw new Error(
      'useArrangementLayout must be used inside an ArrangementView pane.'
    );
  const callback = useLatest(onChange);
  const layout = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  useEffect(() => {
    if (layout) callback.current?.(layout);
  }, [layout, callback]);
  return layout;
}
