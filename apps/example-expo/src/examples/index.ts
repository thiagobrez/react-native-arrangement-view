import type { ComponentType } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { VideoPlayer } from './video-player/VideoPlayer';

export interface Example {
  /** Route name; also used for testIDs. */
  name: string;
  title: string;
  component: ComponentType;
  /** Extra screen options, applied over the title. */
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
