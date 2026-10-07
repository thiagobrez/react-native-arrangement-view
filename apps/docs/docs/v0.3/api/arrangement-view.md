# ArrangementView

```tsx
import { ArrangementView } from 'react-native-arrangement-view';

export function PlayerScreen() {
  return (
    <ArrangementView style={{ flex: 1 }} arrangement="split" axes="both">
      <ArrangementView.Primary>
        {/* Add your primary view here */}
      </ArrangementView.Primary>
      <ArrangementView.Secondary>
        {/* Add your secondary view here */}
      </ArrangementView.Secondary>
    </ArrangementView>
  );
}
```

## Props

| Prop                        | Default             | Meaning                                                                                                                                                                             |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children                    | required            | One `ArrangementView.Primary` and one `ArrangementView.Secondary`; see [below](#arrangementviewprimary--arrangementviewsecondary)                                                   |
| `arrangement`               | `"split"`           | `"split"` or `"overlay"`                                                                                                                                                            |
| `axes`                      | `"both"`            | `"both"`, `"horizontal"`, or `"vertical"`; applies to either arrangement                                                                                                            |
| `primaryEdge`               | none                | `"leading"` or `"trailing"`: the side the primary pane takes when the panes are side by side; see [The primary pane's side](../guide/how-panes-are-arranged#the-primary-panes-side) |
| `onArrangementLayoutChange` | none                | Called with the [`ArrangementLayout`](./use-arrangement-layout#arrangementlayout) when it changes                                                                                   |
| `observeHinge`              | `true`              | Enables observation for hooks inside this arrangement; disabling it does not disable adaptive layout                                                                                |
| `hingePolicy`               | `"avoidSeparating"` | Android only. The hinges the panes keep clear of: `"avoidSeparating"` a half-open one, `"alwaysAvoid"` a flat one too, `"neverAvoid"` none                                          |
| `hingeGap`                  | `24`                | Android only. The space in dp between the panes around an avoided hinge, never narrower than the hinge itself                                                                       |

Give the arrangement a bounded size, usually `flex: 1`. The platform determines whether a split is appropriate; an axis restriction does not force two panes to stay visible.

The component adds no safe-area padding. Place it within the safe area supplied by your screen/navigation container, or handle insets in your content.

To adapt a pane's content to what the arrangement shows, such as whether the secondary pane is on screen, use [`useArrangementLayout`](./use-arrangement-layout) inside a pane, or `onArrangementLayoutChange` outside the panes.

## ArrangementView.Primary / ArrangementView.Secondary

`ArrangementView.Primary` and `ArrangementView.Secondary` are slot markers: they render no view of their own and do not affect layout. Put your own pane component inside each one. Both must be direct children of `ArrangementView`, in either order. Any other direct child is ignored, and a missing, duplicated, or unrecognized child logs a warning in development builds.

Give each pane's root `flex: 1` to fill its assigned space.

Don't move content between `ArrangementView.Primary` and `ArrangementView.Secondary` based on the layout or the hinge: React remounts content that changes slots, losing its state. Use `primaryEdge` to choose the primary pane's side, and [`useArrangementLayout`](./use-arrangement-layout) to adapt content within a pane.

In overlay mode the **primary is in front of the secondary**. Use a transparent primary background and `pointerEvents="box-none"` on its full-size React wrapper for floating controls; its visible controls can still receive touches. Hiding a pane does not unmount its React tree.
