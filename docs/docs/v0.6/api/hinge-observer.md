---
description: HingeObserver provides a foldable's hinge angle and status to every screen of a React Native app, outside an ArrangementView.
---

# HingeObserver

The provider for hinge state. Use [`useHingeChange`](./use-hinge-change) on any children to consume the current hinge state and subscribe to changes.

An [`ArrangementView`](./arrangement-view) also acts as a hinge observer. The hook reads from whichever container is nearer in the React tree, so you can use it inside a pane without adding a separate observer.

Mount it **above your navigator**. It renders a hidden native view as a sibling of the children, so it takes no space and no touches.

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HingeObserver, useHingeChange } from 'react-native-arrangement-view';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <HingeObserver>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Camera" component={Camera} />
        </Stack.Navigator>
      </NavigationContainer>
    </HingeObserver>
  );
}

function Camera() {
  const hinge = useHingeChange();
  return hinge?.status === 'partiallyOpen' ? (
    <TabletopCamera />
  ) : (
    <FullCamera />
  );
}
```

The hooks return `null` until the [first report](./use-hinge-change#when-the-first-report-comes). Below iOS 27.1, when the app is built with an older SDK, and on platforms other than iOS and Android, the first report says there is no hinge.

## React to a hinge in native code on iOS

Some decisions about a window are made in native code, at a moment that can't wait for JavaScript. For those, the library's pod has a Swift class, `HingeWindows`. A `HingeObserver` or an `ArrangementView` adds its window to `HingeWindows` when it finds a hinge there, before its report reaches JavaScript.

- `HingeWindows.didFindHingeNotification` is posted on the main thread the first time a window is found to have a hinge. The notification's `object` is the `UIWindow`.
- `HingeWindows.hasHinge(_:)` returns whether a window has been found to have a hinge. Once true, it stays true.

A window is found only when a `HingeObserver` or an `ArrangementView` in it receives a hinge from iOS, which needs iOS 27.1, the iOS 27.1 SDK and a device with a hinge. Elsewhere, `hasHinge(_:)` returns `false` and the notification never comes.

What the app does with a hinge is up to the app. The usual use is rotation.

### Let a window with a hinge rotate

An app that keeps phones in portrait can let a window rotate once it has a hinge. iOS asks the app delegate which orientations each window allows. The answer comes from `hasHinge(_:)`, and the notification makes iOS ask again.

The [example app](https://github.com/thiagobrez/react-native-arrangement-view/tree/main/apps/example-expo/modules/hinge-rotation) does this in an Expo app delegate subscriber:

```swift
import ArrangementView
import ExpoModulesCore
import UIKit

/// Keeps phones in portrait, and lets a window rotate once a `HingeObserver`
/// or an `ArrangementView` finds a hinge in it.
public final class HingeRotationSubscriber: ExpoAppDelegateSubscriber {
  public func subscriberDidRegister() {
    NotificationCenter.default.addObserver(
      forName: HingeWindows.didFindHingeNotification, object: nil, queue: nil
    ) { notification in
      (notification.object as? UIWindow)?.rootViewController?
        .setNeedsUpdateOfSupportedInterfaceOrientations()
    }
  }

  public func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    guard UIDevice.current.userInterfaceIdiom == .phone else { return .all }
    return window.map(HingeWindows.hasHinge) == true ? .allButUpsideDown : .portrait
  }
}
```

The module's `expo-module.config.json` lists the subscriber under `apple.appDelegateSubscribers`, and its podspec depends on `ArrangementView`. In an app with its own `AppDelegate`, add the observer in `application(_:didFinishLaunchingWithOptions:)` and the orientation method to the delegate.
