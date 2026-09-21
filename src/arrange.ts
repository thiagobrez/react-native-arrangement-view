import type { Arrangement, ArrangementAxes } from './types';

/** The arrangement's size and, when one crosses it, the separating fold within it. */
export interface Geometry {
  width: number;
  height: number;
  fold?: Readonly<{ x: number; y: number; width: number; height: number }>;
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

/**
 * Android's layout policy; iOS delegates the same decisions to SwiftUI.
 *
 * A separating fold (a half-opened or dual-screen device) splits either
 * arrangement around itself. Otherwise `split` halves the longer side and
 * `overlay` stacks both panes at full size. A split along an axis that `axes`
 * excludes never happens: `split` then shows only the primary pane.
 */
export function arrange(
  { width, height, fold }: Geometry,
  arrangement: Arrangement,
  axes: ArrangementAxes,
  rtl = false
): PaneFrames {
  const allows = (axis: Axis) => axes === 'both' || axes === axis;
  const full = { left: 0, top: 0, width, height };

  // Panes before and after the span [start, end] along the axis.
  const split = (axis: Axis, start: number, end: number): PaneFrames => {
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
    return rtl && axis === 'horizontal'
      ? { primary: after, secondary: before }
      : { primary: before, secondary: after };
  };

  if (fold) {
    // A vertical fold, taller than wide, puts the panes side by side.
    const axis: Axis = fold.height >= fold.width ? 'horizontal' : 'vertical';
    const [start, end, extent] =
      axis === 'horizontal'
        ? [fold.x, fold.x + fold.width, width]
        : [fold.y, fold.y + fold.height, height];
    // A fold outside the arrangement, or along its edge, separates nothing.
    if (allows(axis) && start > 0 && end < extent)
      return split(axis, start, end);
  }

  if (arrangement === 'overlay') return { primary: full, secondary: full };

  const axis: Axis = width >= height ? 'horizontal' : 'vertical';
  if (!allows(axis)) return { primary: full, secondary: null };
  const middle = (axis === 'horizontal' ? width : height) / 2;
  return split(axis, middle, middle);
}
