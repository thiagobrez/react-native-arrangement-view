import type { HybridObject } from 'react-native-nitro-modules';

export interface HingeSample {
  available: boolean;
  /** Radians, or -1 while the sensor has not reported. */
  angle: number;
  status: string;
  /** System.nanoTime() when the sample was taken. */
  t: number;
}

export interface Hinge extends HybridObject<{ android: 'kotlin' }> {
  readonly current: HingeSample;
  nanoTime(): number;
  addListener(listener: (sample: HingeSample) => void): () => void;
}
