import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import {
  createNativeBottomTabNavigator,
  type NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import {
  ArrangementView,
  type ArrangementLayout,
} from 'react-native-arrangement-view';
import { CaloriesTab, InsightsTab } from './OtherTabs';
import { Dashboard } from './Dashboard';
import { colors, today } from './data';
import { HistoryCalendar } from './HistoryCalendar';

const Tab = createNativeBottomTabNavigator();
const paneEdges = ['left', 'right', 'bottom'] as const;

/**
 * A step tracker after a foldable app design: the dashboard alone on a closed
 * device, and the step history beside it once unfolded. The dashboard is the
 * primary pane on the trailing side, so on a book-style foldable it stays
 * where the cover display was as the device opens.
 *
 * The tabs and header buttons are native, so the system places them: a tab
 * bar and navigation bar on most devices, and a vertical column beside the
 * content where the platform puts them there.
 */
export function StepTracker() {
  // Shared by both panes, so choosing a day in either updates the other.
  const [selected, setSelected] = useState(today);
  // On a closed device the calendar opens as a sheet instead.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [layout, setLayout] = useState<ArrangementLayout | null>(null);
  const [tab, setTab] = useState('steps');
  const openCalendar = useCallback(() => setCalendarOpen(true), []);
  useHeader({
    // Only the steps tab can show the calendar pane, and only once its panes
    // are laid out is it known whether it does.
    showCalendar:
      tab !== 'steps' || (layout !== null && !layout.secondaryVisible),
    onCalendar: openCalendar,
  });
  const icons = useTabIcons();
  return (
    <>
      <StatusBar style="dark" />
      <Tab.Navigator
        labeled={false}
        tabBarActiveTintColor="#ff9500"
        // Material's defaults on Android; iOS keeps the system's material.
        tabBarStyle={Platform.select({
          android: { backgroundColor: colors.background },
        })}
        activeIndicatorColor={colors.selected}
        screenOptions={{ freezeOnBlur: false }}
        screenListeners={({ route }) => ({ focus: () => setTab(route.name) })}
      >
        <Tab.Screen
          name="steps"
          options={{
            title: 'Steps',
            tabBarIcon: icons.steps,
            tabBarButtonTestID: 'tab-steps',
          }}
        >
          {() => (
            <ArrangementView
              style={styles.arrangement}
              axes="horizontal"
              primaryEdge="trailing"
              onArrangementLayoutChange={(next) => {
                setLayout(next);
                // The calendar is on screen now: the sheet would repeat it.
                if (next.secondaryVisible) setCalendarOpen(false);
              }}
            >
              {/* Each pane clears only the system bars it sits under, such
                  as a vertical tab bar beside the dashboard. */}
              <ArrangementView.Primary>
                <SafeAreaView style={styles.pane} edges={paneEdges}>
                  <Dashboard selected={selected} onSelect={setSelected} />
                </SafeAreaView>
              </ArrangementView.Primary>
              <ArrangementView.Secondary>
                <SafeAreaView style={styles.pane} edges={paneEdges}>
                  <HistoryCalendar selected={selected} onSelect={setSelected} />
                </SafeAreaView>
              </ArrangementView.Secondary>
            </ArrangementView>
          )}
        </Tab.Screen>
        <Tab.Screen
          name="calories"
          component={CaloriesTab}
          options={{
            title: 'Calories',
            tabBarIcon: icons.calories,
            tabBarButtonTestID: 'tab-calories',
          }}
        />
        <Tab.Screen
          name="insights"
          component={InsightsTab}
          options={{
            title: 'Insights',
            tabBarIcon: icons.insights,
            tabBarButtonTestID: 'tab-insights',
          }}
        />
      </Tab.Navigator>
      <Modal
        visible={calendarOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCalendarOpen(false)}
      >
        {/* A modal is a separate window, with insets of its own. */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.sheet}>
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
    </>
  );
}

/** Native header buttons: bar button items on iOS, icon buttons on Android. */
function useHeader({
  showCalendar,
  onCalendar,
}: {
  showCalendar: boolean;
  onCalendar: () => void;
}) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    const calendar = {
      label: 'Calendar',
      symbol: 'calendar',
      icon: 'calendar-month-outline',
      onPress: onCalendar,
    } as const;
    const settings = {
      label: 'Settings',
      symbol: 'gearshape',
      icon: 'cog-outline',
      onPress: () => {},
    } as const;
    const buttons = showCalendar ? [calendar, settings] : [settings];
    const options: NativeStackNavigationOptions = {
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      unstable_headerRightItems: () =>
        buttons.map((button) => ({
          type: 'button',
          label: button.label,
          icon: { type: 'sfSymbol', name: button.symbol },
          onPress: button.onPress,
        })),
      headerRight: () => (
        <View style={styles.headerButtons}>
          {buttons.map((button) => (
            <Pressable
              key={button.label}
              accessibilityRole="button"
              accessibilityLabel={button.label}
              onPress={button.onPress}
              hitSlop={8}
            >
              <MaterialDesignIcons
                name={button.icon}
                size={24}
                color={colors.text}
              />
            </Pressable>
          ))}
        </View>
      ),
    };
    navigation.setOptions(options);
  }, [navigation, showCalendar, onCalendar]);
}

type TabIcon = NonNullable<NativeBottomTabNavigationOptions['tabBarIcon']>;

// Each tab's SF Symbol, and the Material Design icon drawn for Android.
const glyphs = {
  steps: ['shoeprints.fill', 'shoe-print'],
  calories: ['flame.fill', 'fire'],
  insights: ['sparkles', 'creation'],
} as const;

/** SF Symbols on iOS; on Android, the same glyphs drawn to images. */
function useTabIcons(): Record<keyof typeof glyphs, TabIcon> {
  const [images, setImages] = useState<Record<string, ImageSourcePropType>>({});
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Promise.all(
      Object.entries(glyphs).map(async ([tab, [, name]]) => [
        tab,
        await MaterialDesignIcons.getImageSource(name, 24, colors.text),
      ])
    ).then((entries) => setImages(Object.fromEntries(entries)));
  }, []);
  const icon =
    (tab: keyof typeof glyphs): TabIcon =>
    () =>
      Platform.OS === 'ios'
        ? { sfSymbol: glyphs[tab][0] }
        : (images[tab] ?? { uri: '' });
  return {
    steps: icon('steps'),
    calories: icon('calories'),
    insights: icon('insights'),
  };
}

const styles = StyleSheet.create({
  arrangement: { flex: 1, backgroundColor: colors.background },
  pane: { flex: 1, backgroundColor: colors.background },
  headerButtons: { flexDirection: 'row', gap: 18 },
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
