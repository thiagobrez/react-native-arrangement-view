# Tent posture

iOS has no tent state. On iPhone Duo, standing the phone as a tent with the inner screens inside keeps the app on the outer screen in landscape and reports the hinge as `closed` to [`useHingeChange`](../api/use-hinge-change), but with the angle it is open at, around 81°. A phone that is really closed reports an angle near 0. Compare the two to show a different view in a tent, such as a bedside clock:

```tsx
import { useHingeChange } from 'react-native-arrangement-view';

function Primary() {
  const hinge = useHingeChange();
  const tent = hinge.status === 'closed' && (hinge.angle ?? 0) > 0.5; // radians, about 30°

  return tent ? <BedsideClock /> : <NormalPrimary />;
}
```

The 0.5 rad threshold is a heuristic. Apple does not guarantee the precision or update rate of `angle`, so check the behavior on hardware.
