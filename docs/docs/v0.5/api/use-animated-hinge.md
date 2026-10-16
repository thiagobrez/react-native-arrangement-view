---
description: useAnimatedHinge gives a foldable's hinge angle and status as Reanimated shared values, so animations follow the hinge on the UI thread without rendering.
---

# useAnimatedHinge

A hook that returns the hinge as [Reanimated](https://docs.swmansion.com/react-native-reanimated/) shared values. Worklets, such as the one in `useAnimatedStyle`, read them on the UI thread. An animation then follows the hinge without rendering its component, and keeps following it while the JavaScript thread is busy.

```tsx
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useAnimatedHinge } from 'react-native-arrangement-view/reanimated';

function Lid() {
  const hinge = useAnimatedHinge();
  const style = useAnimatedStyle(() => ({
    // Closed, the lid lies flat. It turns up as the device opens.
    transform: [{ rotate: `${-(hinge.angle.get() ?? 0)}rad` }],
  }));

  return <Animated.View style={[styles.lid, style]} />;
}
```

Like [`useHingeChange`](./use-hinge-change), call it inside a [`HingeObserver`](./hinge-observer) or a pane of an [`ArrangementView`](./arrangement-view). It observes whichever of the two is nearer, and keeps the last state while its view is out of the window, as under a pushed screen.

Use it for effects that follow the angle: tilting a card, fading controls in as the device opens. For a decision derived from the hinge, such as which view to show when half-open, use [`useHingeSelector`](./use-hinge-selector), which renders only when that decision changes.

## Installation

The hook needs [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started) 4 or later, which is an optional peer dependency. It is in its own entry point, `react-native-arrangement-view/reanimated`, so an app that doesn't import it doesn't need Reanimated.

## AnimatedHinge

```ts
type AnimatedHinge = {
  available: DerivedValue<boolean>;
  angle: DerivedValue<number | null>; // radians
  status: DerivedValue<'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen'>;
};
```

The values hold the same [`HingeState`](./use-hinge-change#hingestate) that `useHingeChange` returns, starting from the observer's current state. They are read-only: read them with `.get()` or `.value`.

## Update rate

The values change as often as the platform reports the hinge, which is not necessarily every frame:

- **iOS** decides how often to report the hinge, and may change it. The iPhone Duo simulator reports about 30 angles a second while the hinge moves.
- **Android** reads the hinge angle sensor. While a `useAnimatedHinge` follows an observer, the observer asks the sensor for an angle every frame.

To smooth the steps between two reports, animate towards the angle instead of using it directly, for example with `withSpring`.
