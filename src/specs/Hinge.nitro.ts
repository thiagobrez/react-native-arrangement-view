import type { HybridObject } from 'react-native-nitro-modules';

export interface HingeSample {
  available: boolean;
  angle: number;
  status: string;
  t: number;
}

export interface Hinge extends HybridObject<{ android: 'kotlin' }> {
  readonly current: HingeSample;
  nanoTime(): number;
  addListener(listener: (sample: HingeSample) => void): () => void;
}
