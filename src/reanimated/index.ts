import { useEffect, useMemo } from 'react';
import { findNodeHandle } from 'react-native';
import {
  useEvent,
  useSharedValue,
  type DerivedValue,
} from 'react-native-reanimated';
import { normalizeHinge, useNearestHingeStore } from '../hinge';
import type { HingeStatus } from '../types';

/** The hinge as shared values, for worklets to read on the UI thread. */
export type AnimatedHinge = Readonly<{
  available: DerivedValue<boolean>;
  /** In radians. Null while the hinge is unavailable, or its angle unknown. */
  angle: DerivedValue<number | null>;
  status: DerivedValue<HingeStatus>;
}>;

// useEvent's handler is typed as a function, for animated components' props.
// It can also register for any view's events, as Reanimated's own
// useScrollOffset does, so the observer's native view needn't be animated.
type EventHandlerInternal = {
  workletEventHandler: {
    registerForEvents(viewTag: number): void;
    unregisterFromEvents(viewTag: number): void;
  };
};

/**
 * Observe the nearest HingeObserver, or the ArrangementView whose pane this is,
 * on the UI thread: the hinge reaches the shared values without rendering the
 * component, however busy the JS thread is.
 */
export function useAnimatedHinge(): AnimatedHinge {
  const store = useNearestHingeStore('useAnimatedHinge');
  const initial = store.getSnapshot();
  const available = useSharedValue(initial.available);
  const angle = useSharedValue(initial.angle);
  const status = useSharedValue(initial.status);
  const handler = useEvent<Parameters<typeof normalizeHinge>[0]>(
    (event) => {
      'worklet';
      const hinge = normalizeHinge(event);
      available.set(hinge.available);
      angle.set(hinge.angle);
      status.set(hinge.status);
    },
    ['onHingeChange']
  ) as unknown as EventHandlerInternal;

  useEffect(() => {
    // Platforms without a hinge, such as web, have no view to follow.
    const tag = findNodeHandle(store.getView());
    if (tag == null) return;
    const { workletEventHandler } = handler;
    workletEventHandler.registerForEvents(tag);
    // Counted once registered: the view then replays the current state to it.
    const release = store.addWorklet();
    return () => {
      release();
      workletEventHandler.unregisterFromEvents(tag);
    };
  }, [store, handler]);

  return useMemo(
    () => ({ available, angle, status }),
    [available, angle, status]
  );
}
