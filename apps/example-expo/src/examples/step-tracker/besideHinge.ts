import {
  useArrangementLayout,
  useHingeChange,
} from 'react-native-arrangement-view';

/**
 * Whether a half-open hinge separates this pane from the other. The system
 * already keeps the crease clear between them then, so a pane can drop its
 * own padding on that side. Call inside a pane.
 */
export function useBesideHinge() {
  const hinge = useHingeChange();
  const layout = useArrangementLayout();
  return hinge.status === 'partiallyOpen' && layout?.axis === 'horizontal';
}
