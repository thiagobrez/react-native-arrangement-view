import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type Arrangement = 'split' | 'overlay';
export type ArrangementAxes = 'both' | 'horizontal' | 'vertical';
/** The primary pane's side when the panes are side by side. */
export type HorizontalEdge = 'leading' | 'trailing';
/** The primary pane's side when an overlay's panes are stacked. */
export type VerticalEdge = 'top' | 'bottom';
/**
 * A side the primary pane takes: leading or trailing when the panes are side
 * by side, top or bottom when an overlay's panes are stacked.
 */
export type PrimaryEdge = HorizontalEdge | VerticalEdge;
/** Which hinges the panes keep clear of, after Material's `HingePolicy`. */
export type HingePolicy = 'avoidSeparating' | 'alwaysAvoid' | 'neverAvoid';
export type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';

/** Only the hinge store makes folds; see `useHingeSelector`. Not exported. */
declare const fromHingeStore: unique symbol;

/**
 * Where the fold divides the window, in the coordinates `measureInWindow` and
 * `getBoundingClientRect()` use, in dp (Android) or points (iOS). The area is the
 * one the system reserves for the fold: a line, 0 wide or tall, on an Android
 * folding screen; on iOS a band that includes Apple's touch margins; on a device
 * with two screens, the band its hinge hides.
 */
export type Fold = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  /** `vertical` when the fold runs top to bottom, as in book posture. Derived from the rect. */
  orientation: 'vertical' | 'horizontal';
  readonly [fromHingeStore]: true;
}>;

/** Angle is in radians. A missing hinge is unavailable, never assumed flat. */
export type HingeState = Readonly<{
  available: boolean;
  angle: number | null;
  status: HingeStatus;
  /**
   * Where the system divides the window at the fold. Null unless it does: while
   * a folding screen is half-open, or whenever the window spans a hinge between
   * two screens. The same value from every observer in a window.
   */
  fold: Fold | null;
}>;
export type HingeChangeHandler = (hinge: HingeState) => void;
export interface HingeObserverProps {
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
   * The side the primary pane takes. When the panes are side by side, leading
   * or trailing: in a left-to-right layout, leading is left, and trailing is
   * right. When an overlay's panes are stacked, as around a half-open hinge in
   * tabletop posture, top or bottom. Pass one side, or a horizontal and a
   * vertical side in that order, such as `['trailing', 'top']`.
   * By default a split's primary pane is on the leading side, and an
   * overlay's is after the hinge: on the trailing side, or below it. A split's
   * stacked primary pane is always on top.
   *
   * Screen readers go through the panes in reading order, so with the primary
   * pane on the trailing side, or below, the secondary pane is read first.
   */
  primaryEdge?: PrimaryEdge | readonly [HorizontalEdge, VerticalEdge];
  /**
   * Called when the arrangement's layout changes, starting from its first.
   * Inside a pane, use `useArrangementLayout` instead.
   */
  onArrangementLayoutChange?: ArrangementLayoutHandler;
  /**
   * Android only. Which hinges the panes keep clear of: `avoidSeparating`
   * (default) a half-open one, `alwaysAvoid` a flat one too, `neverAvoid` none.
   * iOS always avoids a half-open hinge.
   */
  hingePolicy?: HingePolicy;
  /** Android only. The space in dp between the panes around an avoided hinge. Default 24. */
  hingeGap?: number;
}
