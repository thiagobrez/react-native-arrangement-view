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

// Codegen needs event objects written out, and its C++ structs have no
// optional fields, so a hidden secondary pane is flagged. `fold` below can be
// optional only because Android builds that event by hand.
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

/**
 * On iOS, SwiftUI arranges the panes: it takes `arrangement`, `axes` and
 * `primaryEdge`, and reports where it put them in `onPanesChange`. On
 * Android, arrange.ts arranges them from what `onGeometryChange` reports.
 */
export interface NativeProps extends ViewProps {
  arrangement?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  axes?: CodegenTypes.WithDefault<'both' | 'horizontal' | 'vertical', 'both'>;
  /** `auto` keeps SwiftUI's placement. */
  primaryEdge?: CodegenTypes.WithDefault<
    'auto' | 'leading' | 'trailing',
    'auto'
  >;
  observeHinge?: CodegenTypes.WithDefault<boolean, true>;
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
  onPanesChange?: CodegenTypes.DirectEventHandler<PanesEvent>;
  onGeometryChange?: CodegenTypes.DirectEventHandler<GeometryEvent>;
}

export default codegenNativeComponent<NativeProps>('RNArrangementView');
