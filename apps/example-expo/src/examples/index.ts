import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { StepTracker } from './step-tracker/StepTracker';
import { TentPosture } from './tent-posture/TentPosture';
import { VideoPlayer } from './video-player/VideoPlayer';
import { SplitViewExample } from './split-view/SplitViewExample';
import { NativeComponents } from './native-components/NativeComponents';

export interface Example {
  /** Route name; also used for testIDs. */
  name: string;
  title: string;
  component: ComponentType;
  options?: NativeStackNavigationOptions;
  /** The only platform the example runs on, marked in the list. */
  platform?: 'ios' | 'android';
}

const allExamples: Example[] = [
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
  {
    name: 'split-view',
    title: 'Split view',
    component: SplitViewExample,
    options: { headerTransparent: true, headerTitle: '' },
    // react-native-screens' Split is a UISplitViewController.
    platform: 'ios',
  },
  {
    name: 'tent-posture',
    title: 'Tent posture',
    component: TentPosture,
  },
  {
    name: 'native-components',
    title: 'Native components',
    component: NativeComponents,
  },
];

export const examples = allExamples.filter(
  (example) => !example.platform || example.platform === Platform.OS
);
