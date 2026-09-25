import type { Arrangement, ArrangementAxes, HingePolicy } from './types';

/** A fold within the arrangement, as Jetpack WindowManager reports it. */
export interface Fold {
  x: number;
  y: number;
  width: number;
  height: number;
  /** A vertical fold runs top to bottom, as in book posture. */
  orientation: 'vertical' | 'horizontal';
  /** Half-open, or a hinge that hides content. */
  separating: boolean;
  halfOpened: boolean;
}

/**
 * The arrangement's size, the size of the window it is in, and the fold, if
 * any. All in dp; the fold is relative to the arrangement.
 */
export interface Geometry {
  width: number;
  height: number;
  window: Readonly<{ width: number; height: number }>;
  fold?: Readonly<Fold>;
}

export interface ArrangeOptions {
  arrangement: Arrangement;
  axes: ArrangementAxes;
  hingePolicy?: HingePolicy;
  hingeGap?: number;
  rtl?: boolean;
}

export interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PaneFrames {
  primary: Frame;
  /** Null when only the primary pane is shown. */
  secondary: Frame | null;
}

type Axis = 'horizontal' | 'vertical';

// Material's window size class breakpoints.
const COMPACT_HEIGHT = 480;
const EXPANDED_WIDTH = 840;
const EXPANDED_HEIGHT = 900;

/**
 * Android's layout policy; iOS delegates the same decisions to SwiftUI.
 *
 * It follows Material's pane scaffold (calculatePaneScaffoldDirective). The
 * window, not the arrangement, decides how many panes fit: two side by side
 * from an expanded width, and two stacked in tabletop or in a single-column
 * window with expanded height. A compact-height window, such as a phone in
 * landscape, gets no columns: Android's window size class guidance calls two
 * panes impractical there, though Material's scaffold checks only the width.
 *
 * A hinge the policy avoids decides the axis and separates the panes by
 * `hingeGap` around it. A separating hinge always splits, whatever the window
 * size, as it does on iOS. A split that doesn't fit, or that `axes` excludes,
 * shows only the primary pane.
 */
export function arrange(
  { width, height, window, fold }: Geometry,
  {
    arrangement,
    axes,
    hingePolicy = 'avoidSeparating',
    hingeGap = 24,
    rtl = false,
  }: ArrangeOptions
): PaneFrames {
  const full = { left: 0, top: 0, width, height };
  const tabletop =
    fold?.halfOpened === true && fold.orientation === 'horizontal';
  const twoColumns =
    window.height >= COMPACT_HEIGHT && window.width >= EXPANDED_WIDTH;
  const twoRows = tabletop || (!twoColumns && window.height >= EXPANDED_HEIGHT);
  const allows = (axis: Axis) => axes === 'both' || axes === axis;
  const fits = (axis: Axis) =>
    allows(axis) && (axis === 'horizontal' ? twoColumns : twoRows);

  // Panes before and after the span [start, end] along the axis. The primary
  // pane goes first, on the leading side, unless `primaryAfter`.
  const split = (
    axis: Axis,
    start: number,
    end: number,
    primaryAfter = false
  ): PaneFrames => {
    const [before, after] =
      axis === 'horizontal'
        ? [
            { ...full, width: start },
            { ...full, left: end, width: width - end },
          ]
        : [
            { ...full, height: start },
            { ...full, top: end, height: height - end },
          ];
    const leadingIsAfter = rtl && axis === 'horizontal';
    return leadingIsAfter !== primaryAfter
      ? { primary: after, secondary: before }
      : { primary: before, secondary: after };
  };

  const avoided =
    hingePolicy === 'alwaysAvoid' ||
    (hingePolicy === 'avoidSeparating' && fold?.separating);
  if (fold && avoided) {
    // A vertical fold, running top to bottom, puts the panes side by side.
    const axis: Axis =
      fold.orientation === 'vertical' ? 'horizontal' : 'vertical';
    const [start, end, extent] =
      axis === 'horizontal'
        ? [fold.x, fold.x + fold.width, width]
        : [fold.y, fold.y + fold.height, height];
    // A fold outside the arrangement, or along its edge, separates nothing.
    if (start > 0 && end < extent) {
      const middle = (start + end) / 2;
      const half = Math.max(end - start, hingeGap) / 2;
      const before = Math.max(0, middle - half);
      const after = Math.min(extent, middle + half);
      // Overlay's primary pane goes after the hinge, as SwiftUI puts it.
      // A separating hinge already divides the window, so it splits whatever
      // the window size. A flat one only splits where two panes fit anyway.
      if (fold.separating ? allows(axis) : fits(axis))
        return split(axis, before, after, arrangement === 'overlay');
      if (arrangement === 'overlay') return { primary: full, secondary: full };
      // A single pane stays clear of the hinge, on its leading side.
      return { primary: split(axis, before, after).primary, secondary: null };
    }
  }

  if (arrangement === 'overlay') return { primary: full, secondary: full };
  const axis = fits('horizontal')
    ? 'horizontal'
    : fits('vertical')
      ? 'vertical'
      : null;
  if (!axis) return { primary: full, secondary: null };
  const middle = (axis === 'horizontal' ? width : height) / 2;
  return split(axis, middle, middle);
}
