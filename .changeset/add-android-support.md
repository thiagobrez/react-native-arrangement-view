---
'react-native-arrangement-view': minor
---

Add Android support. `ArrangementView` arranges its panes by Material's adaptive layout rules, using the window size and the fold reported by Jetpack WindowManager, and `useHingeChange` reports the hinge angle and posture. Add the Android-only `hingePolicy` and `hingeGap` props, and export the `HingePolicy` type.
