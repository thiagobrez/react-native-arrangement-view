---
'react-native-arrangement-view': minor
---

`useHingeChange` and `useHingeSelector` return `null` until the platform first reports the hinge. Before, they returned `{ available: false, angle: null, status: 'unknown' }`, the same state as a device without a hinge, so an app couldn't tell "no hinge" from "not known yet". Read the fields with optional chaining: `hinge.status` becomes `hinge?.status`. The `onChange` callback and the selector run only with a report.

Every platform now sends a first report. On iOS 27.1, a `HingeObserver` or `ArrangementView` reports that there is no hinge when the system sends no hinge within 250 ms of the view joining a window. Below iOS 27.1, or when built with an older SDK, it reports that there is no hinge when it joins a window. On Android, a `HingeObserver` with no activity and no hinge sensor reports that there is no hinge when it attaches. On web, the hooks start at the unavailable state.

On iOS, the pod's Swift class `HingeWindows` records each window where a `HingeObserver` or an `ArrangementView` finds a hinge. An app delegate can read `HingeWindows.hasHinge(_:)` and observe `HingeWindows.didFindHingeNotification` to let only those windows rotate.
