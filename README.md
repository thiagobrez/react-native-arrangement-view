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

| Prop           | Default             | Meaning                                                                                                                                    |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| children       | required            | One `ArrangementView.Primary` and one `ArrangementView.Secondary`; see below                                                               |
| `arrangement`  | `"split"`           | `"split"` or `"overlay"`                                                                                                                   |
| `axes`         | `"both"`            | `"both"`, `"horizontal"`, or `"vertical"`; applies to either arrangement                                                                   |
| `observeHinge` | `true`              | Enables observation for hooks inside this arrangement; disabling it does not disable adaptive layout                                       |
| `hingePolicy`  | `"avoidSeparating"` | Android only. The hinges the panes keep clear of: `"avoidSeparating"` a half-open one, `"alwaysAvoid"` a flat one too, `"neverAvoid"` none |
| `hingeGap`     | `24`                | Android only. The space in dp between the panes around an avoided hinge, never narrower than the hinge itself                              |

`ArrangementView.Primary` and `ArrangementView.Secondary` are slot markers: they render no view of their own and do not affect layout. Put your own pane component inside each one. Both must be direct children of `ArrangementView`, in either order. Any other direct child is ignored, and a missing, duplicated, or unrecognized child logs a warning in development builds.

Give the arrangement a bounded size, usually `flex: 1`. Give each pane's root `flex: 1` to fill its assigned space. The platform determines whether a split is appropriate; an axis restriction does not force two panes to stay visible.

In overlay mode the **primary is in front of the secondary**. Use a transparent primary background and `pointerEvents="box-none"` on its full-size React wrapper for floating controls; its visible controls can still receive touches. Hiding a pane does not unmount its React tree.

The component adds no safe-area padding. Place it within the safe area supplied by your screen/navigation container, or handle insets in your content.

### How panes are arranged

Each platform follows its own conventions. iOS delegates arrangement to SwiftUI's `ArrangementView`. Android has no system equivalent, so the library applies Material's adaptive layout rules, the ones behind Compose's `calculatePaneScaffoldDirective`, to the window size and the fold that Jetpack WindowManager reports.

`axes` names the directions in which panes may be placed: `"horizontal"` is side by side, `"vertical"` is stacked. A split along an excluded axis never happens; the primary pane shows alone instead.

On iOS, as observed from SwiftUI on iOS 27.1:

- A half-open hinge splits the panes on either side of it, keeping 20 pt clear on each side of the crease.
- Otherwise the size classes decide. Side by side needs a regular horizontal size class and stacked a regular vertical one. When both are regular, the arrangement's longer side is halved. When both are compact, as on an iPhone in landscape, the primary pane shows alone.
- `overlay` puts both panes at full size, primary in front. A half-open hinge separates them, with the primary after the hinge: on the trailing side, or below it.

On Android:

- The window decides how many panes fit: two side by side from 840 dp wide, and never in a window under 480 dp tall, such as a phone in landscape, which Android's guidance considers too short for two panes. Two stacked fit in tabletop posture, or in a single-column window at least 900 dp tall.
- A hinge that `hingePolicy` avoids decides the axis, and the panes are separated by `hingeGap` centred on the crease. A half-open hinge splits the panes whatever the window size, as on iOS; a flat one only where two panes fit anyway. When the split doesn't fit, or `axes` excludes it, the primary pane shows alone on the leading side of the hinge, or above it.
- Otherwise the panes halve the arrangement and touch.
- `overlay` puts both panes at full size, primary in front. An avoided hinge separates them, as on iOS.
- Right-to-left layouts put the primary pane on the right.

Where the platforms differ:

| Situation                                     | iOS                                                  | Android                                                                               |
| --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Plus / Pro Max iPhones in landscape           | Side by side: they have a regular width in landscape | Primary only: the window is under 480 dp tall, as on every phone in landscape         |
| No hinge, two panes fit both ways             | The arrangement's longer side is halved              | Side by side, whatever the arrangement's shape                                        |
| Space around a half-open hinge                | 20 pt on each side, fixed                            | `hingeGap`, 24 dp by default; `hingePolicy` can include a flat hinge or ignore hinges |
| A half-open hinge whose split `axes` excludes | Primary only, at full size across the hinge          | Primary only, on the leading or top side of the hinge                                 |

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

## Platform comparison

The iPhone Duo and Pixel 10 Pro Fold have different screen sizes, so the pane sizes are not comparable between them, but the placement is.

