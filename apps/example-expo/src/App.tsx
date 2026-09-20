import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrangementView,
  useHingeChange,
  type Arrangement,
  type ArrangementAxes,
} from 'react-native-arrangement-view';

type Demo = 'arrangement' | 'hinge';

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Pane({
  primary,
  arrangement,
  demo,
}: {
  primary: boolean;
  arrangement: Arrangement;
  demo: Demo;
}) {
  const [count, setCount] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hinge = useHingeChange();
  const name = primary ? 'Primary' : 'Secondary';
  const overlay = primary && arrangement === 'overlay';
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
    setSize({
      width: Math.round(layout.width),
      height: Math.round(layout.height),
    });
  const degrees =
    hinge.angle === null ? null : Math.round((hinge.angle * 180) / Math.PI);
  const header = (
    <View style={[styles.paneHeader, overlay && styles.overlayPanel]}>
      <Text style={styles.eyebrow}>
        {primary ? '01 / PRIMARY' : '02 / SECONDARY'}
      </Text>
      <Text style={styles.paneTitle}>
        {demo === 'hinge'
          ? primary
            ? 'Feel the fold.'
            : 'Live hinge context'
          : primary
            ? 'Room to play.'
            : 'Room to explore.'}
      </Text>
      <Text
        testID={`${name.toLowerCase()}-dimensions`}
        style={styles.dimensions}
      >
        {name}: {size.width} × {size.height} pt
      </Text>
      {demo === 'hinge' && (
        <>
          <View style={styles.hingeGraphic}>
            <View style={styles.hingeLeft} />
            <View
              style={[
                styles.hingeRight,
                {
                  transform: [
                    { perspective: 500 },
                    { rotateY: `${180 - (degrees ?? 180)}deg` },
                  ],
                },
              ]}
            />
          </View>
          <Text
            testID={`${name.toLowerCase()}-hinge-angle`}
            style={styles.angle}
          >
            {degrees === null ? 'Unavailable' : `${degrees}°`}
          </Text>
          <Text
            testID={`${name.toLowerCase()}-hinge-status`}
            style={styles.hingeStatus}
          >
            {hinge.status}
          </Text>
          <Text style={styles.bodyText}>
            {hinge.angle === null
              ? 'Waiting for a hinge in this view’s scene.'
              : `${hinge.angle.toFixed(3)} radians · SwiftUI onHingeChange`}
          </Text>
        </>
      )}
      <Pressable
        testID={`${name.toLowerCase()}-counter`}
        accessibilityRole="button"
        accessibilityLabel={`${name} count ${count}`}
        onPress={() => setCount((n) => n + 1)}
        style={styles.counter}
      >
        <Text style={styles.counterText}>
          {name} count {count}
        </Text>
        <Text style={styles.plus}>＋</Text>
      </Pressable>
    </View>
  );
  return (
    <View
      testID={`${name.toLowerCase()}-pane`}
      onLayout={onLayout}
      pointerEvents={overlay ? 'box-none' : 'auto'}
      style={[
        styles.pane,
        primary ? styles.primary : styles.secondary,
        overlay && styles.overlay,
      ]}
    >
      {overlay ? (
        header
      ) : (
        <ScrollView testID={`${name.toLowerCase()}-scroll`}>
          {header}
          <View style={styles.scrollContent}>
            <Text style={styles.bodyText}>
              {demo === 'hinge'
                ? 'Hinge angles drive this effect. The system arrangement still decides the pane layout.'
                : 'Open, fold, and rotate. SwiftUI chooses the arrangement; React content keeps its state.'}
            </Text>
            {Array.from({ length: 14 }, (_, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowNumber}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <View>
                  <Text style={styles.rowTitle}>
                    {primary ? 'Track' : 'Chapter'} {i + 1}
                  </Text>
                  <Text style={styles.rowDetail}>
                    {primary
                      ? 'A little more space to listen'
                      : 'Content that moves with you'}
                  </Text>
                </View>
              </View>
            ))}
            <Text
              testID={`${name.toLowerCase()}-scroll-end`}
              style={styles.eyebrow}
            >
              END OF {name.toUpperCase()}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default function App() {
  const [arrangement, setArrangement] = useState<Arrangement>('split');
  const [axes, setAxes] = useState<ArrangementAxes>('both');
  const [demo, setDemo] = useState<Demo>('arrangement');
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.brand}>ARRANGEMENT VIEW</Text>
          <Text style={styles.title}>
            {demo === 'arrangement'
              ? 'Made for more space.'
              : 'A new angle on interaction.'}
          </Text>
          <View style={styles.controls}>
            <Chip
              label="Arrangement"
              selected={demo === 'arrangement'}
              onPress={() => setDemo('arrangement')}
            />
            <Chip
              label="Hinge"
              selected={demo === 'hinge'}
              onPress={() => setDemo('hinge')}
            />
          </View>
          <View style={styles.controls}>
            <Chip
              label="Split"
              selected={arrangement === 'split'}
              onPress={() => setArrangement('split')}
            />
            <Chip
              label="Overlay"
              selected={arrangement === 'overlay'}
              onPress={() => setArrangement('overlay')}
            />
            <View style={styles.separator} />
            {(['both', 'horizontal', 'vertical'] as const).map((axis) => (
              <Chip
                key={axis}
                label={axis.charAt(0).toUpperCase() + axis.slice(1)}
                selected={axis === axes}
                onPress={() => setAxes(axis)}
              />
            ))}
          </View>
        </View>
        <ArrangementView
          style={styles.arrangement}
          arrangement={arrangement}
          axes={axes}
          primary={<Pane primary arrangement={arrangement} demo={demo} />}
          secondary={
            <Pane primary={false} arrangement={arrangement} demo={demo} />
          }
        />
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SwiftUI layout · React Native content · iOS
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16, gap: 12 },
  brand: {
    color: '#a8b3d0',
    letterSpacing: 2.5,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222637',
  },
  chipSelected: { backgroundColor: '#e0e7ff' },
  chipText: { color: '#aab3ce', fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#20253b' },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#3a4055',
    marginHorizontal: 3,
  },
  arrangement: { flex: 1, overflow: 'hidden' },
  pane: { flex: 1 },
  primary: { backgroundColor: '#423678' },
  secondary: { backgroundColor: '#173f4a' },
  overlay: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 18,
  },
  paneHeader: { padding: 22, gap: 11 },
  overlayPanel: { backgroundColor: '#423678ed', borderRadius: 22, padding: 20 },
  eyebrow: {
    color: '#d4cef0',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  paneTitle: {
    color: 'white',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  dimensions: { color: '#ddd9ef', fontSize: 12, fontVariant: ['tabular-nums'] },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#ffffff20',
    borderRadius: 13,
  },
  counterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  plus: { color: '#fff', fontSize: 21 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 24, gap: 16 },
  bodyText: { color: '#e0e0ee', fontSize: 13, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffffff25',
  },
  rowNumber: {
    color: '#c7c3df',
    fontSize: 11,
    paddingTop: 3,
    fontVariant: ['tabular-nums'],
  },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowDetail: { color: '#c4cbd6', fontSize: 11, marginTop: 4 },
  footer: { paddingVertical: 10, alignItems: 'center' },
  footerText: { color: '#858eaa', fontSize: 10 },
  hingeGraphic: {
    height: 76,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  hingeLeft: {
    width: 70,
    backgroundColor: '#d6c5ff',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderRightWidth: 2,
    borderRightColor: '#1d1733',
  },
  hingeRight: {
    width: 70,
    backgroundColor: '#98dbc9',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    transformOrigin: 'left center',
  },
  angle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  hingeStatus: {
    color: '#e2d9ff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
