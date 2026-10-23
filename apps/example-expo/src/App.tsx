import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HingeObserver } from 'react-native-arrangement-view';
import { ExamplesList } from './ExamplesList';
import { examples } from './examples';
import { HingeBench, NitroAlone, NitroChildren } from './HingeBench';

// The bench runs its own hinge transports, so the root observer would add a second stream.
const bench = process.env.EXPO_PUBLIC_RAV_BENCH === '1';
const Observer = bench
  ? ({ children }: { children: React.ReactNode }) => children
  : HingeObserver;

const Stack = createNativeStackNavigator();

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
      <Observer>
        <NavigationContainer theme={theme}>
          <Stack.Navigator
            initialRouteName={bench ? 'hinge-bench' : 'examples'}
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
            <Stack.Screen
              name="hinge-bench"
              component={HingeBench}
              options={{ title: 'Hinge bench' }}
            />
            <Stack.Screen name="nitro-children" component={NitroChildren} />
            <Stack.Screen name="nitro-alone" component={NitroAlone} />
            {examples.map((example) => (
              <Stack.Screen
                key={example.name}
                name={example.name}
                component={example.component}
                options={{ title: example.title, ...example.options }}
              />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
      </Observer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: theme.colors.background },
});
