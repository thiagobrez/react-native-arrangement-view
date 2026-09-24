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

| Prop                    | Default             | Meaning                                                                                                                                    |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| children                | required            | One `ArrangementView.Primary` and one `ArrangementView.Secondary`; see below                                                               |
| `arrangement`           | `"split"`           | `"split"` or `"overlay"`                                                                                                                   |
| `axes`                  | `"both"`            | `"both"`, `"horizontal"`, or `"vertical"`; applies to either arrangement                                                                   |
| `observeHinge`          | `true`              | Enables observation for hooks inside this arrangement; disabling it does not disable adaptive layout                                       |
| `hingePolicy`           | `"avoidSeparating"` | Android only. The hinges the panes keep clear of: `"avoidSeparating"` a half-open one, `"alwaysAvoid"` a flat one too, `"neverAvoid"` none |
| `hingeGap`              | `24`                | Android only. The space in dp between the panes around an avoided hinge, never narrower than the hinge itself                              |
| `twoPanesOnMediumWidth` | `false`             | Android only. Allows two panes side by side in a window 600–839 dp wide                                                                    |

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

- The window decides how many panes fit: two side by side from 840 dp wide, or from 600 dp with `twoPanesOnMediumWidth`. Two stacked fit in tabletop posture, or in a single-column window at least 900 dp tall.
- A hinge that `hingePolicy` avoids decides the axis, and the panes are separated by `hingeGap` centred on the crease. When that split doesn't fit, or `axes` excludes it, the primary pane shows alone on the leading side of the hinge, or above it.
- Otherwise the panes halve the arrangement and touch.
- `overlay` puts both panes at full size, primary in front. An avoided hinge separates them, as on iOS.
- Right-to-left layouts put the primary pane on the right.

Where the platforms differ:

| Situation                                                     | iOS                                                              | Android                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Phone in landscape, such as a closed foldable turned sideways | Primary only, except on models with a regular width in landscape | Side by side when the window is at least 840 dp wide, as the Pixel 10 Pro Fold's cover screen is |
| No hinge, two panes fit both ways                             | The arrangement's longer side is halved                          | Side by side, whatever the arrangement's shape                                                   |
| Space around a half-open hinge                                | 20 pt on each side, fixed                                        | `hingeGap`, 24 dp by default; `hingePolicy` can include a flat hinge or ignore hinges            |
| A window 600–839 dp wide in book posture                      | Decided by size classes                                          | Primary only, beside the hinge, unless `twoPanesOnMediumWidth`                                   |
| A half-open hinge whose split `axes` excludes                 | Primary only, at full size across the hinge                      | Primary only, on the leading or top side of the hinge                                            |

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

Captured on September 24, 2026 from the example app on two simulators: the iOS 27.1 iPhone Duo and the Pixel 10 Pro Fold emulator (Android API 37).
Half-open was a 134° hinge on the iPhone Duo and 128° on the Pixel.
Turned right and turned left mean the device was rotated 90° clockwise or counterclockwise from portrait; the frames show how it was held.
The two devices have different screen sizes, so the pane sizes are not comparable between them; the placement is.

