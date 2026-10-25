import {
  codegenNativeComponent,
  type ViewProps,
  type CodegenTypes,
} from 'react-native';

// Codegen needs event objects written out, and has no optional values, so
// strings are '' and insets -1 where the platform has none. Folds are whole,
// in the view's coordinates. parseSystemLayout clips them.
export type SystemLayoutEvent = Readonly<{
  width: CodegenTypes.Double;
  height: CodegenTypes.Double;
  hasHinge: boolean;
  keepsLines: boolean;
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
  barInsets: Readonly<{
    top: CodegenTypes.Double;
    bottom: CodegenTypes.Double;
    leading: CodegenTypes.Double;
    trailing: CodegenTypes.Double;
  }>;
}>;

export interface NativeProps extends ViewProps {
  barExtentTop?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  barExtentBottom?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  barExtentLeading?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  barExtentTrailing?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  onSystemLayoutChange?: CodegenTypes.DirectEventHandler<SystemLayoutEvent>;
}

export default codegenNativeComponent<NativeProps>('RNSystemLayoutObserver');
