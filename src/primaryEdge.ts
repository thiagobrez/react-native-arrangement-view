import type { HorizontalEdge, PrimaryEdge, VerticalEdge } from './types';

export interface PrimaryEdges {
  /** The side when the panes are side by side. */
  horizontal?: HorizontalEdge;
  /** The side when an overlay's panes are stacked. */
  vertical?: VerticalEdge;
  /** Human-readable problems with the value, for dev warnings. */
  problems: string[];
}

const isHorizontal = (edge: unknown): edge is HorizontalEdge =>
  edge === 'leading' || edge === 'trailing';
const isVertical = (edge: unknown): edge is VerticalEdge =>
  edge === 'top' || edge === 'bottom';

/**
 * Splits `primaryEdge` into a side for each axis. A pair must be horizontal,
 * then vertical; any other array is ignored and reported, for callers
 * without type checking.
 */
export function resolvePrimaryEdge(
  value: PrimaryEdge | readonly [HorizontalEdge, VerticalEdge] | undefined
): PrimaryEdges {
  if (value === undefined) return { problems: [] };
  if (typeof value === 'string') {
    if (isHorizontal(value)) return { horizontal: value, problems: [] };
    if (isVertical(value)) return { vertical: value, problems: [] };
    return { problems: [] };
  }
  const [horizontal, vertical] = value;
  if (value.length === 2 && isHorizontal(horizontal) && isVertical(vertical)) {
    return { horizontal, vertical, problems: [] };
  }
  return {
    problems: [
      `ArrangementView expects primaryEdge as one side or a horizontal and a vertical side in that order, such as ["leading", "top"], and ignored ${JSON.stringify(value)}.`,
    ],
  };
}
