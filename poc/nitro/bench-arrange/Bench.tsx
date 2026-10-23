import { useEffect, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrangementView } from 'react-native-arrangement-view';

const DIRECTIONS = ['ltr', 'rtl', 'rtl-noswap'] as const;
const direction = !I18nManager.isRTL
  ? 'ltr'
  : I18nManager.doLeftAndRightSwapInRTL
    ? 'rtl'
    : 'rtl-noswap';
function setNextDirection() {
  const next =
    DIRECTIONS[(DIRECTIONS.indexOf(direction) + 1) % DIRECTIONS.length]!;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(next !== 'ltr');
  I18nManager.swapLeftAndRightInRTL(next !== 'rtl-noswap');
  return next;
}

const LOADS = [0, 200, 1000];

function busy(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

function JsClock() {
  const [start] = useState(Date.now);
  const [now, setNow] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  return (
    <Text style={styles.clock}>
      JS clock {((now - start) / 1000).toFixed(1)} s
    </Text>
  );
}

export function Bench() {
  const [load, setLoad] = useState(0);
  const [key, setKey] = useState(0);
  const [remounts, setRemounts] = useState(0);
  const [nextDirection, setNext] = useState<string | null>(null);

  useEffect(() => {
    if (!load) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      busy(load);
      setTimeout(tick, 0);
    };
    tick();
    return () => {
      running = false;
    };
  }, [load]);

  useEffect(() => {
    if (remounts === 0) return;
    const id = setTimeout(() => {
      setKey((k) => k + 1);
      setRemounts((n) => n - 1);
    }, 1500);
    return () => clearTimeout(id);
  }, [remounts]);

  return (
    <View style={styles.screen}>
      <ArrangementView key={key} style={styles.screen}>
        <ArrangementView.Primary>
          <View nativeID="bench-primary" style={[styles.fill, styles.primary]}>
            <Text style={styles.label}>Primary</Text>
          </View>
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <View
            nativeID="bench-secondary"
            style={[styles.fill, styles.secondary]}
          >
            <Text style={styles.label}>Secondary</Text>
          </View>
        </ArrangementView.Secondary>
      </ArrangementView>
      <View style={styles.clockBar} pointerEvents="none">
        <JsClock />
      </View>
      <View style={styles.toolbar} pointerEvents="box-none">
        <Pressable
          testID="bench-block"
          style={styles.button}
          onPress={() => setTimeout(() => busy(3000), 50)}
        >
          <Text style={styles.buttonText}>Block JS 3 s</Text>
        </Pressable>
        <Pressable
          testID="bench-load"
          style={styles.button}
          onPress={() =>
            setLoad((ms) => LOADS[(LOADS.indexOf(ms) + 1) % LOADS.length]!)
          }
        >
          <Text style={styles.buttonText}>
            {load ? `JS busy ${load} ms` : 'JS idle'}
          </Text>
        </Pressable>
        <Pressable
          testID="bench-remount"
          style={styles.button}
          onPress={() => setRemounts(10)}
        >
          <Text style={styles.buttonText}>Remount ×10</Text>
        </Pressable>
        <Pressable
          testID="bench-direction"
          style={styles.button}
          onPress={() => setNext(setNextDirection())}
        >
          <Text style={styles.buttonText}>
            {nextDirection
              ? `${direction} → ${nextDirection} on relaunch`
              : direction}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#c7d2fe' },
  secondary: { backgroundColor: '#fed7aa' },
  label: { fontSize: 24, fontWeight: '600', color: '#111' },
  clockBar: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  clock: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111',
    fontVariant: ['tabular-nums'],
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toolbar: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: { color: 'white', fontSize: 16 },
});
