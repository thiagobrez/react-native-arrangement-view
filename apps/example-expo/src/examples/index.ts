import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { StepTracker } from './step-tracker/StepTracker';
import { TentPosture } from './tent-posture/TentPosture';
import { VideoPlayer } from './video-player/VideoPlayer';
import { SplitViewExample } from './split-view/SplitViewExample';
import { NativeComponents } from './native-components/NativeComponents';
import { FoldControls } from './fold-controls/FoldControls';

export interface Example {
  name: string;
  title: string;
  component: ComponentType;
  options?: NativeStackNavigationOptions;
  platform?: 'ios' | 'android';
}

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
  ...(Platform.OS === 'ios'
    ? [
        {
          name: 'split-view',
          title: 'Split view',
          component: SplitViewExample,
          options: { headerTransparent: true, headerTitle: '' },
          platform: 'ios' as const,
        },
      ]
    : []),
  {
    name: 'tent-posture',
    title: 'Tent posture',
    component: TentPosture,
    platform: 'ios',
  },
  {
    name: 'native-components',
    title: 'Native components',
    component: NativeComponents,
  },
  {
    name: 'fold-controls',
    title: 'Controls beside the fold',
    component: FoldControls,
  },
];
