import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import NativeSystemLayoutObserver, {
  type SystemLayoutEvent,
} from './SystemLayoutObserverNativeComponent';
import {
  createSystemLayoutStore,
  parseFoldThreshold,
  SystemLayoutContext,
} from './systemLayout';
import type { SystemLayoutObserverProps } from './types';

export function SystemLayoutObserver({
  children,
  onSystemLayoutChange,
  barExtents,
  foldThreshold,
}: SystemLayoutObserverProps) {
  const threshold = parseFoldThreshold(foldThreshold);
  const [store] = useState(createSystemLayoutStore);
  const onNativeChange = useCallback(
    (event: { nativeEvent: SystemLayoutEvent }) => {
      const layout = store.update(event.nativeEvent);
      if (layout) onSystemLayoutChange?.(layout);
    },
    [store, onSystemLayoutChange]
  );
  return (
    <SystemLayoutContext value={store}>
      <NativeSystemLayoutObserver
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
        barExtentTop={barExtents?.top ?? -1}
        barExtentBottom={barExtents?.bottom ?? -1}
        barExtentLeading={barExtents?.leading ?? -1}
        barExtentTrailing={barExtents?.trailing ?? -1}
        halfOpenAtDegrees={threshold.halfOpenAtDegrees}
        flatAtDegrees={threshold.flatAtDegrees}
        onSystemLayoutChange={onNativeChange}
      />
      {children}
    </SystemLayoutContext>
  );
}
SystemLayoutObserver satisfies typeof import('./SystemLayoutObserver').SystemLayoutObserver;
