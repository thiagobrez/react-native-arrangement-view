---
'react-native-arrangement-view': minor
---

On Android, `ArrangementView` now places its panes in React Native's native shadow tree instead of in JavaScript. Folding, unfolding, resizing or moving the arrangement no longer renders it, and the panes move without waiting for the JavaScript thread.
