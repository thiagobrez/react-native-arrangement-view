import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHingeChange } from 'react-native-arrangement-view';
import { trails } from './trails';

export interface SidebarProps {
  selectedId: string;
  collapsed: boolean;
  displayMode: string | null;
  onSelect: (id: string) => void;
}

/**
 * The split's primary column: a list of trails, the split's state, and the
 * hinge, which the app's HingeObserver reports outside an ArrangementView.
 */
export function Sidebar({
  selectedId,
  collapsed,
  displayMode,
  onSelect,
}: SidebarProps) {
  const [width, setWidth] = useState(0);
  // Collapsed on the iPhone Duo, the column runs under the navigation items.
  const insets = useSafeAreaInsets();
  const hinge = useHingeChange();
  const degrees =
    hinge.angle === null ? null : Math.round((hinge.angle * 180) / Math.PI);
  return (
    <ScrollView
      testID="split-sidebar"
      style={styles.sidebar}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: styles.content.padding + insets.left,
          paddingRight: styles.content.padding + insets.right,
        },
      ]}
      onLayout={({ nativeEvent }) =>
        setWidth(Math.round(nativeEvent.layout.width))
      }
    >
      <Text style={styles.heading}>Trails</Text>
      {trails.map((trail) => {
        const selected = trail.id === selectedId;
        return (
          <Pressable
            key={trail.id}
            testID={`trail-${trail.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={trail.name}
            onPress={() => onSelect(trail.id)}
            style={({ pressed }) => [
              styles.row,
              (selected || pressed) && styles.rowSelected,
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: trail.color }]} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{trail.name}</Text>
              <Text style={styles.region}>{trail.region}</Text>
            </View>
          </Pressable>
        );
      })}
      <View style={styles.state}>
        <Text testID="split-state" style={styles.stateText}>
          {collapsed
            ? 'Collapsed'
            : `Expanded${displayMode ? ` · ${displayMode}` : ''}`}
        </Text>
        <Text testID="sidebar-width" style={styles.stateText}>
          Sidebar {width} pt wide
        </Text>
        <Text testID="sidebar-hinge" style={styles.stateText}>
          {degrees === null
            ? 'No hinge'
            : `Hinge ${degrees}° · ${hinge.status}`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: { flex: 1, backgroundColor: '#10121a' },
  content: { padding: 12, gap: 4 },
  heading: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  rowSelected: { backgroundColor: '#222637' },
  swatch: { width: 34, height: 34, borderRadius: 10 },
  rowText: { flex: 1, gap: 2 },
  name: { color: 'white', fontSize: 16, fontWeight: '600' },
  region: { color: '#8790ad', fontSize: 13 },
  state: { paddingHorizontal: 8, paddingTop: 18, gap: 4 },
  stateText: { color: '#5d6580', fontSize: 12, fontVariant: ['tabular-nums'] },
});
