import { codegenNativeComponent, type ViewProps } from 'react-native';

export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('RNArrangementPane', {
  interfaceOnly: true,
});
