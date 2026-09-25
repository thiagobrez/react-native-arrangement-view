import { ArrangementPrimary, ArrangementSecondary } from './slots';
import type { ArrangementViewProps } from './types';

/** Platforms other than iOS and Android, such as web, are not implemented. */
export function ArrangementView(_props: ArrangementViewProps): never {
  throw new Error(
    'react-native-arrangement-view supports iOS and Android only.'
  );
}
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;
