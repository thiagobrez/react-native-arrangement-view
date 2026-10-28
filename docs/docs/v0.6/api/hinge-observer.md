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
  return hinge.status === 'partiallyOpen' ? <TabletopCamera /> : <FullCamera />;
}
```

When running below iOS 27.1, building with an older SDK, or on unsupported platforms, the hinge state remains unavailable.

For where the fold is, in a view's own coordinates, use a [`SystemLayoutObserver`](./system-layout-observer).
