---
'react-native-arrangement-view': patch
---

On iOS, `HingeObserver` no longer holds a hinge that arrives before React Native gives the view its event handler. It drops that hinge, as `ArrangementView` already does. React Native gives the view its handler before the view joins a window, and iOS reports the hinge only to a view in a window, so apps see the same hinges as before.
