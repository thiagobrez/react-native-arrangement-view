---
'react-native-arrangement-view': minor
---

On Android, `ArrangementView` now places its panes in React Native's native shadow tree instead of in JavaScript. Folding, unfolding, resizing or moving the arrangement no longer renders it, and the panes move without waiting for the JavaScript thread. The layouts, props and hooks are unchanged; as on iOS, `onArrangementLayoutChange` and `useArrangementLayout` hear about a new layout just after the panes move. The library now ships C++ that builds with your app's Android project, and a `react-native.config.js` that registers it.
