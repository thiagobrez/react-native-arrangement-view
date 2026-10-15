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
};
```

Before the first native update, without hardware, or when observation is disabled, the state is `{ available: false, angle: null, status: 'unknown' }`.
