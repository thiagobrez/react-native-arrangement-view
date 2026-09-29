import type { ComponentType } from 'react';
import { FeaturesDemo } from './features-demo/FeaturesDemo';

export interface Example {
  /** Route name; also used for testIDs. */
  name: string;
  title: string;
  description: string;
  component: ComponentType;
}

/** Examples shown on the home screen, in display order. */
export const examples: Example[] = [
  {
    name: 'features-demo',
    title: 'Features demo',
    description:
      'Toggle split and overlay arrangements and axes, and watch pane sizes and the hinge angle update live.',
    component: FeaturesDemo,
  },
];
