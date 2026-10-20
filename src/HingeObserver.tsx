import { useState, type JSX } from 'react';
import { createHingeStore, HingeContext } from './hinge';
import type { HingeObserverProps } from './types';

/**
 * Provides the hinge state to `useHingeChange` and `useHingeSelector` calls
 * among its children. Each call reads the nearest `HingeObserver` or
 * `ArrangementView` above it in the React tree. It takes no space and no
 * touches. Where there is no hinge to observe, such as on web, the children
 * still render and the state stays unavailable.
 */
export function HingeObserver({ children }: HingeObserverProps): JSX.Element {
  const [store] = useState(createHingeStore);
  return <HingeContext value={store}>{children}</HingeContext>;
}
