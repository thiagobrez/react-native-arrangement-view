import {
  codegenNativeComponent,
  type ViewProps,
  type CodegenTypes,
} from 'react-native';

// Codegen needs event objects written out, and has no optional values, so
// strings are '' and insets -1 where the platform has none.
export type SystemLayoutEvent = Readonly<{
  width: CodegenTypes.Double;
  height: CodegenTypes.Double;
  keepsLines: boolean;
  scale: CodegenTypes.Double;
  safeArea: Readonly<{
    top: CodegenTypes.Double;
    right: CodegenTypes.Double;
    bottom: CodegenTypes.Double;
    left: CodegenTypes.Double;
  }>;
  folds: {
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
    window: {
      x: CodegenTypes.Double;
      y: CodegenTypes.Double;
      width: CodegenTypes.Double;
      height: CodegenTypes.Double;
    };
    separating: boolean;
    state: string;
  }[];
  occlusions: {
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }[];
  horizontalSizeClass: string;
  verticalBarEdge: string;
  barInsets: Readonly<{ bottom: CodegenTypes.Double }>;
}>;

export interface NativeProps extends ViewProps {
  barExtentBottom?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  onSystemLayoutChange?: CodegenTypes.DirectEventHandler<SystemLayoutEvent>;
}

export default codegenNativeComponent<NativeProps>('RNSystemLayoutObserver');
