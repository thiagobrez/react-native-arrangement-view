import { StyleSheet } from 'react-native';
import NativeArrangementView from './ArrangementViewNativeComponent';
import NativePane from './ArrangementPaneNativeComponent';
import { HingeContext, useHingeStore } from './hinge';
import {
  ArrangementPrimary,
  ArrangementSecondary,
  resolveSlots,
  warnOnce,
} from './slots';
import type { ArrangementViewProps } from './types';

export function ArrangementView({
  children,
  arrangement = 'split',
  axes = 'both',
  observeHinge = true,
  ...props
}: ArrangementViewProps) {
  const [store, onHingeChange] = useHingeStore(observeHinge);
  // The native view assigns panes by index, so primary is always emitted first
  // regardless of the order the slots were written in.
  const { primary, secondary, problems } = resolveSlots(children);
  warnOnce(problems);
  return (
    <HingeContext value={store}>
      <NativeArrangementView
        {...props}
        arrangement={arrangement}
        axes={axes}
        observeHinge={observeHinge}
        onHingeChange={onHingeChange}
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
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});
