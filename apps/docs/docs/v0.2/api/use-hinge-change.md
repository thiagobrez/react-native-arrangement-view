# useHingeChange

Call the hook **inside a component rendered in either pane**. It observes the nearest [`ArrangementView`](./arrangement-view), keeping events associated with that view's scene. It is not a process-wide sensor subscription.

```tsx
import { Text } from 'react-native';
import { useHingeChange } from 'react-native-arrangement-view';

function Player() {
  const hinge = useHingeChange((next) => {
    // Use angle/status for effects or interactions.
    // Let ArrangementView handle adaptive layout.
    console.log(next.angle, next.status);
  });

  return (
    <Text>{hinge.angle === null ? 'No hinge' : `${hinge.angle} rad`}</Text>
  );
}
```

The callback is optional; the hook also returns the current `HingeState` and subscribes the component to updates. It invokes the callback with the initial unavailable state and then changed values.

## HingeState

```ts
type HingeState = {
  available: boolean;
  angle: number | null; // radians
  status: 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
};
```

Before the first native update, without hardware, or when observation is disabled, the state is `{ available: false, angle: null, status: 'unknown' }`.

On Android, `angle` comes from the hinge angle sensor (Android 11+) and is `null` on a foldable without one.

## Example: tent posture

iOS has no tent state. On iPhone Duo, standing the phone as a tent with the inner screens inside keeps the app on the outer screen in landscape and reports the hinge as `closed`, but with the angle it is open at, around 81°. A phone that is really closed reports an angle near 0. Compare the two to show a different view in a tent, such as a bedside clock:

```tsx
import { useHingeChange } from 'react-native-arrangement-view';

function Primary() {
  const hinge = useHingeChange();
  const tent = hinge.status === 'closed' && (hinge.angle ?? 0) > 0.5; // radians, about 30°

  return tent ? <BedsideClock /> : <NormalPrimary />;
}
```

The 0.5 rad threshold is a heuristic. Apple does not guarantee the precision or update rate of `angle`, so check the behavior on hardware.