The differences are described in [How panes are arranged](#how-panes-are-arranged). One more comes from the devices, not the library: neither cover screen rotates upside down, so each keeps the previous landscape layout. The unfolded inner screens do rotate.

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
<summary><code>overlay</code>, <code>axes="both"</code></summary>

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

### Every `axes` value

Pane sizes are in points on iOS and dp on Android. ⚠️ marks a placement that differs between the platforms.

<details>
<summary><code>split</code></summary>

| Posture   | Orientation  | `axes`       | iOS                              | Android                                      |
| --------- | ------------ | ------------ | -------------------------------- | -------------------------------------------- |
| Closed    | Portrait     | `both`       | stacked: 262 / 262               | stacked: 398 / 397                           |
| Closed    | Portrait     | `horizontal` | primary only: 382 × 523          | primary only: 443 × 795                      |
| Closed    | Portrait     | `vertical`   | stacked: 262 / 262               | stacked: 398 / 397                           |
| Closed    | Turned right | `both`       | primary only: 594 × 348          | side by side: 454 \| 454 ⚠️                  |
| Closed    | Turned right | `horizontal` | primary only: 594 × 348          | side by side: 454 \| 454 ⚠️                  |
| Closed    | Turned right | `vertical`   | primary only: 594 × 348          | primary only: 907 × 278                      |
| Closed    | Upside down  | `both`       | primary only: 594 × 348          | side by side: 454 \| 454 ⚠️                  |
| Closed    | Upside down  | `horizontal` | primary only: 594 × 348          | side by side: 454 \| 454 ⚠️                  |
| Closed    | Upside down  | `vertical`   | primary only: 594 × 348          | primary only: 907 × 278                      |
| Closed    | Turned left  | `both`       | primary only: 594 × 348          | side by side: 454 \| 454 ⚠️                  |
| Closed    | Turned left  | `horizontal` | primary only: 594 × 348          | side by side: 454 \| 454 ⚠️                  |
| Closed    | Turned left  | `vertical`   | primary only: 594 × 348          | primary only: 907 × 278                      |
| Half-open | Portrait     | `both`       | side by side: 456 \| 371, 40 gap | side by side: 414 \| 414, 24 gap             |
| Half-open | Portrait     | `horizontal` | side by side: 456 \| 371, 40 gap | side by side: 414 \| 414, 24 gap             |
| Half-open | Portrait     | `vertical`   | primary only: 867 × 551          | primary only, beside the hinge: 414 × 706 ⚠️ |
| Half-open | Turned right | `both`       | stacked: 289 / 421, 41 gap       | stacked: 289 / 358, 24 gap                   |
| Half-open | Turned right | `horizontal` | primary only: 669 × 751          | primary only, beside the hinge: 883 × 289 ⚠️ |
| Half-open | Turned right | `vertical`   | stacked: 289 / 421, 41 gap       | stacked: 289 / 358, 24 gap                   |
| Half-open | Upside down  | `both`       | side by side: 456 \| 371, 40 gap | side by side: 414 \| 414, 24 gap             |
| Half-open | Upside down  | `horizontal` | side by side: 456 \| 371, 40 gap | side by side: 414 \| 414, 24 gap             |
| Half-open | Upside down  | `vertical`   | primary only: 867 × 551          | primary only, beside the hinge: 414 × 702 ⚠️ |
| Half-open | Turned left  | `both`       | stacked: 289 / 421, 41 gap       | stacked: 270 / 382, 24 gap                   |
| Half-open | Turned left  | `horizontal` | primary only: 669 × 751          | primary only, beside the hinge: 883 × 270 ⚠️ |
| Half-open | Turned left  | `vertical`   | stacked: 289 / 421, 41 gap       | stacked: 270 / 382, 24 gap                   |
| Flat      | Portrait     | `both`       | side by side: 434 \| 433         | side by side: 426 \| 426                     |
| Flat      | Portrait     | `horizontal` | side by side: 434 \| 433         | side by side: 426 \| 426                     |
| Flat      | Portrait     | `vertical`   | primary only: 867 × 551          | primary only: 852 × 706                      |
| Flat      | Turned right | `both`       | stacked: 375 / 375               | side by side: 441 \| 441 ⚠️                  |
| Flat      | Turned right | `horizontal` | primary only: 669 × 751          | side by side: 441 \| 441 ⚠️                  |
| Flat      | Turned right | `vertical`   | stacked: 375 / 375               | primary only: 883 × 671 ⚠️                   |
| Flat      | Upside down  | `both`       | side by side: 434 \| 433         | side by side: 426 \| 426                     |
| Flat      | Upside down  | `horizontal` | side by side: 434 \| 433         | side by side: 426 \| 426                     |
| Flat      | Upside down  | `vertical`   | primary only: 867 × 551          | primary only: 852 × 702                      |
| Flat      | Turned left  | `both`       | stacked: 375 / 375               | side by side: 441 \| 441 ⚠️                  |
| Flat      | Turned left  | `horizontal` | primary only: 669 × 751          | side by side: 441 \| 441 ⚠️                  |
| Flat      | Turned left  | `vertical`   | stacked: 375 / 375               | primary only: 883 × 675 ⚠️                   |

</details>

<details>
<summary><code>overlay</code></summary>

| Posture   | Orientation  | `axes`       | iOS                                             | Android                                         |
| --------- | ------------ | ------------ | ----------------------------------------------- | ----------------------------------------------- |
| Closed    | Portrait     | `both`       | overlaid                                        | overlaid                                        |
| Closed    | Portrait     | `horizontal` | overlaid                                        | overlaid                                        |
| Closed    | Portrait     | `vertical`   | overlaid                                        | overlaid                                        |
| Closed    | Turned right | `both`       | overlaid                                        | overlaid                                        |
| Closed    | Turned right | `horizontal` | overlaid                                        | overlaid                                        |
| Closed    | Turned right | `vertical`   | overlaid                                        | overlaid                                        |
| Closed    | Upside down  | `both`       | overlaid                                        | overlaid                                        |
| Closed    | Upside down  | `horizontal` | overlaid                                        | overlaid                                        |
| Closed    | Upside down  | `vertical`   | overlaid                                        | overlaid                                        |
| Closed    | Turned left  | `both`       | overlaid                                        | overlaid                                        |
| Closed    | Turned left  | `horizontal` | overlaid                                        | overlaid                                        |
| Closed    | Turned left  | `vertical`   | overlaid                                        | overlaid                                        |
| Half-open | Portrait     | `both`       | side by side, primary right: 456 \| 371, 40 gap | side by side, primary right: 414 \| 414, 24 gap |
| Half-open | Portrait     | `horizontal` | side by side, primary right: 456 \| 371, 40 gap | side by side, primary right: 414 \| 414, 24 gap |
| Half-open | Portrait     | `vertical`   | overlaid                                        | overlaid                                        |
| Half-open | Turned right | `both`       | stacked, primary below: 289 / 421, 41 gap       | stacked, primary below: 289 / 358, 24 gap       |
| Half-open | Turned right | `horizontal` | overlaid                                        | overlaid                                        |
| Half-open | Turned right | `vertical`   | stacked, primary below: 289 / 421, 41 gap       | stacked, primary below: 289 / 358, 24 gap       |
| Half-open | Upside down  | `both`       | side by side, primary right: 456 \| 371, 40 gap | side by side, primary right: 414 \| 414, 24 gap |
| Half-open | Upside down  | `horizontal` | side by side, primary right: 456 \| 371, 40 gap | side by side, primary right: 414 \| 414, 24 gap |
| Half-open | Upside down  | `vertical`   | overlaid                                        | overlaid                                        |
| Half-open | Turned left  | `both`       | stacked, primary below: 289 / 421, 41 gap       | stacked, primary below: 270 / 382, 24 gap       |
| Half-open | Turned left  | `horizontal` | overlaid                                        | overlaid                                        |
| Half-open | Turned left  | `vertical`   | stacked, primary below: 289 / 421, 41 gap       | stacked, primary below: 270 / 382, 24 gap       |
| Flat      | Portrait     | `both`       | overlaid                                        | overlaid                                        |
| Flat      | Portrait     | `horizontal` | overlaid                                        | overlaid                                        |
| Flat      | Portrait     | `vertical`   | overlaid                                        | overlaid                                        |
| Flat      | Turned right | `both`       | overlaid                                        | overlaid                                        |
| Flat      | Turned right | `horizontal` | overlaid                                        | overlaid                                        |
| Flat      | Turned right | `vertical`   | overlaid                                        | overlaid                                        |
| Flat      | Upside down  | `both`       | overlaid                                        | overlaid                                        |
| Flat      | Upside down  | `horizontal` | overlaid                                        | overlaid                                        |
| Flat      | Upside down  | `vertical`   | overlaid                                        | overlaid                                        |
| Flat      | Turned left  | `both`       | overlaid                                        | overlaid                                        |
| Flat      | Turned left  | `horizontal` | overlaid                                        | overlaid                                        |
| Flat      | Turned left  | `vertical`   | overlaid                                        | overlaid                                        |

</details>

## License

MIT
