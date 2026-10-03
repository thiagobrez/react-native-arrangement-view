import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrangementView,
  type Arrangement,
  type ArrangementAxes,
  type PrimaryEdge,
} from 'react-native-arrangement-view';
import { Chip } from './Chip';
import { Pane } from './Pane';

export function FeaturesDemo() {
  const [arrangement, setArrangement] = useState<Arrangement>('split');
  const [axes, setAxes] = useState<ArrangementAxes>('both');
  const [primaryEdge, setPrimaryEdge] = useState<PrimaryEdge>();
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
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
          <View style={styles.separator} />
          {([undefined, 'leading', 'trailing'] as const).map((edge) => (
            <Chip
              key={edge ?? 'default'}
              label={edge ? `Primary ${edge}` : 'Default edge'}
              selected={edge === primaryEdge}
              onPress={() => setPrimaryEdge(edge)}
            />
          ))}
        </View>
      </View>

      {/*<View style={{flex: 1, backgroundColor: 'red'}} />*/}

      <ArrangementView
        style={styles.arrangement}
        arrangement={arrangement}
        axes={axes}
        primaryEdge={primaryEdge}
      >
        <ArrangementView.Primary>
          <Pane primary arrangement={arrangement} />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <Pane primary={false} arrangement={arrangement} />
        </ArrangementView.Secondary>
      </ArrangementView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16 },
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
