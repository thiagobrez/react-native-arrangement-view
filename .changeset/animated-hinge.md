---
'react-native-arrangement-view': minor
---

Add `useAnimatedHinge`, from `react-native-arrangement-view/reanimated`, which returns the hinge as Reanimated shared values, so an animation follows the hinge on the UI thread without rendering. Reanimated is an optional peer dependency: apps that don't import the entry point don't need it.
