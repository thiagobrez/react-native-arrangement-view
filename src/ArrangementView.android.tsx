import { useCallback, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import NativeArrangementView from './ArrangementViewNativeComponent';
import { arrange, type Frame, type Geometry } from './arrange';
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
  hingePolicy,
  hingeGap,
  ...props
}: ArrangementViewProps) {
  const [store, onHingeChange] = useHingeStore(observeHinge);
  // Android has no system arrangement container. The native view reports its
  // content box, its window and the fold, and the panes stay hidden until it
  // has: arranging them any sooner would flash a layout that ignores the fold.
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const onGeometryChange = useCallback<
    NonNullable<NativeProps['onGeometryChange']>
  >(
    // Codegen types the fold orientation as a plain string.
    (event) => setGeometry(event.nativeEvent as Geometry),
    []
  );
  const frames =
    geometry &&
    arrange(geometry, {
      arrangement,
      axes,
      hingePolicy,
      hingeGap,
      rtl: I18nManager.isRTL,
    });
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
        {/* Fills the content box, so pane frames are relative to it and not
            to the border edge where Yoga puts absolute children. */}
        <View style={styles.content}>
          {/* Primary renders last so that it is in front when the panes overlay. */}
          <View
            collapsable={false}
            pointerEvents="box-none"
            style={[styles.pane, paneStyle(frames?.secondary)]}
          >
            {secondary}
          </View>
          <View
            collapsable={false}
            pointerEvents="box-none"
            style={[styles.pane, paneStyle(frames?.primary)]}
          >
            {primary}
          </View>
        </View>
      </NativeArrangementView>
    </HingeContext>
  );
}
ArrangementView.Primary = ArrangementPrimary;
ArrangementView.Secondary = ArrangementSecondary;

// Frames are physical. In RTL, Yoga swaps `left` and `right` before layout (see
// I18nManager.doLeftAndRightSwapInRTL), so a physical `left` must be written
// as `right` for it to come out where arrange() put it.
const mirrored = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL;
function paneStyle(frame: Frame | null | undefined) {
  if (!frame) return styles.hidden;
  const { left, ...rest } = frame;
  return mirrored ? { ...rest, right: left } : frame;
}

const styles = StyleSheet.create({
  content: { flex: 1, alignSelf: 'stretch' },
  pane: { position: 'absolute', overflow: 'hidden' },
  // A hidden pane keeps its React tree mounted.
  hidden: { display: 'none' },
});
