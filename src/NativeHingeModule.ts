import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

export type HingeModuleSample = {
  available: boolean;
  angle: CodegenTypes.Double;
  status: string;
  t: CodegenTypes.Double;
};

export interface Spec extends TurboModule {
  readonly onHinge: CodegenTypes.EventEmitter<HingeModuleSample>;
  start(): void;
  stop(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNHingeModule');
