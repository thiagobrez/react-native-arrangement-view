# useHingeSelector

Observes one value derived from the hinge. The component renders again only when that value changes, however often the angle does:

```tsx
import { useHingeSelector } from 'react-native-arrangement-view';

function Screen() {
  const halfOpen = useHingeSelector(
    (hinge) => hinge.status === 'partiallyOpen'
  );

  return halfOpen ? <Tabletop /> : <FullScreen />;
}
```

[`useHingeChange`](./use-hinge-change) returns the whole [`HingeState`](./use-hinge-change#hingestate), so its component renders at every angle the hinge passes through while the device folds. Use the selector when a decision depends on the hinge, and `useHingeChange` when the angle itself is on screen.

Like `useHingeChange`, call it inside a [`HingeObserver`](./hinge-observer) or a pane of an [`ArrangementView`](./arrangement-view); it observes whichever is nearer.

The selector returns a string, a number, a boolean, `null` or `undefined`. An object built on each call would never compare equal to the last one. Select each value with its own call instead:

```tsx
const available = useHingeSelector((hinge) => hinge.available);
const status = useHingeSelector((hinge) => hinge.status);
```
