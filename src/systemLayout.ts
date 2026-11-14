import { createContext, useContext, useSyncExternalStore } from 'react';
import type { SystemLayoutEvent } from './SystemLayoutObserverNativeComponent';
import type {
  Fold,
  FoldState,
  FoldThreshold,
  HorizontalEdge,
  Rect,
  SystemLayout,
} from './types';

type Span = { start: number; length: number };

const FLOAT_ERROR = 0.001;

function coversAPixel(distance: number, pixel: number): boolean {
  return distance > 0 && distance > pixel - FLOAT_ERROR;
}

function bandInside(
  start: number,
  length: number,
  size: number,
  pixel: number
): Span | null {
  const from = Math.max(start, 0);
  const to = Math.min(start + length, size);
  return coversAPixel(to - from, pixel)
    ? { start: from, length: to - from }
    : null;
}

function lineInside(at: number, size: number, pixel: number): Span | null {
  return coversAPixel(at, pixel) && coversAPixel(size - at, pixel)
    ? { start: at, length: 0 }
    : null;
}

function insideSpan(
  start: number,
  length: number,
  size: number,
  foldsAreLines: boolean,
  pixel: number
): Span | null {
  if (length > 0) return bandInside(start, length, size, pixel);
  return foldsAreLines ? lineInside(start, size, pixel) : null;
}

function insideView(rect: Rect, event: SystemLayoutEvent): Rect | null {
  const pixel = event.scale > 0 ? 1 / event.scale : 0;
  const x = insideSpan(
    rect.x,
    rect.width,
    event.width,
    event.foldsAreLines,
    pixel
  );
  const y = insideSpan(
    rect.y,
    rect.height,
    event.height,
    event.foldsAreLines,
    pixel
  );
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

function shareUnchanged<T>(previous: T | null | undefined, next: T): T {
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
    shared[key] = shareUnchanged(before[key], after[key]);
    if (shared[key] !== before[key]) unchanged = false;
  }
  return unchanged ? previous : (shared as T);
}

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
  return shareUnchanged(previous, {
    width: event.width,
    height: event.height,
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
    barInsets:
      event.barInsets.bottom >= 0 ? { bottom: event.barInsets.bottom } : {},
  });
}

export function parseFoldThreshold(threshold: FoldThreshold | undefined): {
  halfOpenAtDegrees: number;
  flatAtDegrees: number;
} {
  if (!threshold) return { halfOpenAtDegrees: -1, flatAtDegrees: -1 };
  const { halfOpenAtDegrees, flatAtDegrees } = threshold;
  if (!(
    halfOpenAtDegrees > 0 &&
    halfOpenAtDegrees < flatAtDegrees &&
    flatAtDegrees <= 180
  ))
    throw new RangeError(
      `foldThreshold needs 0 < halfOpenAtDegrees < flatAtDegrees <= 180, and got ${halfOpenAtDegrees} and ${flatAtDegrees}.`
    );
  return { halfOpenAtDegrees, flatAtDegrees };
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
 */
export function useSystemLayout(): SystemLayout | null {
  const store = useContext(SystemLayoutContext);
  const read = () => store?.getSnapshot() ?? null;
  return useSyncExternalStore(
    store?.subscribe ?? subscribeToNothing,
    read,
    read
  );
}
