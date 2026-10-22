import { StyleSheet } from 'react-native';
import NativeArrangementView from './ArrangementViewNativeComponent';
import NativePane from './ArrangementPaneNativeComponent';
import { HingeContext, useHingeStore } from './hinge';
import { LayoutContext, useLayoutStore, usePanesChange } from './layout';
import { resolvePrimaryEdge } from './primaryEdge';
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
  primaryEdge,
  onArrangementLayoutChange,
  // Android only: SwiftUI has its own rules for hinges and window sizes.
  hingePolicy: _hingePolicy,
  hingeGap: _hingeGap,
  ...props
}: ArrangementViewProps) {
  const [store, onHingeChange] = useHingeStore();
  const layoutStore = useLayoutStore(onArrangementLayoutChange);
  const onPanesChange = usePanesChange(layoutStore);
  const { primary, secondary, problems } = resolveSlots(children);
  warnOnce(problems);
  const edge = resolvePrimaryEdge(primaryEdge);
  warnOnce(edge.problems);
  return (
    <HingeContext value={store}>
      <LayoutContext value={layoutStore}>
        <NativeArrangementView
          {...props}
          arrangement={arrangement}
          axes={axes}
          primaryEdge={edge.horizontal}
          primaryVerticalEdge={edge.vertical}
          onHingeChange={onHingeChange}
          onPanesChange={onPanesChange}
        >
          {/* The native view assigns panes by index: primary is always first. */}
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
      </LayoutContext>
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
