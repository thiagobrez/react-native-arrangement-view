# ArrangementView

`ArrangementView` delegates layout to Apple's SwiftUI `ArrangementView`: two React panes can split horizontally or vertically, overlap, or become hidden as the available space and device posture change. React owns the content and its state.

```tsx
import { ArrangementView } from 'react-native-arrangement-view';

export function PlayerScreen() {
  return (
    <ArrangementView style={{ flex: 1 }} arrangement="split" axes="both">
      <ArrangementView.Primary>
        <Player />
      </ArrangementView.Primary>
      <ArrangementView.Secondary>
        <Transcript />
      </ArrangementView.Secondary>
    </ArrangementView>
  );
}
```

## Props

| Prop           | Default   | Meaning                                                                                                                           |
| -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| children       | required  | One `ArrangementView.Primary` and one `ArrangementView.Secondary`; see [below](#arrangementviewprimary--arrangementviewsecondary) |
| `arrangement`  | `"split"` | `"split"` or `"overlay"`                                                                                                          |
| `axes`         | `"both"`  | `"both"`, `"horizontal"`, or `"vertical"`; applies to either arrangement                                                          |
| `observeHinge` | `true`    | Enables observation for hooks inside this arrangement; disabling it does not disable adaptive layout                              |
| View props     | —         | Standard React Native `ViewProps`, including `style`, `testID`, and `onLayout`                                                    |

Give the arrangement a bounded size, usually `flex: 1`. SwiftUI determines whether a split is appropriate; an axis restriction does not force two panes to stay visible.

The component adds no safe-area padding. Place it within the safe area supplied by your screen/navigation container, or handle insets in your content. Do not apply the same inset in both places. SwiftUI owns the pane geometry, and native Fabric state updates the corresponding Yoga dimensions so descendants and `onLayout` receive the assigned size. There is no JavaScript resize-event round trip.

## ArrangementView.Primary / ArrangementView.Secondary

`ArrangementView.Primary` and `ArrangementView.Secondary` are slot markers: they render no view of their own and do not affect layout. Put your own pane component inside each one. Both must be direct children of `ArrangementView`, in either order. Any other direct child is ignored, and a missing, duplicated, or unrecognized child logs a warning in development builds.

Give each pane's root `flex: 1` to fill its assigned space.

In overlay mode the **primary is in front of the secondary**. Use a transparent primary background and `pointerEvents="box-none"` on its full-size React wrapper for floating controls; its visible controls can still receive touches. Hiding a pane does not unmount its React tree. Changing React keys or conditionally replacing pane components still follows React's normal remount rules.
