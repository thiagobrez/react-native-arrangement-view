import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
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
];
