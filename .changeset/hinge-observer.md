---
'react-native-arrangement-view': minor
---

Add `HingeObserver`, so `useHingeChange` works outside an `ArrangementView`. A view that leaves the window, such as a screen under a pushed one, now keeps its last hinge state instead of reporting it unavailable.
