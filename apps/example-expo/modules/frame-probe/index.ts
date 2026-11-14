import { requireOptionalNativeModule } from 'expo';

interface FrameProbe {
  /** Logs every frame the window draws until stop(), with the views these nativeIDs name. */
  start(arrangement: string, primary: string, secondary: string): Promise<void>;
  stop(): Promise<void>;
  /** Logs the label with the time, from the JavaScript thread. */
  mark(label: 'hold' | 'release'): void;
}

/** Null on iOS, which has no probe. */
export const FrameProbe = requireOptionalNativeModule<FrameProbe>('FrameProbe');
