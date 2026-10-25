---
'react-native-arrangement-view': patch
---

Android's native view code is reorganized. `HingeTracker` now owns the window layout listener that `ArrangementView` and `HingeObserver` each set up before, and `ArrangementView` measures from one content box. Pane layout and hinge events are unchanged.
