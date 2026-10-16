import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import type { HingeStatus } from 'react-native-arrangement-view';
import { useAnimatedHinge } from 'react-native-arrangement-view/reanimated';

const RADIUS = 120;
const STROKE = 6;
const TICKS = Array.from({ length: 13 }, (_, index) => index * 15);

const statusColors: Record<HingeStatus, string> = {
  unknown: '#5d6580',
  closed: '#8b93b8',
  partiallyOpen: '#ffb454',
  fullyOpen: '#5eead4',
};

/**
 * The device seen from the side: the base stays put and the lid swings to the
 * hinge's angle, colored by its status. It reads the ArrangementView whose
 * pane it is in, on the UI thread, so it never renders while the device folds.
 */
export function HingeDial() {
  const hinge = useAnimatedHinge();
  const color = useDerivedValue(() =>
    withTiming(statusColors[hinge.status.get()], { duration: 250 })
  );
  const dial = useAnimatedStyle(() => ({
    opacity: withTiming(hinge.available.get() ? 1 : 0.35),
  }));
  const lid = useAnimatedStyle(() => {
    const angle = hinge.angle.get();
    return {
      opacity: angle === null ? 0 : 1,
      backgroundColor: color.get(),
      // Closed, the lid lies on the base. It turns counterclockwise from there.
      transform: [{ rotate: `${-(angle ?? 0)}rad` }],
    };
  });
  const pivot = useAnimatedStyle(() => ({ borderColor: color.get() }));

  return (
    <View testID="hinge-dial" style={styles.pane}>
      <Animated.View style={[styles.dial, dial]}>
        {TICKS.map((degrees) => (
          <View
            key={degrees}
            style={[
              styles.spoke,
              { transform: [{ rotate: `${-degrees}deg` }] },
            ]}
          >
            <View style={[styles.tick, degrees % 90 === 0 && styles.major]} />
          </View>
        ))}
        <View style={styles.base} />
        <Animated.View style={[styles.lid, lid]} />
        <Animated.View style={[styles.pivot, pivot]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dial: { width: 2 * (RADIUS + 28), height: RADIUS + 36 },
  // Each spoke starts at the pivot and carries its tick at the far end.
  spoke: {
    position: 'absolute',
    left: RADIUS + 28,
    bottom: 12 - 1,
    width: RADIUS + 26,
    height: 2,
    alignItems: 'flex-end',
    transformOrigin: 'left',
  },
  tick: { width: 8, height: 2, borderRadius: 1, backgroundColor: '#3a4058' },
  major: { width: 16, backgroundColor: '#5d6580' },
  base: {
    position: 'absolute',
    left: RADIUS + 28,
    bottom: 12 - STROKE / 2,
    width: RADIUS,
    height: STROKE,
    borderRadius: STROKE / 2,
    backgroundColor: '#3a4058',
  },
  lid: {
    position: 'absolute',
    left: RADIUS + 28,
    bottom: 12 - STROKE / 2,
    width: RADIUS,
    height: STROKE,
    borderRadius: STROKE / 2,
    transformOrigin: 'left',
  },
  pivot: {
    position: 'absolute',
    left: RADIUS + 28 - 8,
    bottom: 12 - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    backgroundColor: '#10121a',
  },
});
