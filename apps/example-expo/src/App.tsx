import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExamplesList } from './ExamplesList';
import { examples } from './examples';

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
      <StatusBar style="light" />
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
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
              options={{ title: example.title }}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: theme.colors.background },
});
