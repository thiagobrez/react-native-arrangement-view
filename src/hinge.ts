import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type {
  Fold,
  HingeChangeHandler,
  HingeState,
  HingeStatus,
} from './types';

type NativeHinge = Readonly<{
  available: boolean;
  angle: number;
  status: string;
  hasFold: boolean;
  fold: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

export const unavailableHinge: HingeState = Object.freeze({
  available: false,
  angle: null,
  status: 'unknown',
  fold: null,
});

export function normalizeHinge(event: NativeHinge): HingeState {
  if (!event.available) return unavailableHinge;
  const statuses: readonly string[] = ['closed', 'partiallyOpen', 'fullyOpen'];
  const status = statuses.includes(event.status)
    ? (event.status as HingeStatus)
    : 'unknown';
  return {
    available: true,
    angle: Number.isFinite(event.angle) ? event.angle : null,
    status,
    fold: dividesTheWindow(status, event) ? parseFold(event.fold) : null,
  };
}

function dividesTheWindow(status: HingeStatus, event: NativeHinge): boolean {
  return status !== 'closed' && event.hasFold;
}

function parseFold(rect: NativeHinge['fold']): Fold | null {
  const { x, y, width, height } = rect;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 0 ||
    height < 0
  )
    return null;
  return Object.freeze({
    x,
    y,
    width,
    height,
    orientation: width > height ? 'horizontal' : 'vertical',
  }) as Fold;
}

export function createHingeStore() {
  let current = unavailableHinge;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(next: HingeState) {
      const stableFold = sameRect(next.fold, current.fold)
        ? current.fold
        : next.fold;
      if (
        next.available === current.available &&
        next.angle === current.angle &&
        next.status === current.status &&
        stableFold === current.fold
      )
        return;
      current = stableFold === next.fold ? next : { ...next, fold: stableFold };
      listeners.forEach((listener) => listener());
    },
  };
}

function sameRect(a: Fold | null, b: Fold | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}
export const HingeContext = createContext<ReturnType<
  typeof createHingeStore
> | null>(null);

/** One observer's store, and the native event handler that feeds it. */
export function useHingeStore() {
  const [store] = useState(createHingeStore);
  const onHingeChange = useCallback(
    (event: { nativeEvent: Parameters<typeof normalizeHinge>[0] }) =>
      store.update(normalizeHinge(event.nativeEvent)),
    [store]
  );
  return [store, onHingeChange] as const;
}

function useNearestHingeStore(hook: string) {
  const store = useContext(HingeContext);
  if (!store)
    throw new Error(
      `${hook} must be used inside a HingeObserver or an ArrangementView pane.`
    );
  return store;
}

/**
 * Observe the nearest HingeObserver, or the ArrangementView whose pane this is,
 * whichever is closer.
 */
export function useHingeChange(onChange?: HingeChangeHandler): HingeState {
  const store = useNearestHingeStore('useHingeChange');
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  const hinge = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  useEffect(() => {
    callback.current?.(hinge);
  }, [hinge]);
  return hinge;
}

type HingeSelection = string | number | boolean | null | undefined | Fold;

/**
 * Observe one value derived from the hinge, such as whether it is half-open.
 * The component renders again only when that value changes, however often the
 * angle does. Return a primitive or `hinge.fold` as it is: the fold keeps its
 * identity until it moves, but a copy would never compare equal to the last one.
 */
export function useHingeSelector<T extends HingeSelection>(
  selector: (hinge: HingeState) => T
): T {
  const store = useNearestHingeStore('useHingeSelector');
  const select = () => selector(store.getSnapshot());
  return useSyncExternalStore(store.subscribe, select, select);
}
