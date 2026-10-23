// Throwaway POC bench: hinge latency over a Fabric event against a Nitro listener.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NativeHingeObserver from '../../../src/HingeObserverNativeComponent';
import { getHinge, NitroPaneHost, type HingeSample } from '../../../src/nitro';
import NativeHingeModule from '../../../src/NativeHingeModule';

type Mode = 'fabric' | 'nitro' | 'turbo' | 'none';
const LOADS = [0, 200];

function busy(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Hold the JS thread.
  }
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return null;
  return sorted[
    Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  ]!;
}

const round = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? n : Math.round(n * 1000) / 1000;

export function HingeBench() {
  const navigation =
    useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const [mode, setMode] = useState<Mode>('none');
  const [render, setRender] = useState(false);
  const [load, setLoad] = useState(0);
  const [angle, setAngle] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const latencies = useRef<number[]>([]);
  const lastSample = useRef<Partial<HingeSample> | null>(null);
  const renderRef = useRef(render);
  renderRef.current = render;

  const onSample = (sample: Partial<HingeSample>) => {
    const now = performance.now();
    latencies.current.push(now - (sample.t as number) / 1e6);
    lastSample.current = sample;
    if (renderRef.current && typeof sample.angle === 'number') {
      setAngle((sample.angle * 180) / Math.PI);
    }
  };

  useEffect(() => {
    if (mode !== 'nitro') return;
    return getHinge().addListener(onSample);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'turbo') return;
    const subscription = NativeHingeModule.onHinge(onSample);
    NativeHingeModule.start();
    return () => {
      NativeHingeModule.stop();
      subscription.remove();
    };
  }, [mode]);

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

  const report = () => {
    const l = latencies.current;
    const sorted = l.filter(Number.isFinite).sort((a, b) => a - b);
    const offsetMs = performance.now() - getHinge().nanoTime() / 1e6;
    console.log(
      'HINGEBENCH ' +
        JSON.stringify({
          mode,
          render,
          load,
          count: l.length,
          badT: l.length - sorted.length,
          p50: round(percentile(sorted, 50)),
          p90: round(percentile(sorted, 90)),
          p99: round(percentile(sorted, 99)),
          max: round(sorted[sorted.length - 1]),
          first5: l.slice(0, 5).map(round),
          last5: l.slice(-5).map(round),
          lastSample: lastSample.current,
          offsetMs: round(offsetMs),
        })
    );
    // Updated here rather than live, so no status commits land inside a timed sweep.
    setStatus(
      `Current: ${mode}, count ${l.length}, p50 ${round(percentile(sorted, 50)) ?? '-'} ms`
    );
    latencies.current = [];
    lastSample.current = null;
  };

  return (
    <View style={styles.screen}>
      {mode === 'fabric' && (
        <NativeHingeObserver
          style={styles.observer}
          onHingeChange={(e) => onSample(e.nativeEvent as Partial<HingeSample>)}
        />
      )}
      <Text style={styles.angle}>
        {angle == null ? '--' : `${angle.toFixed(1)}°`}
      </Text>
      {/* HingeBenchProbe.kt reads this bar's width on each drawn frame: 2 dp per degree. */}
      <View
        nativeID="bench-bar"
        collapsable={false}
        style={[
          styles.bar,
          { width: angle == null ? 0 : Math.round(angle) * 2 },
        ]}
      />
      <Text style={styles.status}>{status}</Text>
      <View style={styles.row}>
        {(['fabric', 'nitro', 'turbo', 'none'] as const).map((m) => (
          <Button
            key={m}
            label={`Mode ${m}`}
            active={mode === m}
            onPress={() => setMode(m)}
          />
        ))}
      </View>
      <View style={styles.row}>
        <Button
          label={`Render ${render ? 'on' : 'off'}`}
          active={render}
          onPress={() => setRender((r) => !r)}
        />
        <Button
          label={`Load ${load} ms`}
          active={load > 0}
          onPress={() =>
            setLoad((v) => LOADS[(LOADS.indexOf(v) + 1) % LOADS.length]!)
          }
        />
        <Button label="Report" onPress={report} />
      </View>
      <View style={styles.row}>
        <Button
          label="Nitro view with children"
          onPress={() => navigation.navigate('nitro-children')}
        />
        <Button
          label="Nitro view alone"
          onPress={() => navigation.navigate('nitro-alone')}
        />
      </View>
    </View>
  );
}

function Button({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, active && styles.buttonActive]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function NitroChildren() {
  return (
    <View style={styles.screen}>
      <NitroAlone />
      <NitroPaneHost color="#ff5533" style={styles.host}>
        <Text style={styles.label}>React child inside NitroPaneHost</Text>
      </NitroPaneHost>
    </View>
  );
}

export function NitroAlone() {
  return (
    <View style={styles.row}>
      <NitroPaneHost color="#3355ff" style={styles.host} />
      <Text style={styles.label}>Sibling of a childless NitroPaneHost</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 16, backgroundColor: '#10121a' },
  observer: { position: 'absolute', width: 0, height: 0 },
  angle: { color: 'white', fontSize: 72, fontWeight: '700' },
  status: { color: '#c7cbe0', fontSize: 18 },
  bar: { height: 24, borderRadius: 12, backgroundColor: '#7c8cff' },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#1a1d2a',
  },
  buttonActive: { backgroundColor: '#3b4470' },
  buttonLabel: { color: 'white', fontSize: 17, fontWeight: '600' },
  host: { width: 160, height: 160 },
  label: { color: 'white', fontSize: 17 },
});
