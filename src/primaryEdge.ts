import type { HorizontalEdge, PrimaryEdge, VerticalEdge } from './types';

export interface PrimaryEdges {
  horizontal?: HorizontalEdge;
  vertical?: VerticalEdge;
  problems: string[];
}

const isHorizontal = (edge: unknown): edge is HorizontalEdge =>
  edge === 'leading' || edge === 'trailing';
const isVertical = (edge: unknown): edge is VerticalEdge =>
  edge === 'top' || edge === 'bottom';

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
