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

// Codegen needs event objects written out, and has no optional ones, so a
// hidden secondary pane is flagged.
type PanesEvent = Readonly<{
  primary: Readonly<{
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
  secondary: Readonly<{
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
  secondaryVisible: boolean;
}>;
export type NativeRect = PanesEvent['primary'];

type GeometryEvent = Readonly<{
  width: CodegenTypes.Double;
  height: CodegenTypes.Double;
  window: Readonly<{
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
  fold?: Readonly<{
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
    orientation: string;
    separating: boolean;
    halfOpened: boolean;
  }>;
}>;

export interface NativeProps extends ViewProps {
  /** iOS only: SwiftUI arranges the panes. On Android, arrange.ts does. */
  arrangement?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  /** iOS only, as above. */
  axes?: CodegenTypes.WithDefault<'both' | 'horizontal' | 'vertical', 'both'>;
  /** iOS only, as above. `auto` keeps SwiftUI's placement. */
  primaryEdge?: CodegenTypes.WithDefault<
    'auto' | 'leading' | 'trailing',
    'auto'
  >;
  observeHinge?: CodegenTypes.WithDefault<boolean, true>;
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
  /** iOS only: where SwiftUI put the panes. On Android, arrange.ts knows. */
  onPanesChange?: CodegenTypes.DirectEventHandler<PanesEvent>;
  /** Android only: the sizes and fold that arrange.ts lays the panes out by. */
  onGeometryChange?: CodegenTypes.DirectEventHandler<GeometryEvent>;
}

export default codegenNativeComponent<NativeProps>('RNArrangementView');
