import { useEffect, useState } from 'react';
import { Platform, type ImageSourcePropType } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  createNativeBottomTabNavigator,
  type NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { ActivitiesTab } from './ActivitiesTab';
import { colors } from './data';
import { InsightsTab } from './OtherTabs';
import { StepsTab } from './StepsTab';

const Tab = createNativeBottomTabNavigator();

/**
 * A step tracker after a foldable app design: each tab shows one pane on a
 * closed device and two once unfolded, with the primary pane on the trailing
 * side so it stays where the cover display was as the device opens.
 *
 * The tabs and each tab's header buttons are native, so the system places
 * them: a tab bar and navigation bar on most devices, and a vertical column
 * beside the content where the platform puts them there.
 */
export function StepTracker() {
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
      >
        <Tab.Screen
          name="steps"
          component={StepsTab}
          options={{
            title: 'Steps',
            tabBarIcon: icons.steps,
            tabBarButtonTestID: 'tab-steps',
          }}
        />
        <Tab.Screen
          name="activities"
          component={ActivitiesTab}
          options={{
            title: 'Activities',
            tabBarIcon: icons.activities,
            tabBarButtonTestID: 'tab-activities',
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
    </>
  );
}

type TabIcon = NonNullable<NativeBottomTabNavigationOptions['tabBarIcon']>;

// Each tab's SF Symbol, and the Material Design icon drawn for Android.
const glyphs = {
  steps: ['shoeprints.fill', 'shoe-print'],
  activities: ['flame.fill', 'fire'],
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
    activities: icon('activities'),
    insights: icon('insights'),
  };
}
