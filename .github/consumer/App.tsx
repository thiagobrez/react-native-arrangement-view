import { StyleSheet, Text, View } from 'react-native';
import {
  ArrangementView,
  useHingeChange,
  type HingeState,
} from 'react-native-arrangement-view';

function Hinge() {
  const hinge: HingeState | null = useHingeChange(() => {});
  const angle = hinge?.angle ?? null;
  return <Text>{angle === null ? 'No hinge' : `${angle} rad`}</Text>;
}

export default function App() {
  return (
    <ArrangementView
      style={styles.arrangement}
      arrangement="split"
      axes="both"
      hingePolicy="avoidSeparating"
    >
      <ArrangementView.Primary>
        <View style={styles.pane}>
          <Hinge />
        </View>
      </ArrangementView.Primary>
      <ArrangementView.Secondary>
        <View style={styles.pane} />
      </ArrangementView.Secondary>
    </ArrangementView>
  );
}

const styles = StyleSheet.create({
  arrangement: { flex: 1 },
  pane: { flex: 1 },
});
