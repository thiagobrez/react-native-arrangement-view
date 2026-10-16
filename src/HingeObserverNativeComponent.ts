import {
  codegenNativeComponent,
  type ViewProps,
  type CodegenTypes,
} from 'react-native';

type HingeEvent = Readonly<{
  available: boolean;
  angle: CodegenTypes.Double;
  status: string;
}>;

export interface NativeProps extends ViewProps {
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
  /** How many worklets follow onHingeChange on the UI thread. See src/reanimated. */
  hingeWorklets?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
}

export default codegenNativeComponent<NativeProps>('RNHingeObserver');
