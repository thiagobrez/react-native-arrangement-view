import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { HingeChangeHandler, HingeState, HingeStatus } from './types';

export const unavailableHinge: HingeState = Object.freeze({
  available: false,
  angle: null,
  status: 'unknown',
});

export function normalizeHinge(event: {
  available: boolean;
  angle: number;
  status: string;
}): HingeState {
  if (!event.available) return unavailableHinge;
  const statuses: readonly string[] = ['closed', 'partiallyOpen', 'fullyOpen'];
  return {
    available: true,
    angle: Number.isFinite(event.angle) ? event.angle : null,
    status: statuses.includes(event.status)
      ? (event.status as HingeStatus)
      : 'unknown',
  };
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
      if (
        next.available === current.available &&
        next.angle === current.angle &&
        next.status === current.status
      )
        return;
      current = next;
      listeners.forEach((listener) => listener());
    },
  };
}
export const HingeContext = createContext<ReturnType<
  typeof createHingeStore
> | null>(null);

/** One observer's store, and the native event handler that feeds it. */
export function useHingeStore(observeHinge: boolean) {
  const [store] = useState(createHingeStore);
  const onHingeChange = useCallback(
    (event: { nativeEvent: Parameters<typeof normalizeHinge>[0] }) =>
      store.update(normalizeHinge(event.nativeEvent)),
    [store]
  );
  useEffect(() => {
    if (!observeHinge) store.update(unavailableHinge);
  }, [observeHinge, store]);
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

/**
 * Observe one value derived from the hinge, such as whether it is half-open.
 * The component renders again only when that value changes, however often the
 * angle does. The selector returns a primitive: an object built on each call
 * would never compare equal to the last one.
 */
export function useHingeSelector<
  T extends string | number | boolean | null | undefined,
>(selector: (hinge: HingeState) => T): T {
  const store = useNearestHingeStore('useHingeSelector');
  const select = () => selector(store.getSnapshot());
  return useSyncExternalStore(store.subscribe, select, select);
}
