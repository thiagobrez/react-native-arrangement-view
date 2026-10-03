import type { ComponentType } from 'react';
import { FeaturesDemo } from './features-demo/FeaturesDemo';
import { StepTracker } from './step-tracker/StepTracker';

export interface Example {
  /** Route name; also used for testIDs. */
  name: string;
  title: string;
  component: ComponentType;
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
  },
];
