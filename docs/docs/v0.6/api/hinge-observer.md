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

## Let a window with a hinge rotate on iOS

An app that keeps phones in portrait can still let a window with a hinge rotate. The library's pod has a Swift class, `HingeWindows`, that knows the windows a `HingeObserver` or an `ArrangementView` has found a hinge in. Each registers its window when it finds a hinge there, before its report reaches JavaScript, and the first time a window registers, `HingeWindows` posts `HingeWindows.didFindHingeNotification` with the window.

```swift
import ArrangementView

final class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    NotificationCenter.default.addObserver(
      forName: HingeWindows.didFindHingeNotification, object: nil, queue: nil
    ) { notification in
      (notification.object as? UIWindow)?.rootViewController?
        .setNeedsUpdateOfSupportedInterfaceOrientations()
    }
    return true
  }

  func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    window.map(HingeWindows.hasHinge) == true ? .allButUpsideDown : .portrait
  }
}
```

In an Expo app, put these two methods in an `ExpoAppDelegateSubscriber` of a local module whose podspec depends on `ArrangementView`.
