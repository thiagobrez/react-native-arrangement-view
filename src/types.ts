import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type Arrangement = 'split' | 'overlay';
export type ArrangementAxes = 'both' | 'horizontal' | 'vertical';
/** The side the primary pane takes when the panes are side by side. */
export type PrimaryEdge = 'leading' | 'trailing';
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
export interface HingeObserverProps {
  /** The tree in which `useHingeChange` observes this observer's window. */
  children?: ReactNode;
}
/** What an arrangement shows. */
export type ArrangementLayout = Readonly<{
  /** The secondary pane is on screen: beside the primary, or behind it in overlay. */
  secondaryVisible: boolean;
  /** How the two panes are placed; null when only the primary shows or they overlap. */
  axis: 'horizontal' | 'vertical' | null;
  /** Whether the panes, when arranged in "overlay", are overlapping. Usually when the device is closed or fully open. */
  isOverlapping: boolean;
}>;
export type ArrangementLayoutHandler = (layout: ArrangementLayout) => void;
export interface ArrangementViewProps extends ViewProps {
  /**
   * Exactly one `ArrangementView.Primary` and one `ArrangementView.Secondary`.
   * Any other child is ignored with a development warning.
   */
  children?: ReactNode;
  arrangement?: Arrangement;
  axes?: ArrangementAxes;
  /**
   * The side the primary pane takes when the panes are side by side: in a left-to-right layout,
   * leading is left, and trailing is right. Stacked panes are unaffected.
   * By default a split's primary pane is on the leading side, and
   * an overlay's is after the hinge, on the trailing side.
   *
   * Screen readers go through the panes in reading order, so with the primary
   * pane on the trailing side, the secondary pane is read first.
   */
  primaryEdge?: PrimaryEdge;
  /**
   * Called when the arrangement's layout changes, starting from its first.
   * Inside a pane, use `useArrangementLayout` instead.
   */
  onArrangementLayoutChange?: ArrangementLayoutHandler;
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
