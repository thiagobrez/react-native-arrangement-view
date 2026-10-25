---
'react-native-arrangement-view': minor
---

Adds `SystemLayoutObserver` and `useSystemLayout`. The observer reports what the system reserves in the view that contains it, in that view's coordinates: the folds that run through it in every posture, the parts a camera or a sensor housing covers, and the safe area. On iOS it also reports the horizontal size class, the edge of the system's vertical bar, and where UIKit floats a bar of an extent you pass in `barExtents`. A report goes out only when a value changes, never for the hinge angle alone, and the first one waits until the observer knows whether the window has a hinge. The `SystemLayout`, `Fold`, `FoldState` and `BarEdge` types are exported.

On iOS, the pod's `HingeWindows` class tells an app delegate which windows an observer has found a hinge in, so it can let only those windows rotate.
