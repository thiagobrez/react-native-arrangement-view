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

type GeometryEvent = Readonly<{
  width: CodegenTypes.Double;
  height: CodegenTypes.Double;
  fold?: Readonly<{
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
}>;

export interface NativeProps extends ViewProps {
  /** iOS only: SwiftUI arranges the panes. On Android, arrange.ts does. */
  arrangement?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  /** iOS only, as above. */
  axes?: CodegenTypes.WithDefault<'both' | 'horizontal' | 'vertical', 'both'>;
  observeHinge?: CodegenTypes.WithDefault<boolean, true>;
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
  /** Android only: the size and separating fold that arrange.ts lays the panes out by. */
  onGeometryChange?: CodegenTypes.DirectEventHandler<GeometryEvent>;
}

export default codegenNativeComponent<NativeProps>('RNArrangementView');
