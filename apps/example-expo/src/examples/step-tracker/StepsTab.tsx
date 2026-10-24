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
import { colors, FIXED_TODAY } from './data';
import { headerBase, headerButtons, type HeaderButton } from './header';
import { HistoryCalendar } from './HistoryCalendar';

const Stack = createNativeStackNavigator();

const settings: HeaderButton = {
  label: 'Settings',
  sfSymbol: 'gearshape',
  materialIcon: 'cog-outline',
};

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
  const [selected, setSelected] = useState(FIXED_TODAY);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [layout, setLayout] = useState<ArrangementLayout | null>(null);
  const openCalendar = useCallback(() => setCalendarSheetOpen(true), []);

  const calendarPaneHidden = layout !== null && !layout.secondaryVisible;
  const navigation = useNavigation();
  useLayoutEffect(() => {
    const calendar: HeaderButton = {
      label: 'Calendar',
      sfSymbol: 'calendar',
      materialIcon: 'calendar-month-outline',
      onPress: openCalendar,
    };
    navigation.setOptions(
      headerButtons(calendarPaneHidden ? [calendar, settings] : [settings])
    );
  }, [navigation, calendarPaneHidden, openCalendar]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ArrangementView
        style={styles.screen}
        axes="horizontal"
        primaryEdge="trailing"
        onArrangementLayoutChange={(next) => {
          setLayout(next);
          if (next.secondaryVisible) setCalendarSheetOpen(false);
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
        visible={calendarSheetOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCalendarSheetOpen(false)}
      >
        {/* A modal is a separate window, with insets of its own. */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.screen}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>History</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCalendarSheetOpen(false)}
                hitSlop={12}
              >
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <HistoryCalendar
              selected={selected}
              onSelect={(date) => {
                setSelected(date);
                setCalendarSheetOpen(false);
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
