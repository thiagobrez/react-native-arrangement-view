import { StyleSheet } from 'react-native';
import NativeHingeObserver from './HingeObserverNativeComponent';
import { HingeContext, useHingeStore } from './hinge';
import type { HingeObserverProps } from './types';

export function HingeObserver({ children }: HingeObserverProps) {
  const [store, onHingeChange] = useHingeStore();
  return (
    <HingeContext value={store}>
      <NativeHingeObserver
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.observer}
        onHingeChange={onHingeChange}
      />
      {children}
    </HingeContext>
  );
}
HingeObserver satisfies typeof import('./HingeObserver').HingeObserver;

const styles = StyleSheet.create({
  observer: { position: 'absolute', width: 0, height: 0 },
});
