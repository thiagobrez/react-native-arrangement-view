# react-native-arrangement-view

## 0.2.0

### Minor Changes

- [#2](https://github.com/thiagobrez/react-native-arrangement-view/pull/2) [`f32dc73`](https://github.com/thiagobrez/react-native-arrangement-view/commit/f32dc73cc2edae6cb290dd1bb3e8dc4332f61566) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add Android support. `ArrangementView` arranges its panes by Material's adaptive layout rules, using the window size and the fold reported by Jetpack WindowManager, and `useHingeChange` reports the hinge angle and posture. Add the Android-only `hingePolicy` and `hingeGap` props, and export the `HingePolicy` type.

### Patch Changes

- [#1](https://github.com/thiagobrez/react-native-arrangement-view/pull/1) [`dd19d27`](https://github.com/thiagobrez/react-native-arrangement-view/commit/dd19d2794966d7977afc9a63271986d2863ef8ac) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Fix pane measurements and Pressable hit testing to account for the arrangement's window position, padding, and borders. Preserve correct pane coordinates in RTL layouts and when content insets change without resizing the panes.
