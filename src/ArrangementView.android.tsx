import { useCallback, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import NativeArrangementView from './ArrangementViewNativeComponent';
import { arrange, type Geometry } from './arrange';
import { HingeContext, useHingeStore } from './hinge';
import {
  ArrangementPrimary,
  ArrangementSecondary,
  resolveSlots,
  warnOnce,
} from './slots';
import type { ArrangementViewProps } from './types';
import type { NativeProps } from './ArrangementViewNativeComponent';

export function ArrangementView({
  children,
  arrangement = 'split',
  axes = 'both',
  observeHinge = true,
  ...props
}: ArrangementViewProps) {
  const [store, onHingeChange] = useHingeStore(observeHinge);
  // Android has no system arrangement container. The native view reports its
  // size and fold, and the panes stay hidden until it has: arranging them any
  // sooner would flash a layout that ignores the fold.
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const onGeometryChange = useCallback<
    NonNullable<NativeProps['onGeometryChange']>
  >((event) => setGeometry(event.nativeEvent), []);
  const frames =
    geometry && arrange(geometry, arrangement, axes, I18nManager.isRTL);
  const { primary, secondary, problems } = resolveSlots(children);
  warnOnce(problems);
  return (
    <HingeContext value={store}>
      <NativeArrangementView
        {...props}
        observeHinge={observeHinge}
        onHingeChange={onHingeChange}
        onGeometryChange={onGeometryChange}
      >
        {/* Primary renders last so that it is in front when the panes overlay. */}
        <View
          collapsable={false}
          pointerEvents="box-none"
          style={[styles.pane, frames?.secondary ?? styles.hidden]}
        >
          {secondary}
        </View>
        <View
          collapsable={false}
          pointerEvents="box-none"
          style={[styles.pane, frames?.primary ?? styles.hidden]}
        >
          {primary}
        </View>
      </NativeArrangementView>
    </HingeContext>
  );
}
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;

const styles = StyleSheet.create({
  pane: { position: 'absolute', overflow: 'hidden' },
  // A hidden pane keeps its React tree mounted.
  hidden: { display: 'none' },
});
