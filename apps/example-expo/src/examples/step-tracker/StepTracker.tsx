import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { ArrangementView } from 'react-native-arrangement-view';
import { Dashboard } from './Dashboard';
import { colors, today } from './data';
import { HistoryCalendar } from './HistoryCalendar';

/**
 * A step tracker after a foldable app design: the dashboard alone on a closed
 * device, and the step history beside it once unfolded. The dashboard is the
 * primary pane on the trailing side, so on a book-style foldable it stays
 * where the cover display was as the device opens.
 */
export function StepTracker() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
    });
  }, [navigation]);
  // Shared by both panes, so choosing a day in either updates the other.
  const [selected, setSelected] = useState(today);
  // On a closed device the calendar opens as a sheet instead.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <ArrangementView
        style={styles.arrangement}
        axes="horizontal"
        primaryEdge="trailing"
      >
        <ArrangementView.Primary>
          <Dashboard
            selected={selected}
            onSelect={setSelected}
            onOpenCalendar={() => setCalendarOpen(true)}
            onCalendarShown={closeCalendar}
          />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <HistoryCalendar selected={selected} onSelect={setSelected} />
        </ArrangementView.Secondary>
      </ArrangementView>
      <Modal
        visible={calendarOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCalendar}
      >
        {/* A modal is a separate window, with insets of its own. */}
        <SafeAreaProvider>
          <SafeAreaView
            style={styles.sheet}
            edges={['top', 'left', 'right', 'bottom']}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>History</Text>
              <Pressable
                accessibilityRole="button"
                onPress={closeCalendar}
                hitSlop={12}
              >
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <HistoryCalendar
              selected={selected}
              onSelect={(date) => {
                setSelected(date);
                closeCalendar();
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
  arrangement: { flex: 1 },
  sheet: { flex: 1, backgroundColor: colors.background },
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
