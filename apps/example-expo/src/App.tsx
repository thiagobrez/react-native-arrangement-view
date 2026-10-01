import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HingeObserver } from 'react-native-arrangement-view';
import { ArrangementScreen } from './ArrangementScreen';
import { HingeScreen } from './HingeScreen';

export type Screens = { Arrangement: undefined; Hinge: undefined };

const Stack = createNativeStackNavigator<Screens>();
const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#10121a', card: '#10121a' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {/* Above the navigator, so screens under a pushed one keep observing. */}
      <HingeObserver>
        <NavigationContainer theme={theme}>
          <Stack.Navigator>
            <Stack.Screen
              name="Arrangement"
              component={ArrangementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Hinge" component={HingeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </HingeObserver>
    </SafeAreaProvider>
  );
}
