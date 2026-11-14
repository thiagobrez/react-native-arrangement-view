import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HingeObserver } from 'react-native-arrangement-view';
import { ExamplesList } from './ExamplesList';
import { examples } from './examples';
import { FrameBench } from './FrameBench';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['arrangementview://'],
  config: { screens: { frames: 'frames' } },
};

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#10121a',
    card: '#10121a',
    border: '#222637',
    primary: '#e0e7ff',
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <HingeObserver>
        <NavigationContainer theme={theme} linking={linking}>
          <Stack.Navigator
            screenOptions={{
              headerShadowVisible: false,
              statusBarStyle: 'light',
            }}
          >
            <Stack.Screen
              name="examples"
              component={ExamplesList}
              options={{ title: 'Arrangement View' }}
            />
            {examples.map((example) => (
              <Stack.Screen
                key={example.name}
                name={example.name}
                component={example.component}
                options={{ title: example.title, ...example.options }}
              />
            ))}
            {/* With a header, every resize draws one frame of panes placed
              for the whole window inside the shorter screen. The bench leaves
              it out until the library fixes that, to measure the library
              alone. */}
            <Stack.Screen
              name="frames"
              component={FrameBench}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </HingeObserver>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: theme.colors.background },
});
