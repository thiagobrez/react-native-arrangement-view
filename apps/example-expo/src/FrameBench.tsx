import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrangementView } from 'react-native-arrangement-view';
import { FrameProbe } from '../modules/frame-probe';

// Longer than the slowest device.fold() on CI; e2e/frames.ts fails a window
// change that lands outside the hold.
const HOLD_MS = 10_000;
const ids = {
  arrangement: 'frames-arrangement',
  primary: 'frames-primary',
  secondary: 'frames-secondary',
};

/**
 * The screen e2e/frames.e2e.ts measures, opened by arrangementview://frames.
 * It is not an example, so the examples list leaves it out. Nothing on it
 * animates, so every frame it draws comes from a change the test made.
 */
export function FrameBench() {
  const [mount, setMount] = useState(1);

  useEffect(() => {
    FrameProbe?.start(ids.arrangement, ids.primary, ids.secondary);
    return () => {
      FrameProbe?.stop();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <ArrangementView
        key={mount}
        nativeID={ids.arrangement}
        style={styles.screen}
      >
        <ArrangementView.Primary>
          <View nativeID={ids.primary} style={[styles.fill, styles.primary]} />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <View
            nativeID={ids.secondary}
            style={[styles.fill, styles.secondary]}
          />
        </ArrangementView.Secondary>
      </ArrangementView>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" onPress={holdJavaScript}>
          <Text style={styles.button}>Hold JavaScript</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMount((count) => count + 1)}
        >
          <Text style={styles.button}>Remount</Text>
        </Pressable>
      </View>
    </View>
  );
}

function holdJavaScript() {
  FrameProbe?.mark('hold');
  const end = Date.now() + HOLD_MS;
  while (Date.now() < end) {
    // Pane placement must not need this thread.
  }
  FrameProbe?.mark('release');
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fill: { flex: 1 },
  primary: { backgroundColor: '#c7d2fe' },
  secondary: { backgroundColor: '#fed7aa' },
  toolbar: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: { color: 'white', backgroundColor: '#111827', padding: 10 },
});
