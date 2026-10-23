---
description: useHingeChange is a React Native hook that returns a foldable's hinge angle, and whether the device is closed, partially open or fully open.
---

# useHingeChange

A hook to consume the hinge state changes. Call the hook inside a [`HingeObserver`](./hinge-observer) or an [`ArrangementView`](./arrangement-view). It observes whichever of the two is nearer.

The hook returns the current [`HingeState`](./use-hinge-change#hingestate), and subscribes the component to updates. It invokes the callback with the initial unavailable state and then changed values.

The component renders again at every angle the hinge reports. For more granular updates and better performance, use [`useHingeSelector`](./use-hinge-selector).

```tsx
import { Text } from 'react-native';
import { useHingeChange } from 'react-native-arrangement-view';

function Player() {
  const hinge = useHingeChange();

  return (
    <Text>{hinge.angle === null ? 'No hinge' : `${hinge.angle} rad`}</Text>
  );
}
```

## HingeState

```ts
type HingeState = {
  available: boolean;
  angle: number | null; // radians
  status: 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
  fold: Fold | null;
};
```

Before the first native update, or without hardware, the state is
`{ available: false, angle: null, status: 'unknown', fold: null }`.

### fold

`fold` is where the fold divides the window, in the coordinates `measureInWindow` and
`getBoundingClientRect()` use. It is `null` unless the system divides the window there: while
a folding screen is half-open, or whenever the window spans a hinge between two screens.

```ts
type Fold = {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'vertical' | 'horizontal';
};
```

- `orientation` is `"vertical"` when the fold runs from top to bottom, as in book posture.
- The rectangle is the area the system reserves for the fold. On Android, a folding screen's
  fold is a line, `0` wide (or tall). On iOS it includes the 20 pt Apple keeps clear on each
  side for touch. A hinge between two screens is the band it hides.
- Every `HingeObserver` and `ArrangementView` in a window reports the same fold: it belongs to
  the window, not to the observer.

| Situation                             | iOS    | Android                                    |
| ------------------------------------- | ------ | ------------------------------------------ |
| Half-open, the window across the fold | Fold   | Fold                                       |
| Flat                                  | `null` | `null`, except a hinge between two screens |
| Closed                                | `null` | `null`                                     |
| The window on one side of the fold    | `null` | `null`                                     |

Overlays drawn over the whole window, and rows that span it, can use `fold` as it is. To
place something relative to a view that doesn't start at the window's corner, subtract the
view's `measureInWindow` position.
