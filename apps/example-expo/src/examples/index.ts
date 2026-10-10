import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BedsideClock } from './bedside-clock/BedsideClock';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { StepTracker } from './step-tracker/StepTracker';
import { VideoPlayer } from './video-player/VideoPlayer';
import { SplitViewExample } from './split-view/SplitViewExample';

export interface Example {
  /** Route name; also used for testIDs. */
  name: string;
  title: string;
  component: ComponentType;
  /** Options for the example's screen in the examples stack. */
  options?: NativeStackNavigationOptions;
}

/** Examples shown on the home screen, in display order. */
export const examples: Example[] = [
  {
    name: 'features-demo',
    title: 'Features demo',
    component: FeaturesDemo,
  },
  {
    name: 'step-tracker',
    title: 'Step tracker',
    component: StepTracker,
    // Each of its tabs has its own header, as in the app it's copied from.
    options: { headerShown: false, statusBarStyle: 'dark' },
  },
  {
    name: 'video-player',
    title: 'Video player',
    component: VideoPlayer,
    options: {
      headerShown: false,
      statusBarHidden: true,
      // Swiping back would take over drags on the seek bar.
      gestureEnabled: false,
      autoHideHomeIndicator: true,
    },
  },
  // react-native-screens' Split is a UISplitViewController, so iOS only.
  ...(Platform.OS === 'ios'
    ? [
        {
          name: 'split-view',
          title: 'Split view',
          component: SplitViewExample,
          options: { headerTransparent: true, headerTitle: '' },
        },
      ]
    : []),
  {
    name: 'bedside-clock',
    title: 'Bedside clock',
    component: BedsideClock,
  },
];
