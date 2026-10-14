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
}

export default codegenNativeComponent<NativeProps>('RNHingeObserver');
