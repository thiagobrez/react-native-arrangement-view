import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrangementView,
  type Arrangement,
  type ArrangementAxes,
} from 'react-native-arrangement-view';
import { Chip } from './Chip';
import { Pane } from './Pane';

export default function App() {
  const [arrangement, setArrangement] = useState<Arrangement>('split');
  const [axes, setAxes] = useState<ArrangementAxes>('both');
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.brand}>REACT NATIVE ARRANGEMENT VIEW</Text>
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

        {/*<View style={{flex: 1, backgroundColor: 'red'}} />*/}

        <ArrangementView
          style={styles.arrangement}
          arrangement={arrangement}
          axes={axes}
        >
          <ArrangementView.Primary>
            <Pane primary arrangement={arrangement} />
          </ArrangementView.Primary>
          <ArrangementView.Secondary>
            <Pane primary={false} arrangement={arrangement} />
          </ArrangementView.Secondary>
        </ArrangementView>
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
  controls: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#3a4055',
    marginHorizontal: 3,
  },
  arrangement: { flex: 1, overflow: 'hidden' },
});
