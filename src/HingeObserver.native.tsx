import { StyleSheet } from 'react-native';
import NativeHingeObserver from './HingeObserverNativeComponent';
import { HingeContext, useHingeStore } from './hinge';
import type { HingeObserverProps } from './types';

/**
 * Observes the hinge for `useHingeChange` calls anywhere among its children.
 * Its native view is an empty sibling of the children, so it takes no space
 * and no touches; it only tells the platform which window to observe.
 */
export function HingeObserver({ children }: HingeObserverProps) {
  const [store, onHingeChange] = useHingeStore(true);
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

const styles = StyleSheet.create({
  observer: { position: 'absolute', width: 0, height: 0 },
});
