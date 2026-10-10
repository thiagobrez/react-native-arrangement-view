import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatTime } from './ClockFace';

interface Props {
  alarm: Date;
  onChange: (alarm: Date) => void;
  previewing: boolean;
  onPreview: () => void;
}

const STEP_MINUTES = 15;

/** The alarm's time, and a preview of the glow that comes before it. */
export function AlarmSettings({
  alarm,
  onChange,
  previewing,
  onPreview,
}: Props) {
  const step = (minutes: number) =>
    onChange(new Date(alarm.getTime() + minutes * 60_000));

  return (
    <ScrollView
      testID="alarm-settings"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Wake up at</Text>
      <View style={styles.stepper}>
        <StepButton
          label="−"
          accessibilityLabel="Earlier"
          onPress={() => step(-STEP_MINUTES)}
        />
        <Text testID="alarm-time" style={styles.time}>
          {formatTime(alarm)}
        </Text>
        <StepButton
          label="+"
          accessibilityLabel="Later"
          onPress={() => step(STEP_MINUTES)}
        />
      </View>
      <Pressable
        testID="alarm-preview"
        accessibilityRole="button"
        onPress={onPreview}
        style={({ pressed }) => [styles.preview, pressed && styles.pressed]}
      >
        <Text style={styles.previewLabel}>
          {previewing ? 'End preview' : 'Preview wake-up'}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        {Platform.OS === 'ios'
          ? 'Stand iPhone up as a tent on your nightstand and the outer display becomes the clock.'
          : 'Fold the phone halfway and set it down like a laptop: the clock moves to the upright half.'}
      </Text>
    </ScrollView>
  );
}

function StepButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
    >
      <Text style={styles.stepLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  content: { padding: 16, paddingBottom: 32 },
  heading: {
    color: '#8e93a8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#1a1d2a',
  },
  time: {
    color: 'white',
    fontSize: 44,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2e40',
  },
  stepLabel: { color: 'white', fontSize: 26, fontWeight: '400' },
  preview: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2a2e40',
  },
  pressed: { opacity: 0.7 },
  previewLabel: { color: '#ff9f0a', fontSize: 17, fontWeight: '600' },
  hint: {
    color: '#8e93a8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 16,
  },
});
