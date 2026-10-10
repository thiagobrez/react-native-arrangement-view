# HingeObserver

Observes the hinge for [`useHingeChange`](./use-hinge-change) anywhere among its children, without arranging anything. It renders a hidden native view as a sibling of the children, so it takes no space and no touches.

Mount it **above your navigator**. The app root never leaves the window, so every screen reads live values, including one beneath a pushed screen:

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

Hooks inside an `ArrangementView`'s panes read that arrangement, which is nearer. Its `observeHinge` prop has no equivalent here: unmount the observer to stop observing.

When running below iOS 27.1, or building with an older SDK, the hinge state remains unavailable. On platforms other than iOS and Android, the children render and the state stays unavailable.
