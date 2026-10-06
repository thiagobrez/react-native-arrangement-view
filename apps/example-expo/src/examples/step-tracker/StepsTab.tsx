import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ArrangementView,
  type ArrangementLayout,
} from 'react-native-arrangement-view';
import { Dashboard } from './Dashboard';
import { colors, today } from './data';
import { headerBase, headerButtons, type HeaderButton } from './header';
import { HistoryCalendar } from './HistoryCalendar';

const Stack = createNativeStackNavigator();

const settings: HeaderButton = {
  label: 'Settings',
  symbol: 'gearshape',
  icon: 'cog-outline',
};

/** The day's steps: the dashboard, and the step history once unfolded. */
export function StepsTab() {
  return (
    <Stack.Navigator screenOptions={headerBase}>
      <Stack.Screen
        name="steps-home"
        component={StepsScreen}
        options={{ title: '', ...headerButtons([settings]) }}
      />
    </Stack.Navigator>
  );
}

function StepsScreen() {
  // Shared by both panes, so choosing a day in either updates the other.
  const [selected, setSelected] = useState(today);
  // On a closed device the calendar opens as a sheet instead.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [layout, setLayout] = useState<ArrangementLayout | null>(null);
  const openCalendar = useCallback(() => setCalendarOpen(true), []);

  // The calendar button opens what the calendar pane would show, so it's only
  // offered once the panes are laid out without it.
  const showCalendar = layout !== null && !layout.secondaryVisible;
  const navigation = useNavigation();
  useLayoutEffect(() => {
    const calendar: HeaderButton = {
      label: 'Calendar',
      symbol: 'calendar',
      icon: 'calendar-month-outline',
      onPress: openCalendar,
    };
    navigation.setOptions(
      headerButtons(showCalendar ? [calendar, settings] : [settings])
    );
  }, [navigation, showCalendar, openCalendar]);

  return (
    // The whole arrangement stays clear of system bars, such as the column
    // that holds the tabs beside it on a foldable.
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ArrangementView
        style={styles.screen}
        axes="horizontal"
        primaryEdge="trailing"
        onArrangementLayoutChange={(next) => {
          setLayout(next);
          // The calendar is on screen now: the sheet would repeat it.
          if (next.secondaryVisible) setCalendarOpen(false);
        }}
      >
        <ArrangementView.Primary>
          <Dashboard selected={selected} onSelect={setSelected} />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <HistoryCalendar selected={selected} onSelect={setSelected} />
        </ArrangementView.Secondary>
      </ArrangementView>
      <Modal
        visible={calendarOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCalendarOpen(false)}
      >
        {/* A modal is a separate window, with insets of its own. */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.screen}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>History</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCalendarOpen(false)}
                hitSlop={12}
              >
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <HistoryCalendar
              selected={selected}
              onSelect={(date) => {
                setSelected(date);
                setCalendarOpen(false);
              }}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  done: { fontSize: 17, fontWeight: '600', color: '#1e88f5' },
});
