import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

export interface ScrubberProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  /** Called with true when a drag starts and false when it ends. */
  onScrubbingChange: (scrubbing: boolean) => void;
}

/** A seek bar with elapsed and remaining time. Tap or drag to seek. */
export function Scrubber({
  currentTime,
  duration,
  onSeek,
  onScrubbingChange,
}: ScrubberProps) {
  const [width, setWidth] = useState(0);
  // The position under the finger while dragging, as a fraction.
  const [scrub, setScrub] = useState<number | null>(null);
  const fraction = scrub ?? (duration > 0 ? currentTime / duration : 0);
  const at = ({ nativeEvent }: GestureResponderEvent) =>
    width > 0 ? Math.min(1, Math.max(0, nativeEvent.locationX / width)) : 0;
  const shown = scrub === null ? currentTime : scrub * duration;

  return (
    <View style={styles.scrubber}>
      <View
        testID="scrubber"
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
        accessibilityValue={{ text: formatTime(shown) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) =>
          onSeek(
            currentTime + (nativeEvent.actionName === 'increment' ? 10 : -10)
          )
        }
        hitSlop={{ top: 16, bottom: 16 }}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          onScrubbingChange(true);
          setScrub(at(event));
        }}
        onResponderMove={(event) => setScrub(at(event))}
        onResponderRelease={(event) => {
          onSeek(at(event) * duration);
          setScrub(null);
          onScrubbingChange(false);
        }}
        style={styles.hitArea}
      >
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            scrub !== null && styles.thumbActive,
            { left: fraction * width - 8 },
          ]}
        />
      </View>
      <View style={styles.times}>
        <Text testID="elapsed-time" style={styles.time}>
          {formatTime(shown)}
        </Text>
        <Text style={styles.time}>-{formatTime(duration - shown)}</Text>
      </View>
    </View>
  );
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  scrubber: { gap: 6 },
  hitArea: { height: 16, justifyContent: 'center' },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ffffff40',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: 'white' },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  thumbActive: { transform: [{ scale: 1.4 }] },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: {
    color: '#ffffffb3',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
