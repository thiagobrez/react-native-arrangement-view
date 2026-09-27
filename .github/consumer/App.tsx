// Copied over a fresh Expo app by the `consumer` CI job, which installs the
// packed tarball instead of the workspace source.
import { StyleSheet, Text, View } from 'react-native';
import {
  ArrangementView,
  useHingeChange,
  type HingeState,
} from 'react-native-arrangement-view';

function Hinge() {
  const hinge: HingeState = useHingeChange(() => {});
  return (
    <Text>{hinge.angle === null ? 'No hinge' : `${hinge.angle} rad`}</Text>
  );
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
