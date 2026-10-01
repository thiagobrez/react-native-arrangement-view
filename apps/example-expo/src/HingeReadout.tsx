import { StyleSheet, Text, View } from 'react-native';
import { useHingeChange } from 'react-native-arrangement-view';

/** The hinge seen by the nearest observer, as one line of text. */
export function HingeReadout({ id }: { id: string }) {
  const hinge = useHingeChange();
  const degrees =
    hinge.angle === null ? null : Math.round((hinge.angle * 180) / Math.PI);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>HINGE</Text>
      <Text testID={`${id}-hinge-angle`} style={styles.angle}>
        {degrees === null ? 'No hinge' : `${degrees}°`}
      </Text>
      <Text testID={`${id}-hinge-status`} style={styles.status}>
        {hinge.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  label: {
    color: '#6f7a99',
    letterSpacing: 2.5,
    fontSize: 10,
    fontWeight: '700',
  },
  angle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  status: { color: '#a8b3d0', fontSize: 13, fontWeight: '600' },
});
