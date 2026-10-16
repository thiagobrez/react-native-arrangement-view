import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ArrangementView } from 'react-native-arrangement-view';
import { useAnimatedHinge } from 'react-native-arrangement-view/reanimated';
import { CardFan } from './CardFan';
import { HingeDial } from './HingeDial';

/**
 * Effects that follow the hinge's angle on the UI thread, with Reanimated: no
 * component renders while the device folds. The panes read their
 * ArrangementView's hinge; the glow behind it reads the app's HingeObserver.
 */
export function ReanimatedExample() {
  return (
    <View style={styles.screen}>
      <Glow />
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <ArrangementView style={styles.screen}>
          <ArrangementView.Primary>
            <HingeDial />
          </ArrangementView.Primary>
          <ArrangementView.Secondary>
            <CardFan />
          </ArrangementView.Secondary>
        </ArrangementView>
      </SafeAreaView>
    </View>
  );
}

/** Brightens as the device opens. It's outside the arrangement's panes. */
function Glow() {
  const { angle } = useAnimatedHinge();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(angle.get() ?? 0, [0, Math.PI], [0.2, 1]),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.glow, style]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  glow: {
    experimental_backgroundImage:
      'radial-gradient(circle at 50% 0%, rgba(94, 234, 212, 0.28), transparent 75%)',
  },
});
