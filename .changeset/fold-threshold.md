---
'react-native-arrangement-view': minor
---

Adds `foldThreshold` to `SystemLayoutObserver`, Android only. With a threshold, a fold's `state` follows the hinge angle instead of WindowManager's posture. It turns `halfOpen` at or below `halfOpenAtDegrees`, and `flat` again at or above `flatAtDegrees`. Every observer in a window with the same threshold reports the same state. The hinge angle never reaches JavaScript, and the library listens to the sensor only while an observer has a threshold and the window has a fold. The `FoldThreshold` type is exported.
