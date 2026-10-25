---
'react-native-arrangement-view': minor
---

Adds `SystemLayoutObserver` and `useSystemLayout`. The observer reports what the system reserves in the view that contains it, in that view's coordinates: the folds that run through it in every posture, the parts a camera or a sensor housing covers, and the safe area. On iOS it also reports the horizontal size class, the edge of the system's vertical bar, and where UIKit floats a bottom bar of the extent you pass in `barExtents`. A report goes out only when a value changes, never for the hinge angle alone. The `SystemLayout`, `Fold` and `FoldState` types are exported.
