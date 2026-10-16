import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type DerivedValue,
} from 'react-native-reanimated';
import { useAnimatedHinge } from 'react-native-arrangement-view/reanimated';

const cards = [
  { offset: -1, colors: ['#6366f1', '#a855f7'] },
  { offset: 1, colors: ['#f43f5e', '#fb923c'] },
  // Last, so it's on top.
  { offset: 0, colors: ['#14b8a6', '#38bdf8'] },
];

/**
 * Cards that fan out as the device opens and close up as it folds, following
 * the hinge of the ArrangementView whose pane they are in.
 */
export function CardFan() {
  const { angle } = useAnimatedHinge();
  return (
    <View testID="card-fan" style={styles.pane}>
      {cards.map((card) => (
        <Card key={card.offset} angle={angle} {...card} />
      ))}
    </View>
  );
}

function Card({
  angle,
  offset,
  colors: [from, to],
}: {
  angle: DerivedValue<number | null>;
  offset: number;
  colors: string[];
}) {
  const style = useAnimatedStyle(() => {
    // 0 closed, 1 flat.
    const open = (angle.get() ?? 0) / Math.PI;
    return {
      transform: [
        { translateX: offset * interpolate(open, [0, 1], [8, 84]) },
        { translateY: Math.abs(offset) * interpolate(open, [0, 1], [4, 18]) },
        { rotate: `${offset * interpolate(open, [0, 1], [2, 16])}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.card,
        {
          experimental_backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
        },
        style,
      ]}
    >
      <View style={styles.disc} />
      <View style={styles.lines}>
        <View style={styles.line} />
        <View style={[styles.line, styles.short]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: 140,
    height: 196,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
  },
  disc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  lines: { gap: 8 },
  line: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  short: { width: '60%' },
});
