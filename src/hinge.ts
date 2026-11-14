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

export function createHingeStore(initial: HingeState | null = null) {
  let current = initial;
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
        next.available === current?.available &&
        next.angle === current?.angle &&
        next.status === current?.status
      )
        return;
      current = next;
      listeners.forEach((listener) => listener());
    },
  };
}
export const unavailableHingeStore = createHingeStore(unavailableHinge);
export const HingeContext = createContext<ReturnType<
  typeof createHingeStore
> | null>(null);

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
 * whichever is closer. Null until the platform first reports the hinge, or
 * that there is none. `onChange` runs for each report.
 */
export function useHingeChange(
  onChange?: HingeChangeHandler
): HingeState | null {
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
    if (hinge) callback.current?.(hinge);
  }, [hinge]);
  return hinge;
}

/**
 * Observe one value derived from the hinge, such as whether it is half-open.
 * The component renders again only when that value changes, however often the
 * angle does. The selector returns a primitive: an object built on each call
 * would never compare equal to the last one. Null until the first report,
 * which is also the first time the selector runs.
 */
export function useHingeSelector<
  T extends string | number | boolean | null | undefined,
>(selector: (hinge: HingeState) => T): T | null {
  const store = useNearestHingeStore('useHingeSelector');
  const select = () => {
    const hinge = store.getSnapshot();
    return hinge === null ? null : selector(hinge);
  };
  return useSyncExternalStore(store.subscribe, select, select);
}
