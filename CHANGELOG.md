# react-native-arrangement-view

## 0.4.1

### Patch Changes

- [#37](https://github.com/thiagobrez/react-native-arrangement-view/pull/37) [`12f38cd`](https://github.com/thiagobrez/react-native-arrangement-view/commit/12f38cdf45e2e1910032b58b3fe7d904d14ef67a) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Check for the iOS 27.1 SDK when compiling instead of during `pod install`, so switching Xcode after installing pods no longer builds the wrong arrangement.

## 0.4.0

### Minor Changes

- [#16](https://github.com/thiagobrez/react-native-arrangement-view/pull/16) [`8b20d02`](https://github.com/thiagobrez/react-native-arrangement-view/commit/8b20d02de7c9f264f93582a3115c4adcbcb99946) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add `isOverlapping` to `ArrangementLayout`, true while both panes are on screen with the primary in front, as in overlay when no hinge separates them.

- [#12](https://github.com/thiagobrez/react-native-arrangement-view/pull/12) [`91bdedd`](https://github.com/thiagobrez/react-native-arrangement-view/commit/91bdedd212545cd5d04da0f6f44bc315a797eb63) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add `HingeObserver`, so `useHingeChange` works outside an `ArrangementView`. A view that leaves the window, such as a screen under a pushed one, now keeps its last hinge state instead of reporting it unavailable.

- [#12](https://github.com/thiagobrez/react-native-arrangement-view/pull/12) [`f61f958`](https://github.com/thiagobrez/react-native-arrangement-view/commit/f61f958497b17b4304740db037ad97e69d4ad965) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add `useHingeSelector`, which observes one value derived from the hinge and renders again only when that value changes.

## 0.3.0

### Minor Changes

- [#10](https://github.com/thiagobrez/react-native-arrangement-view/pull/10) [`e9b6bb5`](https://github.com/thiagobrez/react-native-arrangement-view/commit/e9b6bb5dbb9c37c0a8f97a342119855330e2f3c5) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add `useArrangementLayout` and `onArrangementLayoutChange` to tell whether the secondary pane is on screen, and how the panes are placed.

- [#10](https://github.com/thiagobrez/react-native-arrangement-view/pull/10) [`53a8873`](https://github.com/thiagobrez/react-native-arrangement-view/commit/53a887311485b6e5575c0c62da3ff7ac2ba6ef81) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add `primaryEdge` to put the primary pane on the leading or trailing side when the panes are side by side.

### Patch Changes

- [#10](https://github.com/thiagobrez/react-native-arrangement-view/pull/10) [`cde6c68`](https://github.com/thiagobrez/react-native-arrangement-view/commit/cde6c680ae1a2b8aff43f3b496a2100d5962d292) Thanks [@thiagobrez](https://github.com/thiagobrez)! - On iOS, lay out a pane's content in the same pass SwiftUI resizes the pane, so unfolding no longer shows the content at its old size first.

## 0.2.0

### Minor Changes

- [#2](https://github.com/thiagobrez/react-native-arrangement-view/pull/2) [`f32dc73`](https://github.com/thiagobrez/react-native-arrangement-view/commit/f32dc73cc2edae6cb290dd1bb3e8dc4332f61566) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Add Android support. `ArrangementView` arranges its panes by Material's adaptive layout rules, using the window size and the fold reported by Jetpack WindowManager, and `useHingeChange` reports the hinge angle and posture. Add the Android-only `hingePolicy` and `hingeGap` props, and export the `HingePolicy` type.

### Patch Changes

- [#1](https://github.com/thiagobrez/react-native-arrangement-view/pull/1) [`dd19d27`](https://github.com/thiagobrez/react-native-arrangement-view/commit/dd19d2794966d7977afc9a63271986d2863ef8ac) Thanks [@thiagobrez](https://github.com/thiagobrez)! - Fix pane measurements and Pressable hit testing to account for the arrangement's window position, padding, and borders. Preserve correct pane coordinates in RTL layouts and when content insets change without resizing the panes.
