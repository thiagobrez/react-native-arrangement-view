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

/** One arrangement's store, and the native event handler that feeds it. */
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

/** Observe the nearest ArrangementView. Call inside either pane's component. */
export function useHingeChange(onChange?: HingeChangeHandler): HingeState {
  const store = useContext(HingeContext);
  if (!store)
    throw new Error(
      'useHingeChange must be used inside an ArrangementView pane.'
    );
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
