import { useState } from 'react';
import { createHingeStore, HingeContext } from './hinge';
import type { HingeObserverProps } from './types';

/**
 * Platforms other than iOS and Android, such as web, have no hinge to observe.
 * The children render, and the state stays unavailable.
 */
export function HingeObserver({ children }: HingeObserverProps) {
  const [store] = useState(createHingeStore);
  return <HingeContext value={store}>{children}</HingeContext>;
}
