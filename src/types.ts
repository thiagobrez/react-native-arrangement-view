import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type Arrangement = 'split' | 'overlay';
export type ArrangementAxes = 'both' | 'horizontal' | 'vertical';
export type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
/** Angle is in radians. A missing hinge is unavailable, never assumed flat. */
export type HingeState = Readonly<{
  available: boolean;
  angle: number | null;
  status: HingeStatus;
}>;
export type HingeChangeHandler = (hinge: HingeState) => void;
export interface ArrangementViewProps extends ViewProps {
  primary: ReactNode;
  secondary: ReactNode;
  arrangement?: Arrangement;
  axes?: ArrangementAxes;
  /** Disable hinge observation without affecting adaptive layout. Default true. */
  observeHinge?: boolean;
}
