import { createContext, useContext, useRef, useSyncExternalStore } from 'react';
import type { SystemLayoutEvent } from './SystemLayoutObserverNativeComponent';
import type {
  BarEdge,
  Fold,
  FoldState,
  HorizontalEdge,
  Rect,
  SystemLayout,
} from './types';

type Span = { start: number; length: number };

/**
 * The part of a span inside `[0, size]`, or null when it doesn't run through
 * the interior. With a length, it must overlap the interior, so a band that
 * only touches an edge is dropped. It clips with min and max only, so the
 * result has the bits `CGRect.intersection` gives. A line, 0 long, is kept
 * only where the platform reports folds as lines, and only strictly inside.
 * iOS drops it as an empty rect.
 */
function insideSpan(
  start: number,
  length: number,
  size: number,
  keepsLines: boolean
): Span | null {
  if (length === 0)
    return keepsLines && start > 0 && start < size ? { start, length } : null;
  const from = Math.max(start, 0);
  const to = Math.min(start + length, size);
  return to > from ? { start: from, length: to - from } : null;
}

function insideView(rect: Rect, event: SystemLayoutEvent): Rect | null {
  const x = insideSpan(rect.x, rect.width, event.width, event.keepsLines);
  const y = insideSpan(rect.y, rect.height, event.height, event.keepsLines);
  if (!x || !y) return null;
  return { x: x.start, y: y.start, width: x.length, height: y.length };
}

function oneOf<T extends string>(
  values: readonly T[],
  value: string
): T | null {
  return values.find((candidate) => candidate === value) ?? null;
}

const foldStates: readonly FoldState[] = ['flat', 'halfOpen'];
const sizeClasses = ['compact', 'regular'] as const;
const barEdges: readonly HorizontalEdge[] = ['leading', 'trailing'];
const insetEdges: readonly BarEdge[] = ['top', 'bottom', 'leading', 'trailing'];

/**
 * Returns `previous` where `next` has the same values, so every unchanged
 * part of a layout keeps its identity.
 */
function reuse<T>(previous: T | null | undefined, next: T): T {
  if (
    typeof next !== 'object' ||
    next === null ||
    typeof previous !== 'object' ||
    previous === null ||
    Array.isArray(next) !== Array.isArray(previous)
  )
    return next;
  const before = previous as Record<string, unknown>;
  const after = next as Record<string, unknown>;
  const keys = Object.keys(after);
  if (keys.length !== Object.keys(before).length) return next;
  let unchanged = true;
  const shared = (Array.isArray(next) ? [] : {}) as Record<string, unknown>;
  for (const key of keys) {
    shared[key] = reuse(before[key], after[key]);
    if (shared[key] !== before[key]) unchanged = false;
  }
  return unchanged ? previous : (shared as T);
}

/**
 * Turns one native report into the layout the view sees, and reuses every
 * part of `previous` that is unchanged. Returns `previous` itself when nothing
 * changed.
 */
export function parseSystemLayout(
  event: SystemLayoutEvent,
  previous: SystemLayout | null
): SystemLayout {
  const folds = event.folds.flatMap((fold): Fold[] => {
    const part = insideView(fold, event);
    if (!part) return [];
    return [
      {
        ...part,
        window: {
          x: fold.window.x,
          y: fold.window.y,
          width: fold.window.width,
          height: fold.window.height,
        },
        orientation: fold.height >= fold.width ? 'vertical' : 'horizontal',
        separating: fold.separating,
        state: oneOf(foldStates, fold.state),
      },
    ];
  });
  const barInsets: Partial<Record<BarEdge, number>> = {};
  for (const edge of insetEdges)
    if (event.barInsets[edge] >= 0) barInsets[edge] = event.barInsets[edge];
  return reuse(previous, {
    width: event.width,
    height: event.height,
    hasHinge: event.hasHinge,
    safeArea: {
      top: event.safeArea.top,
      right: event.safeArea.right,
      bottom: event.safeArea.bottom,
      left: event.safeArea.left,
    },
    folds,
    occlusions: event.occlusions.flatMap(
      (occlusion) => insideView(occlusion, event) ?? []
    ),
    horizontalSizeClass: oneOf(sizeClasses, event.horizontalSizeClass),
    verticalBarEdge: oneOf(barEdges, event.verticalBarEdge),
    barInsets,
  });
}

export function createSystemLayoutStore() {
  let current: SystemLayout | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Returns the new layout, or null when the report changed nothing. */
    update(event: SystemLayoutEvent): SystemLayout | null {
      const next = parseSystemLayout(event, current);
      if (next === current) return null;
      current = next;
      listeners.forEach((listener) => listener());
      return next;
    },
  };
}

export const SystemLayoutContext = createContext<ReturnType<
  typeof createSystemLayoutStore
> | null>(null);

const subscribeToNothing = () => () => {};

/**
 * The nearest `SystemLayoutObserver`'s layout, in its view's coordinates.
 * Null before the observer's first report, or outside any observer.
 *
 * With a selector, the component renders again only when the selected value
 * changes (`Object.is`). Return a primitive, or a part of the layout as it is,
 * such as a `Fold` or `layout.safeArea`. An object built in the selector is
 * new for every new layout, so the component renders for each one.
 */
export function useSystemLayout(): SystemLayout | null;
export function useSystemLayout<T>(
  select: (layout: SystemLayout) => T
): T | null;
export function useSystemLayout<T>(select?: (layout: SystemLayout) => T) {
  const store = useContext(SystemLayoutContext);
  const selected = useRef<{ layout: SystemLayout; select: unknown; value: T }>(
    null
  );
  // React reads the snapshot more than once per layout, and a value built anew on each read never
  // settles.
  const read = () => {
    const layout = store?.getSnapshot() ?? null;
    if (!layout || !select) return layout;
    const last = selected.current;
    if (last?.layout === layout && last.select === select) return last.value;
    const value = select(layout);
    selected.current = { layout, select, value };
    return value;
  };
  return useSyncExternalStore(
    store?.subscribe ?? subscribeToNothing,
    read,
    read
  );
}
