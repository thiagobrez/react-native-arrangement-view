import { StyleSheet, View } from 'react-native';
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
          <View style={styles.content}>
            {/* Primary renders last so that it is in front when the panes overlay. */}
            <NativePane
              collapsable={false}
              pointerEvents="box-none"
              style={styles.pane}
            >
              {secondary}
            </NativePane>
            <NativePane
              collapsable={false}
              pointerEvents="box-none"
              style={styles.pane}
            >
              {primary}
            </NativePane>
          </View>
        </NativeArrangementView>
      </LayoutContext>
    </HingeContext>
  );
}
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;

const styles = StyleSheet.create({
  content: { flex: 1, alignSelf: 'stretch' },
  pane: { position: 'absolute', overflow: 'hidden' },
});
