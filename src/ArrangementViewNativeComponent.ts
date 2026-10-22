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

export interface NativeProps extends ViewProps {
  arrangement?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  axes?: CodegenTypes.WithDefault<'both' | 'horizontal' | 'vertical', 'both'>;
  primaryEdge?: CodegenTypes.WithDefault<
    'auto' | 'leading' | 'trailing',
    'auto'
  >;
  primaryVerticalEdge?: CodegenTypes.WithDefault<
    'auto' | 'top' | 'bottom',
    'auto'
  >;
  /** Android only: which hinges the panes keep clear of. */
  hingePolicy?: CodegenTypes.WithDefault<
    'avoidSeparating' | 'alwaysAvoid' | 'neverAvoid',
    'avoidSeparating'
  >;
  /** Android only: the space in dp between the panes around an avoided hinge. */
  hingeGap?: CodegenTypes.WithDefault<CodegenTypes.Double, 24>;
  onHingeChange?: CodegenTypes.DirectEventHandler<HingeEvent>;
  onPanesChange?: CodegenTypes.DirectEventHandler<PanesEvent>;
}

export default codegenNativeComponent<NativeProps>('RNArrangementView');
