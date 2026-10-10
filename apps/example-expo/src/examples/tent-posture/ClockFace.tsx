import { useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  alarm: Date;
  /** How far the glow has risen, from 0 to 1. */
  glow: Animated.Value;
  ringing: boolean;
  /**
   * The whole display is the clock, as on a nightstand: it keeps clear of the
   * display's corners itself, and is red, like StandBy at night.
   */
  standBy: boolean;
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
export function ClockFace({ alarm, glow, ringing, standBy, onStop }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const insets = useSafeAreaInsets();
  const now = useNow();
  const ink = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [standBy ? colors.night : colors.day, colors.dawn],
  });
  const [time, period] = formatTime(now).split(/\s/);
  const fontSize = Math.min(size.width / 2.8, size.height * 0.48);

  return (
    <View
      testID="clock-face"
      style={[
        styles.face,
        // The same on both sides, so the clock stays centred on the display.
        standBy && {
          paddingVertical: Math.max(insets.top, insets.bottom),
          paddingHorizontal: Math.max(insets.left, insets.right),
        },
      ]}
    >
      <Animated.View style={[styles.glow, { opacity: glow }]} />
      <View
        style={styles.content}
        onLayout={({ nativeEvent: { layout } }) =>
          setSize({ width: layout.width, height: layout.height })
        }
      >
        {size.width > 0 && (
          <>
            <Animated.Text style={[styles.detail, { color: ink }]}>
              {now.toLocaleDateString([], {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Animated.Text>
            <Animated.Text
              testID="clock-time"
              style={[styles.time, { color: ink, fontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {time}
              {/* AM or PM, where the locale has one. */}
              {period && (
                <Text style={{ fontSize: fontSize * 0.22 }}> {period}</Text>
              )}
            </Animated.Text>
            {ringing ? (
              <Pressable
                testID="alarm-stop"
                accessibilityRole="button"
                onPress={onStop}
                style={({ pressed }) => [
                  styles.stop,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.stopLabel}>Stop</Text>
              </Pressable>
            ) : (
              <Animated.Text style={[styles.detail, { color: ink }]}>
                Alarm · {formatTime(alarm)}
              </Animated.Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export function formatTime(time: Date) {
  return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const styles = StyleSheet.create({
  face: { flex: 1, backgroundColor: 'black' },
  // A sunrise from the bottom edge.
  glow: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage:
      'radial-gradient(ellipse farthest-side at 50% 100%, ' +
      'rgba(255, 190, 120, 0.95) 0%, rgba(255, 120, 60, 0.7) 40%, ' +
      'rgba(150, 40, 20, 0.4) 75%, rgba(0, 0, 0, 0) 100%)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  detail: { fontSize: 17, fontWeight: '600', opacity: 0.8 },
  time: {
    fontFamily: Platform.select({ ios: 'ui-rounded' }),
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  stop: {
    minWidth: 120,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#ff9f0a',
  },
  pressed: { opacity: 0.7 },
  stopLabel: { color: 'black', fontSize: 17, fontWeight: '700' },
});
