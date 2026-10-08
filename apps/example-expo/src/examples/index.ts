import type { ComponentType } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { StepTracker } from './step-tracker/StepTracker';
import { VideoPlayer } from './video-player/VideoPlayer';

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
      autoHideHomeIndicator: true,
    },
  },
];
