---
'react-native-arrangement-view': patch
---

Fix pane measurements and Pressable hit testing to account for the arrangement's window position, padding, and borders. Preserve correct pane coordinates in RTL layouts and when content insets change without resizing the panes.
