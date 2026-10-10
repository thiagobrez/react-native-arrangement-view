import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from './data';
import { headerBase } from './header';

const Stack = createNativeStackNavigator();

const insights = [
  ['Most active hour', '6:00–7:00, with 2,430 steps'],
  ['Best day this month', 'Tuesday, September 15: 16,000 steps'],
  ['Goal streak', '14 days at 5,000 steps or more'],
];

/** A few observations from the step history. */
export function InsightsTab() {
  return (
    <Stack.Navigator screenOptions={headerBase}>
      <Stack.Screen
        name="insights-home"
        component={InsightsScreen}
        options={{ title: 'Insights' }}
      />
    </Stack.Navigator>
  );
}

function InsightsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {insights.map(([title, detail]) => (
          <View key={title} style={styles.card}>
            <Text style={styles.caption}>{title}</Text>
            <Text style={styles.detail}>{detail}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, gap: 12 },
  caption: { fontSize: 15, color: colors.secondary },
  card: {
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  detail: { fontSize: 17, fontWeight: '600', color: colors.text },
});
