---
description: useHingeSelector follows one value derived from a foldable's hinge, such as half-open, and renders again only when that value changes.
---

# useHingeSelector

A hook that observes one value derived from the hinge. The component renders again only when that value changes:

```tsx
import { useHingeSelector } from 'react-native-arrangement-view';

function Screen() {
  const halfOpen = useHingeSelector(
    (hinge) => hinge.status === 'partiallyOpen'
  );

  return halfOpen ? <Tabletop /> : <FullScreen />;
}
```

[`useHingeChange`](./use-hinge-change) returns the whole [`HingeState`](./use-hinge-change#hingestate), so its component renders at every angle the hinge passes through while the device folds.

`useHingeSelector` observes only one value derived from the hinge, so its component renders only when that value changes. It is more efficient for components that don't need to know the hinge's angle. A component whose style follows the angle doesn't need to render at all: use [`useAnimatedHinge`](./use-animated-hinge).

Like [`useHingeChange`](./use-hinge-change), call it inside a [`HingeObserver`](./hinge-observer) or a pane of an [`ArrangementView`](./arrangement-view).

The selector returns a string, a number, a boolean, `null` or `undefined`. Do not return an object, as it would never compare equal to the last one, breaking the optimization.

```tsx
const available = useHingeSelector((hinge) => hinge.available);
const status = useHingeSelector((hinge) => hinge.status);
```
