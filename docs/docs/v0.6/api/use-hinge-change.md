---
description: useHingeChange is a React Native hook that returns a foldable's hinge angle, and whether the device is closed, partially open or fully open.
---

# useHingeChange

A hook to consume the hinge state changes. Call the hook inside a [`HingeObserver`](./hinge-observer) or an [`ArrangementView`](./arrangement-view). It observes whichever of the two is nearer.

The hook returns the current [`HingeState`](./use-hinge-change#hingestate), or `null` until the platform first reports the hinge, and subscribes the component to updates. It invokes the callback with each report that changes the state, starting from the first, and never with `null`.

The component renders again at every angle the hinge reports. For more granular updates and better performance, use [`useHingeSelector`](./use-hinge-selector).

```tsx
import { Text } from 'react-native';
import { useHingeChange } from 'react-native-arrangement-view';

function Player() {
  const hinge = useHingeChange();

  if (hinge === null) return null;
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

Without a hinge, the state is `{ available: false, angle: null, status: 'unknown' }`.

## When the first report comes

Until the first report, the hook returns `null`. When the report comes depends on the platform:

- On iOS 27.1 with a hinge, such as iPhone Duo, iOS reports the hinge once the view is in a window.
- On iOS 27.1 without a hinge, iOS reports nothing, so the view reports that there is no hinge 250 ms after it joins a window.
- Below iOS 27.1, or when the app is built with an older SDK, the view reports that there is no hinge as soon as it joins a window.
- On Android, the view reports once WindowManager first reports the window's layout.
- On other platforms, such as web, there is no hinge from the start, so the hook never returns `null`.

## Migrate from 0.5

In 0.5, the hook returned the unavailable state until the first report, the same state as a device without a hinge. It now returns `null`, so read the fields with optional chaining:

```diff
- const halfOpen = hinge.status === 'partiallyOpen';
+ const halfOpen = hinge?.status === 'partiallyOpen';
```

The callback no longer runs for the state before the first report.
