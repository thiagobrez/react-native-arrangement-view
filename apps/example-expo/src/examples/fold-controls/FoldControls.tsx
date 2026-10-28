import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SystemLayoutObserver,
  useSystemLayout,
  type SystemLayout,
} from 'react-native-arrangement-view';

const TOOLBAR_HEIGHT = 56;
const PALETTE_WIDTH = 220;
const MARGIN = 12;
const colors = [
  { name: 'Coral', value: '#f87171' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Lime', value: '#a3e635' },
  { name: 'Mint', value: '#34d399' },
  { name: 'Sky', value: '#60a5fa' },
  { name: 'Iris', value: '#818cf8' },
  { name: 'Lilac', value: '#c084fc' },
  { name: 'Rose', value: '#f472b6' },
];

export function FoldControls() {
  const [color, setColor] = useState(colors[4]!.value);
  const [palette, setPalette] = useState(false);

  return (
    <View style={styles.screen}>
      <SystemLayoutObserver barExtents={{ bottom: TOOLBAR_HEIGHT }}>
        <View style={[styles.canvas, { backgroundColor: color }]} />
        <Controls
          color={color}
          palette={palette}
          onTogglePalette={() => setPalette((shown) => !shown)}
          onPick={(picked) => {
            setColor(picked);
            setPalette(false);
          }}
        />
      </SystemLayoutObserver>
    </View>
  );
}

function Controls(props: {
  color: string;
  palette: boolean;
  onTogglePalette: () => void;
  onPick: (color: string) => void;
}) {
  const layout = useSystemLayout();
  if (!layout) return null;
  const { left, right, bottom, top } = controlsArea(layout);
  const paletteBottom = bottom + TOOLBAR_HEIGHT + MARGIN;

  return (
    <>
      {props.palette && (
        <ScrollView
          testID="palette"
          contentContainerStyle={styles.paletteContent}
          style={[
            styles.palette,
            {
              left,
              bottom: paletteBottom,
              maxHeight: layout.height - top - paletteBottom,
            },
          ]}
        >
          {colors.map(({ name, value }) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={name}
              onPress={() => props.onPick(value)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={[styles.dot, { backgroundColor: value }]} />
              <Text style={styles.label}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View testID="toolbar" style={[styles.toolbar, { left, right, bottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Colors"
          onPress={props.onTogglePalette}
          style={({ pressed }) => [styles.tool, pressed && styles.pressed]}
        >
          <View style={[styles.dot, { backgroundColor: props.color }]} />
          <Text style={styles.label}>Colors</Text>
        </Pressable>
        <Text style={styles.label}>Brush</Text>
        <Text style={styles.label}>Eraser</Text>
        <Text style={styles.label}>Undo</Text>
      </View>
    </>
  );
}

/**
 * Where the controls go, as insets from the observed view's edges. They keep
 * to the left of a vertical fold the system divides at, and below a
 * horizontal one, so nothing sits across the crease. iOS floats them level
 * with its own bars.
 */
function controlsArea(layout: SystemLayout) {
  const divisions = layout.folds.filter((fold) => fold.separating);
  const book = divisions.find((fold) => fold.orientation === 'vertical');
  const tabletop = divisions.find((fold) => fold.orientation === 'horizontal');
  return {
    left: layout.safeArea.left + MARGIN,
    right: book
      ? layout.width - book.x + MARGIN
      : layout.safeArea.right + MARGIN,
    bottom: (layout.barInsets.bottom ?? layout.safeArea.bottom) + MARGIN,
    top: tabletop
      ? tabletop.y + tabletop.height + MARGIN
      : layout.safeArea.top + MARGIN,
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  canvas: { flex: 1, margin: MARGIN, borderRadius: 24, opacity: 0.85 },
  toolbar: {
    position: 'absolute',
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: TOOLBAR_HEIGHT / 2,
    backgroundColor: '#1a1d2a',
  },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pressed: { backgroundColor: '#222637' },
  dot: { width: 18, height: 18, borderRadius: 9 },
  label: { color: 'white', fontSize: 15, fontWeight: '600' },
  palette: {
    position: 'absolute',
    width: PALETTE_WIDTH,
    borderRadius: 24,
    backgroundColor: '#1a1d2a',
  },
  paletteContent: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
});
