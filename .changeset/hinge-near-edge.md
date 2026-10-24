---
'react-native-arrangement-view': patch
---

On Android, a hinge closer to the arrangement's edge than half of `hingeGap` is ignored, as iOS ignores one less than 20 pt inside. Before, the pane on that side was squeezed to 0 dp, hiding the primary pane, or with `axes: 'vertical'` the whole arrangement.
