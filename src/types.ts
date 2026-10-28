import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type Arrangement = 'split' | 'overlay';
export type ArrangementAxes = 'both' | 'horizontal' | 'vertical';
/** The primary pane's side when the panes are side by side. */
export type HorizontalEdge = 'leading' | 'trailing';
/** The primary pane's side when an overlay's panes are stacked. */
export type VerticalEdge = 'top' | 'bottom';
export type PrimaryEdge = HorizontalEdge | VerticalEdge;
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
  children?: ReactNode;
}
/** Points on iOS, dp on Android. */
export type Rect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;
/**
 * WindowManager's posture for a fold, `FoldingFeature.State`, which is `FLAT`
 * or `HALF_OPENED`. Android only.
 */
export type FoldState = 'flat' | 'halfOpen';
/**
 * A fold that runs through the observing view, in every posture the system
 * reports it. On Android it is flat or half-open, on iOS an inactive or active
 * division.
 *
 * `x`, `y`, `width` and `height` are the part of the fold inside the view, in
 * the view's coordinates. A band that only touches the view's edge is not
 * reported. An Android folding screen's fold is a line, 0 wide or tall, and is
 * reported when it runs strictly inside the view.
 *
 * The object keeps its identity until one of its values changes, so a
 * selector can return it as it is.
 */
export type Fold = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  /** The whole fold, in the coordinates `measureInWindow` returns. Every observer in a window reports the same rect. */
  window: Rect;
  /** `vertical` when the fold runs from top to bottom, as in book posture. Read from the whole fold, whose height is at least its width. */
  orientation: 'vertical' | 'horizontal';
  /**
   * The system divides content at the fold now. On iOS, the division region
   * is active, which is when UIKit moves its own columns to it. On Android,
   * `FoldingFeature.isSeparating`, true while half-open, and always for a hinge
   * between two screens.
   */
  separating: boolean;
  /**
   * Android: WindowManager's posture for the fold. iOS: always `null`, since
   * UIKit gives a region no posture. The hinge's posture is
   * `HingeState.status`.
   */
  state: FoldState | null;
}>;
/** An edge a bar floats on. `leading` and `trailing` follow the layout direction. */
export type BarEdge = 'top' | 'bottom' | HorizontalEdge;
/**
 * What the system reserves in the observing view, and the traits that decide
 * how to lay out around it, in the view's coordinates. `Fold.window` is the
 * only rect in the window's.
 *
 * A new object means a value changed. Unchanged parts (`safeArea`, `folds`,
 * each `Fold`, `occlusions`, `barInsets`) keep their identity. `folds` and
 * `occlusions` keep the platform's order. Nothing follows the hinge angle.
 */
export type SystemLayout = Readonly<{
  width: number;
  height: number;
  /**
   * Whether the system gives the view's window a hinge. Once true, it stays
   * true.
   *
   * On iOS 27.1 and later, true from the first hinge update that has a hinge.
   * False when the first update has none, or when none arrives within 250 ms
   * of the view joining a window, since UIKit sends nothing without a hinge. A
   * later update with a hinge turns it true. False below iOS 27.1, or when the
   * app is built with an older SDK.
   *
   * On Android, true when the device has a hinge angle sensor, or once the
   * observer has seen a fold in its window.
   */
  hasHinge: boolean;
  /**
   * iOS: the view's `safeAreaInsets`. Android: the window's system bars and
   * display cutout, where they overlap the view.
   */
  safeArea: Readonly<{
    top: number;
    right: number;
    bottom: number;
    left: number;
  }>;
  /** Folds that run through the view, in every posture. Empty without a fold, or while closed. */
  folds: readonly Fold[];
  /**
   * The parts of the view something physical covers, under the same rule as
   * a fold. iOS 27.1 and later: active occlusion regions, such as the iPhone
   * Duo's sensor housing. Android: the display cutout.
   */
  occlusions: readonly Rect[];
  /** iOS: the view's horizontal size class. Android: `null`. */
  horizontalSizeClass: 'compact' | 'regular' | null;
  /**
   * iOS 27.1 and later: the edge where the system places its vertical bar,
   * whether or not one shows. `null` where it never places one, and on
   * Android.
   */
  verticalBarEdge: HorizontalEdge | null;
  /**
   * iOS 27.1 and later: for each edge in the observer's `barExtents`, how far
   * from that edge UIKit floats a bar of that extent. Other edges are absent,
   * and on Android every edge is.
   */
  barInsets: Readonly<Partial<Record<BarEdge, number>>>;
}>;
export type SystemLayoutHandler = (layout: SystemLayout) => void;
export interface SystemLayoutObserverProps {
  /** Children read the layout with `useSystemLayout`. */
  children?: ReactNode;
  /**
   * Called with each new layout, starting from the first. For the component
   * that renders the observer, which can't read `useSystemLayout`.
   */
  onSystemLayoutChange?: SystemLayoutHandler;
  /** iOS 27.1 and later. The bars to report `barInsets` for, as an extent in points per edge. */
  barExtents?: Readonly<Partial<Record<BarEdge, number>>>;
}
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
