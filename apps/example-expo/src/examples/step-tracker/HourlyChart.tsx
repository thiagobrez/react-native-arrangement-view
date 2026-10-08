import { StyleSheet, Text, View } from 'react-native';
import { colors, formatSteps } from './data';

const SLOTS = 48;

/** The smallest of 3, 6, 9 or 15 times a power of ten that fits `peak`, so the thirds are round. */
function scale(peak: number) {
  for (let power = 1; ; power *= 10)
    for (const step of [3, 6, 9, 15])
      if (step * power >= peak) return step * power;
}
const HEIGHT = 110;

/** A value per half hour across the day, with a scale on the trailing side. */
export function HourlyChart({
  values,
  color = colors.green,
}: {
  values: number[];
  color?: string;
}) {
  const peak = Math.max(...values, 1);
  const max = scale(peak);
  const ticks = [max, (max * 2) / 3, max / 3, 0];
  return (
    <View testID="hourly-chart" style={styles.chart}>
      <View style={styles.plot}>
        <View style={styles.bars}>
          {[0, 6, 12, 18].map((hour) => (
            <View
              key={hour}
              style={[styles.gridLine, { left: `${(hour / 24) * 100}%` }]}
            />
          ))}
          <View style={styles.baseline} />
          {values.map((value, slot) => (
            <View
              key={slot}
              style={[
                styles.bar,
                {
                  backgroundColor: color,
                  left: `${(slot / SLOTS) * 100}%`,
                  height: Math.max(2, (value / max) * HEIGHT),
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.hours}>
          {['0:00', '6:00', '12:00', '18:00'].map((label) => (
            <Text key={label} style={styles.hour}>
              {label}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.scale}>
        {ticks.map((tick, index) => (
          <Text key={index} style={styles.tick}>
            {formatSteps(tick)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: 6, marginTop: 4 },
  plot: { flex: 1 },
  bars: {
    height: HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.tertiary,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    width: `${(1 / SLOTS) * 100 * 0.7}%`,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  hours: { flexDirection: 'row', marginTop: 6 },
  hour: { flex: 1, fontSize: 11, color: colors.secondary },
  scale: {
    height: HEIGHT,
    justifyContent: 'space-between',
    marginTop: -6,
    marginBottom: 6,
  },
  tick: { fontSize: 11, color: colors.secondary, lineHeight: 12 },
});
