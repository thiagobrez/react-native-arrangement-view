<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/logo/logo-icon-dark.png" />
  <source media="(prefers-color-scheme: light)" srcset="docs/logo/logo-icon-light.png" />
  <img src="docs/logo/logo-icon-light.png" alt="react-native-arrangement-view logo" width="128" height="128" />
</picture>

# react-native-arrangement-view

**Foldable devices adaptive arrangement views and hinge observation for React Native.**

</div>

> Android coming soon!

## Install

```sh
yarn add react-native-arrangement-view
cd ios && pod install
```

> Expo Go is not supported. Use a development build (`npx expo run:ios`).

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

Give the arrangement a bounded size, usually `flex: 1`. Give each pane's root `flex: 1` to fill its assigned space. Native determines whether a split is appropriate; an axis restriction does not force two panes to stay visible.

In overlay mode the **primary is in front of the secondary**. Use a transparent primary background and `pointerEvents="box-none"` on its full-size React wrapper for floating controls; its visible controls can still receive touches. Hiding a pane does not unmount its React tree.

The component adds no safe-area padding. Place it within the safe area supplied by your screen/navigation container, or handle insets in your content.

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

### Fallback

When running below iOS 27.1 **or building with an older SDK**:

- `split` displays only the primary pane. The secondary React tree remains mounted but is outside the visible native hierarchy.
- `overlay` layers primary over secondary at full size.
- `axes` has no effect. Hinge state remains unavailable.

## License

MIT
