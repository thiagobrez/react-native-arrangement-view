import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules';

export interface NitroPaneHostProps extends HybridViewProps {
  color: string;
}

export type NitroPaneHost = HybridView<
  NitroPaneHostProps,
  HybridViewMethods,
  { android: 'kotlin' }
>;
