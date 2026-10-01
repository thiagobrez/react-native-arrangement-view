import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import NativeArrangementView from './ArrangementViewNativeComponent';
import NativePane from './ArrangementPaneNativeComponent';
import { HingeContext, useHingeStore } from './hinge';
import { describeLayout, LayoutContext, useLayoutStore } from './layout';
import {
  ArrangementPrimary,
  ArrangementSecondary,
  resolveSlots,
  warnOnce,
} from './slots';
import type { ArrangementViewProps } from './types';
import type { NativeProps, NativeRect } from './ArrangementViewNativeComponent';

export function ArrangementView({
  children,
  arrangement = 'split',
  axes = 'both',
  primaryEdge,
  observeHinge = true,
  onArrangementLayoutChange,
  // Android only: SwiftUI has its own rules for hinges and window sizes.
  hingePolicy: _hingePolicy,
  hingeGap: _hingeGap,
  ...props
}: ArrangementViewProps) {
  const [store, onHingeChange] = useHingeStore(observeHinge);
  // The native view assigns panes by index, so primary is always emitted first
  // regardless of the order the slots were written in.
  const layoutStore = useLayoutStore(onArrangementLayoutChange);
  const onPanesChange = useCallback<NonNullable<NativeProps['onPanesChange']>>(
    ({
      nativeEvent: { primary: first, secondary: second, secondaryVisible },
    }) =>
      layoutStore.update(
        describeLayout({
          primary: frame(first),
          secondary: secondaryVisible ? frame(second) : null,
        })
      ),
    [layoutStore]
  );
  const { primary, secondary, problems } = resolveSlots(children);
  warnOnce(problems);
  return (
    <HingeContext value={store}>
      <LayoutContext value={layoutStore}>
        <NativeArrangementView
          {...props}
          arrangement={arrangement}
          axes={axes}
          primaryEdge={primaryEdge}
          observeHinge={observeHinge}
          onHingeChange={onHingeChange}
          onPanesChange={onPanesChange}
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
      </LayoutContext>
    </HingeContext>
  );
}
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;

const frame = ({ x, y, width, height }: NativeRect) => ({
  left: x,
  top: y,
  width,
  height,
});

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});