Because of that, some poses and orientations might behave differently stacking on one while splitting on other. The differences are described in [How panes are arranged](#how-panes-are-arranged).

For example, when unfolded and turned sideways, the iPhone Duo is taller than wide, so the panels stack. The Pixel 10 Pro Fold is wider than tall, so the panels split side by side.

### `split`, `axes="both"`

**Closed · Portrait**

| iOS                                                                   | Android                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-portrait-split.jpg" width="400"> | <img src="docs/comparison/android/closed-portrait-split.jpg" width="400"> |

**Closed · Turned right**

| iOS                                                                          | Android                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-landscape-right-split.jpg" width="400"> | <img src="docs/comparison/android/closed-landscape-right-split.jpg" width="400"> |

**Closed · Upside down**

| iOS                                                                               | Android                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-portrait-upside-down-split.jpg" width="400"> | <img src="docs/comparison/android/closed-portrait-upside-down-split.jpg" width="400"> |

**Closed · Turned left**

| iOS                                                                         | Android                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-landscape-left-split.jpg" width="400"> | <img src="docs/comparison/android/closed-landscape-left-split.jpg" width="400"> |

**Half-open · Portrait**

| iOS                                                                 | Android                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-portrait-split.jpg" width="400"> | <img src="docs/comparison/android/half-portrait-split.jpg" width="400"> |

**Half-open · Turned right**

| iOS                                                                        | Android                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| <img src="docs/comparison/ios/half-landscape-right-split.jpg" width="400"> | <img src="docs/comparison/android/half-landscape-right-split.jpg" width="400"> |

**Half-open · Upside down**

| iOS                                                                             | Android                                                                             |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-portrait-upside-down-split.jpg" width="400"> | <img src="docs/comparison/android/half-portrait-upside-down-split.jpg" width="400"> |

**Half-open · Turned left**

| iOS                                                                       | Android                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-landscape-left-split.jpg" width="400"> | <img src="docs/comparison/android/half-landscape-left-split.jpg" width="400"> |

**Flat · Portrait**

| iOS                                                                 | Android                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-portrait-split.jpg" width="400"> | <img src="docs/comparison/android/flat-portrait-split.jpg" width="400"> |

**Flat · Turned right**

| iOS                                                                        | Android                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| <img src="docs/comparison/ios/flat-landscape-right-split.jpg" width="400"> | <img src="docs/comparison/android/flat-landscape-right-split.jpg" width="400"> |

**Flat · Upside down**

| iOS                                                                             | Android                                                                             |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-portrait-upside-down-split.jpg" width="400"> | <img src="docs/comparison/android/flat-portrait-upside-down-split.jpg" width="400"> |

**Flat · Turned left**

| iOS                                                                       | Android                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-landscape-left-split.jpg" width="400"> | <img src="docs/comparison/android/flat-landscape-left-split.jpg" width="400"> |

<details>
<summary><h3><code>overlay</code>, <code>axes="both"</code></h3></summary>

**Closed · Portrait**

| iOS                                                                     | Android                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-portrait-overlay.jpg" width="400"> | <img src="docs/comparison/android/closed-portrait-overlay.jpg" width="400"> |

**Closed · Turned right**

| iOS                                                                            | Android                                                                            |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-landscape-right-overlay.jpg" width="400"> | <img src="docs/comparison/android/closed-landscape-right-overlay.jpg" width="400"> |

**Closed · Upside down**

| iOS                                                                                 | Android                                                                                 |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-portrait-upside-down-overlay.jpg" width="400"> | <img src="docs/comparison/android/closed-portrait-upside-down-overlay.jpg" width="400"> |

**Closed · Turned left**

| iOS                                                                           | Android                                                                           |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/closed-landscape-left-overlay.jpg" width="400"> | <img src="docs/comparison/android/closed-landscape-left-overlay.jpg" width="400"> |

**Half-open · Portrait**

| iOS                                                                   | Android                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-portrait-overlay.jpg" width="400"> | <img src="docs/comparison/android/half-portrait-overlay.jpg" width="400"> |

**Half-open · Turned right**

| iOS                                                                          | Android                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-landscape-right-overlay.jpg" width="400"> | <img src="docs/comparison/android/half-landscape-right-overlay.jpg" width="400"> |

**Half-open · Upside down**

| iOS                                                                               | Android                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-portrait-upside-down-overlay.jpg" width="400"> | <img src="docs/comparison/android/half-portrait-upside-down-overlay.jpg" width="400"> |

**Half-open · Turned left**

| iOS                                                                         | Android                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-landscape-left-overlay.jpg" width="400"> | <img src="docs/comparison/android/half-landscape-left-overlay.jpg" width="400"> |

**Flat · Portrait**

| iOS                                                                   | Android                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-portrait-overlay.jpg" width="400"> | <img src="docs/comparison/android/flat-portrait-overlay.jpg" width="400"> |

**Flat · Turned right**

| iOS                                                                          | Android                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-landscape-right-overlay.jpg" width="400"> | <img src="docs/comparison/android/flat-landscape-right-overlay.jpg" width="400"> |

**Flat · Upside down**

| iOS                                                                               | Android                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-portrait-upside-down-overlay.jpg" width="400"> | <img src="docs/comparison/android/flat-portrait-upside-down-overlay.jpg" width="400"> |

**Flat · Turned left**

| iOS                                                                         | Android                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| <img src="docs/comparison/ios/flat-landscape-left-overlay.jpg" width="400"> | <img src="docs/comparison/android/flat-landscape-left-overlay.jpg" width="400"> |

</details>

## License

MIT
