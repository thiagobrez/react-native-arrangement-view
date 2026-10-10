<div align="center">

<img src="docs/logo/logo.svg" alt="react-native-arrangement-view logo" width="160" />

# react-native-arrangement-view

**Foldable devices adaptive arrangement views and hinge observation for React Native.**

[Documentation](https://thiagobrez.github.io/react-native-arrangement-view/)

</div>

## Install

```sh
yarn add react-native-arrangement-view
cd ios && pod install
```

> Expo Go is not supported. Use a development build (`npx expo run:ios`, `npx expo run:android`).

## Quick Start

```tsx
import { Text } from 'react-native';
import { ArrangementView, useHingeChange } from 'react-native-arrangement-view';

export function PlayerScreen() {
  return (
    <ArrangementView style={{ flex: 1 }} arrangement="split" axes="both">
      <ArrangementView.Primary>
        <Player />
      </ArrangementView.Primary>
      <ArrangementView.Secondary>
        {/* Add your secondary view here */}
      </ArrangementView.Secondary>
    </ArrangementView>
  );
}

function Player() {
  // Called inside a pane, the hook observes the nearest ArrangementView.
  const hinge = useHingeChange();

  return (
    <Text>
      {hinge.angle === null
        ? 'No hinge'
        : `${Math.round((hinge.angle * 180) / Math.PI)}° ${hinge.status}`}
    </Text>
  );
}
```

`ArrangementView` places the two panes; on a foldable, a half-open hinge splits them on either side of the crease:

**Half-open · Portrait**

| iOS                                                                 | Android                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| <img src="docs/comparison/ios/half-portrait-split.jpg" width="400"> | <img src="docs/comparison/android/half-portrait-split.jpg" width="400"> |

**Half-open · Turned right**

| iOS                                                                        | Android                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| <img src="docs/comparison/ios/half-landscape-right-split.jpg" width="400"> | <img src="docs/comparison/android/half-landscape-right-split.jpg" width="400"> |
