import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type Arrangement = 'split' | 'overlay';
export type ArrangementAxes = 'both' | 'horizontal' | 'vertical';
/** The physical side the primary pane takes when the panes are side by side. */
export type PrimaryEdge = 'left' | 'right';
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
  /**
   * The physical side the primary pane takes when the panes are side by side,
   * whatever the layout direction. `right` keeps the content that was on a
   * book-style foldable's cover display under the user as they unfold it.
   * Stacked panes are unaffected. By default a split's primary pane is on the
   * leading side, and an overlay's is after the hinge.
   */
  primaryEdge?: PrimaryEdge;
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
}
