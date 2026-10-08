import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Wake } from './wake';

interface Props {
  now: number;
  wake: Wake;
  /**
   * The whole display is the clock, as on a nightstand: it keeps clear of the
   * display's corners itself, and turns red at night.
   */
  standBy: boolean;
  onSnooze: () => void;
  onStop: () => void;
}

const colors = {
  day: '#f5f5f7',
  // StandBy's night mode: one dim red, so the clock doesn't light the room.
  night: '#e5281e',
  // The glow's light, which the digits warm to as it rises.
  dawn: '#ffd7a3',
};

/** A bedside clock: the time, large, over a glow that rises before the alarm. */
export function ClockFace({ now, wake, standBy, onSnooze, onStop }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const insets = useSafeAreaInsets();
  const night = standBy && wake.night;
  // At night the digits start red and warm with the glow; by day they're white.
  const ink =
    wake.glow > 0
      ? mix(standBy ? colors.night : colors.day, colors.dawn, wake.glow)
      : night
        ? colors.night
        : colors.day;
  const [time, period] = formatTime(now);
  const fontSize = Math.min(size.width / 2.8, size.height * 0.48);

  return (
    <View
      testID="bedside-clock-face"
      style={[
        styles.face,
        // The same on both sides, so the clock stays centred on the display.
        standBy && {
          paddingVertical: Math.max(insets.top, insets.bottom),
          paddingHorizontal: Math.max(insets.left, insets.right),
        },
        wake.glow > 0 && { experimental_backgroundImage: glow(wake.glow) },
      ]}
    >
      <View
        style={styles.content}
        onLayout={({ nativeEvent: { layout } }) =>
          setSize({ width: layout.width, height: layout.height })
        }
      >
        {size.width > 0 && (
          <>
            <Text style={[styles.date, { color: ink }]}>
              {new Date(now).toLocaleDateString([], {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
            <Text
              testID="bedside-clock-time"
              style={[styles.time, { color: ink, fontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {time}
              {period && (
                <Text style={{ fontSize: fontSize * 0.22 }}> {period}</Text>
              )}
            </Text>
            {wake.ringing ? (
              <View style={styles.actions}>
                <Pressable
                  testID="alarm-snooze"
                  accessibilityRole="button"
                  onPress={onSnooze}
                  style={({ pressed }) => [
                    styles.action,
                    styles.snooze,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.actionLabel}>Snooze</Text>
                </Pressable>
                <Pressable
                  testID="alarm-stop"
                  accessibilityRole="button"
                  onPress={onStop}
                  style={({ pressed }) => [
                    styles.action,
                    styles.stop,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.actionLabel, styles.stopLabel]}>
                    Stop
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.alarm, { color: ink }]}>
                {wake.glow > 0 ? 'Waking up' : 'Alarm'} ·{' '}
                {formatTime(wake.alarmAt).join(' ')}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

/** The time without its AM or PM, which is shown smaller, if the locale has one. */
function formatTime(time: number): [string, string | undefined] {
  const [clock, period] = new Date(time)
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .split(/\s/);
  return [clock!, period];
}

/** A sunrise from the bottom edge, from none at 0 to full at 1. */
function glow(level: number) {
  const a = (alpha: number) => (alpha * level).toFixed(3);
  return (
    `radial-gradient(ellipse farthest-side at 50% 100%, ` +
    `rgba(255, 190, 120, ${a(0.95)}) 0%, ` +
    `rgba(255, 120, 60, ${a(0.7)}) 40%, ` +
    `rgba(150, 40, 20, ${a(0.4)}) 75%, ` +
    `rgba(0, 0, 0, 0) 100%)`
  );
}

/** The color a fraction `t` of the way from `from` to `to`, both #rrggbb. */
function mix(from: string, to: string, t: number) {
  const channel = (hex: string, i: number) =>
    parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const rgb = [0, 1, 2].map((i) =>
    Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t)
  );
  return `rgb(${rgb.join(', ')})`;
}

const styles = StyleSheet.create({
  face: { flex: 1, backgroundColor: 'black' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  date: { fontSize: 17, fontWeight: '600', opacity: 0.8 },
  time: {
    fontFamily: Platform.select({ ios: 'ui-rounded' }),
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  alarm: { fontSize: 17, fontWeight: '600', opacity: 0.8 },
  actions: { flexDirection: 'row', gap: 16 },
  action: {
    minWidth: 120,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  snooze: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  stop: { backgroundColor: '#ff9f0a' },
  pressed: { opacity: 0.7 },
  actionLabel: { color: 'white', fontSize: 17, fontWeight: '700' },
  stopLabel: { color: 'black' },
});
