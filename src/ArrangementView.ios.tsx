import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import NativeArrangementView from './ArrangementViewNativeComponent';
import NativePane from './ArrangementPaneNativeComponent';
import {
  createHingeStore,
  HingeContext,
  normalizeHinge,
  unavailableHinge,
} from './hinge';
import type { ArrangementViewProps } from './types';
import type { NativeProps } from './ArrangementViewNativeComponent';

export function ArrangementView({
  primary,
  secondary,
  arrangement = 'split',
  axes = 'both',
  observeHinge = true,
  ...props
}: ArrangementViewProps) {
  const [store] = useState(createHingeStore);
  const onNativeHinge = useCallback<NonNullable<NativeProps['onHingeChange']>>(
    (event) => {
      const hinge = normalizeHinge(event.nativeEvent);
      store.update(hinge);
    },
    [store]
  );
  useEffect(() => {
    if (!observeHinge) store.update(unavailableHinge);
  }, [observeHinge, store]);
  return (
    <HingeContext value={store}>
      <NativeArrangementView
        {...props}
        arrangement={arrangement}
        axes={axes}
        observeHinge={observeHinge}
        onHingeChange={onNativeHinge}
      >
        <NativePane
          collapsable={false}
          pointerEvents="box-none"
          style={styles.pane}
        >
          {primary}
        </NativePane>
        <NativePane
          collapsable={false}
          pointerEvents="box-none"
          style={styles.pane}
        >
          {secondary}
        </NativePane>
      </NativeArrangementView>
    </HingeContext>
  );
}
const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});
