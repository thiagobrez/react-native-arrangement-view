import type { ComponentType } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BookReader } from './book-reader/BookReader';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { StepTracker } from './step-tracker/StepTracker';

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
    options: { headerShown: false },
  },
  {
    name: 'book-reader',
    title: 'Book reader',
    component: BookReader,
  },
];
