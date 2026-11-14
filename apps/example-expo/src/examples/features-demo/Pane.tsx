import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SystemLayoutObserver,
  useArrangementLayout,
  useHingeChange,
  useSystemLayout,
  type Arrangement,
  type ArrangementLayout,
  type Fold,
  type SystemLayout,
} from 'react-native-arrangement-view';

const BAR_EXTENTS = { bottom: 44 };

export interface PaneProps {
  primary: boolean;
  arrangement: Arrangement;
}

export function Pane({ primary, arrangement }: PaneProps) {
  const name = primary ? 'Primary' : 'Secondary';
  const overlay = primary && arrangement === 'overlay';

  return (
    <View
      testID={`${name.toLowerCase()}-pane`}
      pointerEvents={overlay ? 'box-none' : 'auto'}
      style={[
        styles.pane,
        primary ? styles.primary : styles.secondary,
        overlay && styles.overlay,
      ]}
    >
      <SystemLayoutObserver barExtents={BAR_EXTENTS}>
        <PaneHeader name={name} overlay={overlay} />
      </SystemLayoutObserver>
    </View>
  );
}

function PaneHeader({ name, overlay }: { name: string; overlay: boolean }) {
  const layout = useSystemLayout();
  const hinge = useHingeChange();
  const arrangementLayout = useArrangementLayout();
  const [taps, setTaps] = useState(0);
  const id = name.toLowerCase();
  const angle = hinge?.angle ?? null;
  const degrees = angle === null ? null : Math.round((angle * 180) / Math.PI);

  return (
    <View style={[styles.paneHeader, overlay && styles.overlayPanel]}>
      <Text style={styles.paneTitle}>{name}</Text>
      <Text testID={`${id}-dimensions`} style={styles.dimensions}>
        {layout
          ? `${Math.round(layout.width)} × ${Math.round(layout.height)} pt`
          : 'Size unknown'}
      </Text>
      <View style={styles.hingeRow}>
        <Text testID={`${id}-hinge-angle`} style={styles.hingeAngle}>
          {degrees === null ? 'No hinge' : `${degrees}°`}
        </Text>
        <Text testID={`${id}-hinge-status`} style={styles.hingeStatus}>
          {hinge?.status}
        </Text>
      </View>
      <Text testID={`${id}-layout`} style={styles.dimensions}>
        {describe(arrangementLayout)}
      </Text>
      {layout && <SystemLayoutValues id={id} layout={layout} />}
      <Pressable
        testID={`${id}-tap`}
        accessibilityRole="button"
        onPress={() => setTaps((count) => count + 1)}
        style={styles.tap}
      >
        <Text style={styles.tapText}>Taps: {taps}</Text>
      </Pressable>
    </View>
  );
}

function SystemLayoutValues({
  id,
  layout,
}: {
  id: string;
  layout: SystemLayout;
}) {
  const { top, right, bottom, left } = layout.safeArea;
  return (
    <View testID={`${id}-system-layout`} style={styles.values}>
      <Value
        name="safeArea"
        value={`top ${twoDecimals(top)}, right ${twoDecimals(right)}, bottom ${twoDecimals(bottom)}, left ${twoDecimals(left)}`}
      />
      {layout.folds.length === 0 ? (
        <Value name="folds" value="none" />
      ) : (
        layout.folds.map((fold, index) => (
          <Value
            key={index}
            name={`folds[${index}]`}
            value={describeFold(fold)}
          />
        ))
      )}
      <Value
        name="occlusions"
        value={
          layout.occlusions.length === 0
            ? 'none'
            : layout.occlusions.map(describeRect).join('; ')
        }
      />
      <View style={styles.traits}>
        <Value
          name="horizontalSizeClass"
          value={String(layout.horizontalSizeClass)}
        />
        <Value name="verticalBarEdge" value={String(layout.verticalBarEdge)} />
        <Value
          name="barInsets.bottom"
          value={
            layout.barInsets.bottom === undefined
              ? 'none'
              : twoDecimals(layout.barInsets.bottom)
          }
        />
      </View>
    </View>
  );
}

function Value({ name, value }: { name: string; value: string }) {
  return (
    <Text style={styles.value}>
      <Text style={styles.valueName}>{name} </Text>
      {value}
    </Text>
  );
}

function describeFold(fold: Fold) {
  return [
    describeRect(fold),
    fold.orientation,
    fold.separating ? 'separating' : 'not separating',
    ...(fold.state ? [fold.state] : []),
    `window x ${twoDecimals(fold.window.x)}, y ${twoDecimals(fold.window.y)}`,
  ].join(', ');
}

function describeRect(rect: SystemLayout['occlusions'][number]) {
  return `x ${twoDecimals(rect.x)}, y ${twoDecimals(rect.y)}, ${twoDecimals(rect.width)} × ${twoDecimals(rect.height)}`;
}

function twoDecimals(value: number) {
  return String(Number(value.toFixed(2)));
}

function describe(layout: ArrangementLayout | null) {
  if (!layout) return 'Layout unknown';
  if (!layout.secondaryVisible) return 'Primary only';
  if (!layout.axis) return 'Overlapping';
  return layout.axis === 'horizontal' ? 'Side by side' : 'Stacked';
}

const styles = StyleSheet.create({
  pane: { flex: 1 },
  primary: { backgroundColor: '#423678' },
  secondary: { backgroundColor: '#173f4a' },
  overlay: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 18,
  },
  paneHeader: { padding: 22, gap: 11 },
  overlayPanel: { backgroundColor: '#423678ed', borderRadius: 22, padding: 20 },
  paneTitle: {
    color: 'white',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  dimensions: { color: '#ddd9ef', fontSize: 12, fontVariant: ['tabular-nums'] },
  hingeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  hingeAngle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  hingeStatus: { color: '#e2d9ff', fontSize: 14, fontWeight: '600' },
  values: {
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#00000033',
  },
  traits: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 3 },
  value: {
    color: '#f4f2fb',
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
  valueName: { color: '#aaa3c9', fontWeight: '600' },
  tap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff26',
  },
  tapText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
