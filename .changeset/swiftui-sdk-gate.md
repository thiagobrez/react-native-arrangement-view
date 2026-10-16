---
'react-native-arrangement-view': patch
---

Check for the iOS 27.1 SDK when compiling instead of during `pod install`, so switching Xcode after installing pods no longer builds the wrong arrangement.
