# react-native-arrangement-view

Foldable devices adaptive arrangement views and hinge observation for React Native.

## Install

```sh
yarn add react-native-arrangement-view
cd ios && pod install
```

> Expo Go is not supported. Use a development build (`npx expo run:ios`, `npx expo run:android`).

## API

### ArrangementView

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

| Prop           | Default   | Meaning                                                                                              |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| children       | required  | One `ArrangementView.Primary` and one `ArrangementView.Secondary`; see below                         |
| `arrangement`  | `"split"` | `"split"` or `"overlay"`                                                                             |
| `axes`         | `"both"`  | `"both"`, `"horizontal"`, or `"vertical"`; applies to either arrangement                             |
| `observeHinge` | `true`    | Enables observation for hooks inside this arrangement; disabling it does not disable adaptive layout |

`ArrangementView.Primary` and `ArrangementView.Secondary` are slot markers: they render no view of their own and do not affect layout. Put your own pane component inside each one. Both must be direct children of `ArrangementView`, in either order. Any other direct child is ignored, and a missing, duplicated, or unrecognized child logs a warning in development builds.

Give the arrangement a bounded size, usually `flex: 1`. Give each pane's root `flex: 1` to fill its assigned space. The platform determines whether a split is appropriate; an axis restriction does not force two panes to stay visible.

In overlay mode the **primary is in front of the secondary**. Use a transparent primary background and `pointerEvents="box-none"` on its full-size React wrapper for floating controls; its visible controls can still receive touches. Hiding a pane does not unmount its React tree.

The component adds no safe-area padding. Place it within the safe area supplied by your screen/navigation container, or handle insets in your content.

### How panes are arranged

iOS delegates arrangement to SwiftUI's `ArrangementView`. Android has no system equivalent, so the library arranges the panes itself, taking the fold from Jetpack WindowManager's `FoldingFeature`. These are Android's rules; they were written to match the behavior observed from SwiftUI, which remains the authority on iOS.

| Posture                                                     | `split`                                                                                          | `overlay`                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| A fold separates the arrangement (half-opened, dual-screen) | Panes on either side of the fold                                                                 | Panes on either side of the fold          |
| Flat, closed, or no fold                                    | Panes side by side when wider than tall, otherwise stacked; primary only if `axes` excludes that | Primary over secondary, both at full size |

`axes` names the directions in which panes may be placed: `"horizontal"` is side by side, `"vertical"` is stacked. A fold along an excluded axis is treated as no fold. On Android a split follows the fold's own bounds, so a seamless fold leaves no gap between the panes, and right-to-left layouts put the primary pane on the right.

### useHingeChange

Call the hook **inside a component rendered in either pane**. It observes the nearest `ArrangementView`, keeping events associated with that view's scene. It is not a process-wide sensor subscription.

```tsx
import { Text } from 'react-native';
import { useHingeChange } from 'react-native-arrangement-view';

function Player() {
  const hinge = useHingeChange((next) => {
    // Use angle/status for effects or interactions.
    // Let ArrangementView handle adaptive layout.
    console.log(next.angle, next.status);
  });

  return (
    <Text>{hinge.angle === null ? 'No hinge' : `${hinge.angle} rad`}</Text>
  );
}
```

The callback is optional; the hook also returns the current `HingeState` and subscribes the component to updates. It invokes the callback with the initial unavailable state and then changed values.

```ts
type HingeState = {
  available: boolean;
  angle: number | null; // radians
  status: 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
};
```

Before the first native update, without hardware, or when observation is disabled, the state is `{ available: false, angle: null, status: 'unknown' }`.

On Android, `angle` comes from the hinge angle sensor (Android 11+) and is `null` on a foldable without one. `status` comes from the window's `FoldingFeature`: `FLAT` is `fullyOpen` and `HALF_OPENED` is `partiallyOpen`. A closed device reports no fold, because the app is on its cover display, so `closed` is a hinge angle under 5° with no fold in the window. Anything else is `unknown`, such as a window that the fold does not cross.

### Fallback

When running below iOS 27.1 **or building with an older SDK**:

- `split` displays only the primary pane. The secondary React tree remains mounted but is outside the visible native hierarchy.
- `overlay` layers primary over secondary at full size.
- `axes` has no effect. Hinge state remains unavailable.

Android has no fallback mode: a device without a fold is arranged as flat, and its hinge state is unavailable.

## License

MIT
