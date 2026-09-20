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
  arrangement?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  axes?: CodegenTypes.WithDefault<'both' | 'horizontal' | 'vertical', 'both'>;
  observeHinge?: CodegenTypes.WithDefault<boolean, true>;
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
}

export default codegenNativeComponent<NativeProps>('RNArrangementView');
