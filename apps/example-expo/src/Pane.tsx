import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  useHingeChange,
  type Arrangement,
} from 'react-native-arrangement-view';

export interface PaneProps {
  primary: boolean;
  arrangement: Arrangement;
}

/**
 * App content for one slot of the arrangement. It reports the size SwiftUI
 * assigned it and the hinge angle observed by the enclosing ArrangementView.
 */
export function Pane({ primary, arrangement }: PaneProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hinge = useHingeChange();
  const name = primary ? 'Primary' : 'Secondary';
  const id = name.toLowerCase();
  const overlay = primary && arrangement === 'overlay';
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
    setSize({
      width: Math.round(layout.width),
      height: Math.round(layout.height),
    });
  const degrees =
    hinge.angle === null ? null : Math.round((hinge.angle * 180) / Math.PI);

  return (
    <View
      testID={`${id}-pane`}
      onLayout={onLayout}
      pointerEvents={overlay ? 'box-none' : 'auto'}
      style={[
        styles.pane,
        primary ? styles.primary : styles.secondary,
        overlay && styles.overlay,
      ]}
    >
      <View style={[styles.paneHeader, overlay && styles.overlayPanel]}>
        <Text style={styles.paneTitle}>{name}</Text>
        <Text testID={`${id}-dimensions`} style={styles.dimensions}>
          {size.width} × {size.height} pt
        </Text>
        <View style={styles.hingeRow}>
          <Text testID={`${id}-hinge-angle`} style={styles.hingeAngle}>
            {degrees === null ? 'No hinge' : `${degrees}°`}
          </Text>
          <Text testID={`${id}-hinge-status`} style={styles.hingeStatus}>
            {hinge.status}
          </Text>
        </View>
      </View>
    </View>
  );
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
});
