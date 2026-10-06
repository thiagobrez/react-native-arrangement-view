import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrangementView, useHingeChange } from 'react-native-arrangement-view';
import type { Trail } from './trails';

/**
 * The split's secondary column. Its ArrangementView only gets the column's
 * width, so whether it splits depends on where the column sits on the hinge.
 */
export function Detail({ trail }: { trail: Trail }) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ArrangementView style={styles.arrangement} arrangement="split">
        <ArrangementView.Primary>
          <Overview trail={trail} />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <Notes trail={trail} />
        </ArrangementView.Secondary>
      </ArrangementView>
    </SafeAreaView>
  );
}

function Overview({ trail }: { trail: Trail }) {
  const hinge = useHingeChange();
  const degrees =
    hinge.angle === null ? null : Math.round((hinge.angle * 180) / Math.PI);
  return (
    <Measured id="overview" style={{ backgroundColor: trail.color }}>
      <Text style={styles.region}>{trail.region}</Text>
      <Text testID="overview-title" style={styles.title}>
        {trail.name}
      </Text>
      <View style={styles.stats}>
        <Stat label="Distance" value={`${trail.distanceKm} km`} />
        <Stat label="Climb" value={`${trail.elevationM} m`} />
        <Stat
          label="Hinge"
          value={degrees === null ? 'None' : `${degrees}°`}
          testID="overview-hinge"
        />
      </View>
      <Text testID="overview-hinge-status" style={styles.caption}>
        {hinge.status}
      </Text>
    </Measured>
  );
}

function Notes({ trail }: { trail: Trail }) {
  return (
    <Measured id="notes" style={styles.notes}>
      <Text style={styles.sectionTitle}>Notes</Text>
      {trail.notes.map((note) => (
        <View key={note} style={styles.note}>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ))}
    </Measured>
  );
}

function Stat({
  label,
  value,
  testID,
}: {
  label: string;
  value: string;
  testID?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text testID={testID} style={styles.statValue}>
        {value}
      </Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

/** A pane that prints the size its ArrangementView gave it. */
function Measured({
  id,
  style,
  children,
}: {
  id: string;
  style: object;
  children: React.ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
    setSize({
      width: Math.round(layout.width),
      height: Math.round(layout.height),
    });
  return (
    <View
      testID={`${id}-pane`}
      onLayout={onLayout}
      style={[styles.pane, style]}
    >
      {children}
      <Text testID={`${id}-dimensions`} style={styles.dimensions}>
        {size.width} × {size.height} pt
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  arrangement: { flex: 1, overflow: 'hidden' },
  pane: { flex: 1, padding: 22, gap: 10 },
  notes: { backgroundColor: '#1a1d2a' },
  region: { color: '#ddd9ef', fontSize: 13, fontWeight: '600' },
  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  stats: { flexDirection: 'row', gap: 22, paddingTop: 8 },
  stat: { gap: 2 },
  statValue: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  caption: { color: '#e2d9ff', fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
  note: { padding: 14, borderRadius: 14, backgroundColor: '#222637' },
  noteText: { color: '#d3d8ea', fontSize: 15 },
  dimensions: {
    color: '#ffffffa0',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginTop: 'auto',
  },
});
