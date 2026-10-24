import {
  codegenNativeComponent,
  type ViewProps,
  type CodegenTypes,
} from 'react-native';

type HingeEvent = Readonly<{
  available: boolean;
  angle: CodegenTypes.Double;
  status: string;
  // Codegen has no optional objects, so a missing fold is flagged and its rect
  // is zeroed.
  hasFold: boolean;
  fold: Readonly<{
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
}>;

export interface NativeProps extends ViewProps {
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
}

export default codegenNativeComponent<NativeProps>('RNHingeObserver');
