import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { Alarm } from './wake';

interface Props {
  alarm: Alarm;
  onChange: (alarm: Alarm) => void;
  previewing: boolean;
  onPreview: () => void;
}

const STEP_MINUTES = 15;
const GLOW_LENGTHS = [10, 20, 30];

/** The alarm's time and its glow, with a sped-up preview of the wake-up. */
export function AlarmSettings({
  alarm,
  onChange,
  previewing,
  onPreview,
}: Props) {
  const step = (minutes: number) => {
    const total =
      (alarm.hour * 60 + alarm.minute + minutes + 24 * 60) % (24 * 60);
    onChange({ ...alarm, hour: Math.floor(total / 60), minute: total % 60 });
  };
  const time = new Date(2026, 0, 1, alarm.hour, alarm.minute);

  return (
    <ScrollView
      testID="alarm-settings"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Wake up at</Text>
      <View style={styles.card}>
        <View style={styles.stepper}>
          <StepButton
            label="−"
            accessibilityLabel="Earlier"
            onPress={() => step(-STEP_MINUTES)}
          />
          <Text testID="alarm-time" style={styles.time}>
            {time.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          <StepButton
            label="+"
            accessibilityLabel="Later"
            onPress={() => step(STEP_MINUTES)}
          />
        </View>
      </View>

      <Text style={styles.heading}>Gentle glow</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Glow before the alarm</Text>
            <Text style={styles.detail}>
              The clock brightens like a sunrise as your alarm gets close.
            </Text>
          </View>
          <Switch
            testID="alarm-glow"
            value={alarm.glow}
            onValueChange={(glow) => onChange({ ...alarm, glow })}
            trackColor={{ true: '#ff9f0a' }}
            thumbColor={Platform.select({ android: 'white' })}
          />
        </View>
        <View style={styles.separator} />
        <View style={[styles.lengths, !alarm.glow && styles.disabled]}>
          {GLOW_LENGTHS.map((minutes) => {
            const selected = alarm.glowMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                testID={`glow-${minutes}`}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !alarm.glow }}
                disabled={!alarm.glow}
                onPress={() => onChange({ ...alarm, glowMinutes: minutes })}
                style={[styles.length, selected && styles.lengthSelected]}
              >
                <Text
                  style={[
                    styles.lengthLabel,
                    selected && styles.lengthLabelSelected,
                  ]}
                >
                  {minutes} min
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  card: { backgroundColor: '#1a1d2a', borderRadius: 18, padding: 16 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  label: { color: 'white', fontSize: 17, fontWeight: '600' },
  detail: { color: '#8e93a8', fontSize: 14 },
  separator: { height: 1, backgroundColor: '#2a2e40', marginVertical: 14 },
  lengths: { flexDirection: 'row', gap: 8 },
  disabled: { opacity: 0.4 },
  length: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2a2e40',
  },
  lengthSelected: { backgroundColor: '#ff9f0a' },
  lengthLabel: { color: 'white', fontSize: 15, fontWeight: '600' },
  lengthLabelSelected: { color: 'black' },
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
