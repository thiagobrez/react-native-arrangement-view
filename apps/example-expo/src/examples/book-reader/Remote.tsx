import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { book, chapter } from './book';
import { colors } from './Page';

export interface RemoteProps {
  page: number;
  count: number;
  /** Turns to a page, animated or not. */
  onTurn: (page: number, animated: boolean) => void;
}

/** Page controls for the half of the display resting on the table. */
export function Remote({ page, count, onTurn }: RemoteProps) {
  return (
    <View testID="reader-remote" style={styles.remote}>
      <View style={styles.titles}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.subtitle}>
          {chapter.number} · {chapter.title}
        </Text>
      </View>
      <PageScrubber page={page} count={count} onTurn={onTurn} />
      <View style={styles.transport}>
        <IconButton
          testID="previous-page"
          label="Previous page"
          icon="chevron-left"
          disabled={page === 0}
          onPress={() => onTurn(page - 1, true)}
        />
        <IconButton
          testID="next-page"
          label="Next page"
          icon="chevron-right"
          disabled={page === count - 1}
          onPress={() => onTurn(page + 1, true)}
        />
      </View>
    </View>
  );
}

/**
 * The reading position in the chapter. Tap or drag to turn to a page: the
 * page above follows the finger.
 */
function PageScrubber({ page, count, onTurn }: RemoteProps) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const last = count - 1;
  const fraction = last > 0 ? page / last : 0;
  const turnAt = ({ nativeEvent }: GestureResponderEvent) => {
    if (width === 0) return;
    const at = Math.min(1, Math.max(0, nativeEvent.locationX / width));
    const target = Math.round(at * last);
    if (target !== page) onTurn(target, false);
  };
  return (
    <View style={styles.scrubber}>
      <View
        testID="page-scrubber"
        accessibilityRole="adjustable"
        accessibilityLabel="Page"
        accessibilityValue={{ min: 1, max: count, now: page + 1 }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          const target =
            page + (nativeEvent.actionName === 'increment' ? 1 : -1);
          if (target >= 0 && target <= last) onTurn(target, true);
        }}
        hitSlop={{ top: 16, bottom: 16 }}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          setDragging(true);
          turnAt(event);
        }}
        onResponderMove={turnAt}
        onResponderRelease={() => setDragging(false)}
        style={styles.hitArea}
      >
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            dragging && styles.thumbActive,
            { left: fraction * width - 8 },
          ]}
        />
      </View>
      <View style={styles.positions}>
        <Text testID="remote-page" style={styles.position}>
          Page {page + 1} of {count}
        </Text>
        <Text style={styles.position}>
          {last - page === 1 ? '1 page left' : `${last - page} pages left`}
        </Text>
      </View>
    </View>
  );
}

interface IconButtonProps {
  testID: string;
  label: string;
  icon: 'chevron-left' | 'chevron-right';
  disabled: boolean;
  onPress: () => void;
}

function IconButton({
  testID,
  label,
  icon,
  disabled,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialDesignIcons name={icon} size={40} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  remote: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 28,
  },
  titles: { gap: 4 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  scrubber: { gap: 8 },
  hitArea: { height: 16, justifyContent: 'center' },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gutter,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.text },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text,
  },
  thumbActive: { transform: [{ scale: 1.4 }] },
  positions: { flexDirection: 'row', justifyContent: 'space-between' },
  position: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  transport: { flexDirection: 'row', justifyContent: 'center', gap: 64 },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gutter,
  },
  pressed: { opacity: 0.5 },
  disabled: { opacity: 0.3 },
});
