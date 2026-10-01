import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HingeReadout } from './HingeReadout';

/**
 * A screen with no ArrangementView. It reads the app's HingeObserver, while
 * the arrangement screen beneath it is out of the window and keeps the hinge
 * state it last saw until it returns.
 */
export function HingeScreen() {
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <HingeReadout id="screen" />
      <Text style={styles.note}>
        This screen has no ArrangementView. It reads the HingeObserver mounted
        above the navigator.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a', padding: 22, gap: 14 },
  note: { color: '#a8b3d0', fontSize: 14, lineHeight: 20 },
});
