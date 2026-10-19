import type { JSX } from 'react';
import { ArrangementPrimary, ArrangementSecondary } from './slots';
import type { ArrangementViewProps } from './types';

/**
 * The container where you render your `ArrangementView.Primary` and
 * `ArrangementView.Secondary` panes. Depending on `arrangement`, `axes`, the
 * window size, and the hinge, it places them side by side, stacked, or
 * overlaid, or it shows only the primary pane and keeps the secondary mounted.
 * On platforms other than iOS and Android, such as web, rendering it throws.
 */
export function ArrangementView(_props: ArrangementViewProps): JSX.Element {
  throw new Error(
    'react-native-arrangement-view supports iOS and Android only.'
  );
}
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;
