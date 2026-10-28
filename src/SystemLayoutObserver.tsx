import { useState, type JSX } from 'react';
import { createSystemLayoutStore, SystemLayoutContext } from './systemLayout';
import type { SystemLayoutObserverProps } from './types';

/**
 * Reports what the system reserves in the view that contains it, such as a
 * fold, an occlusion, or the safe area, in that view's coordinates. It fills
 * its parent behind the children, and takes no space and no touches. Its
 * children read the layout with `useSystemLayout`, and the component that
 * renders it with `onSystemLayoutChange`. Where there is nothing to observe,
 * such as on web, the children still render and the layout stays null.
 */
export function SystemLayoutObserver({
  children,
}: SystemLayoutObserverProps): JSX.Element {
  const [store] = useState(createSystemLayoutStore);
  return <SystemLayoutContext value={store}>{children}</SystemLayoutContext>;
}
