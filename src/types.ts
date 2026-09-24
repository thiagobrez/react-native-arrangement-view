import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type Arrangement = 'split' | 'overlay';
export type ArrangementAxes = 'both' | 'horizontal' | 'vertical';
/** Which hinges the panes keep clear of, after Material's `HingePolicy`. */
export type HingePolicy = 'avoidSeparating' | 'alwaysAvoid' | 'neverAvoid';
export type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
/** Angle is in radians. A missing hinge is unavailable, never assumed flat. */
export type HingeState = Readonly<{
  available: boolean;
  angle: number | null;
  status: HingeStatus;
}>;
export type HingeChangeHandler = (hinge: HingeState) => void;
export interface ArrangementViewProps extends ViewProps {
  /**
   * Exactly one `ArrangementView.Primary` and one `ArrangementView.Secondary`.
   * Any other child is ignored with a development warning.
   */
  children?: ReactNode;
  arrangement?: Arrangement;
  axes?: ArrangementAxes;
  /** Disable hinge observation without affecting adaptive layout. Default true. */
  observeHinge?: boolean;
  /**
   * Android only. Which hinges the panes keep clear of: `avoidSeparating`
   * (default) a half-open one, `alwaysAvoid` a flat one too, `neverAvoid` none.
   * iOS always avoids a half-open hinge.
   */
  hingePolicy?: HingePolicy;
  /** Android only. The space in dp between the panes around an avoided hinge. Default 24. */
  hingeGap?: number;
  /**
   * Android only. Allow two panes side by side in a medium-width window
   * (600–839 dp), which otherwise shows one. Default false.
   */
  twoPanesOnMediumWidth?: boolean;
}
