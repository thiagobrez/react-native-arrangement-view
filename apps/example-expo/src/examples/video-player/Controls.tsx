import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useEvent } from 'expo';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { VideoPlayer } from 'expo-video';
import { useArrangementLayout } from 'react-native-arrangement-view';
import { Scrubber } from './Scrubber';

export interface ControlsProps {
  player: VideoPlayer;
}

const HIDE_AFTER_MS = 3000;
const RATES = [1, 1.25, 1.5, 2, 0.5];

export function Controls({ player }: ControlsProps) {
  const navigation = useNavigation();
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });
  const { playbackRate } = useEvent(player, 'playbackRateChange', {
    playbackRate: player.playbackRate,
  });

  const layout = useArrangementLayout();
  const separated = layout !== null && !layout.isOverlapping;
  const axis = layout?.axis ?? null;

  const insets = useSafeAreaInsets();
  const hingeOnLeadingSide = axis === 'horizontal';
  const clearOfBarsExceptHinge = (base: number) => ({
    paddingTop: base + (axis === 'vertical' ? 0 : insets.top),
    paddingBottom: base + insets.bottom,
    paddingLeft:
      base + (hingeOnLeadingSide && !I18nManager.isRTL ? 0 : insets.left),
    paddingRight:
      base + (hingeOnLeadingSide && I18nManager.isRTL ? 0 : insets.right),
  });

  const [shown, setShown] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [hideTimerRestarts, setHideTimerRestarts] = useState(0);
  const visible = separated || shown;
  useEffect(() => {
    if (!visible || separated || scrubbing || !isPlaying) return;
    const timer = setTimeout(() => setShown(false), HIDE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [visible, separated, scrubbing, isPlaying, hideTimerRestarts]);

  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacity, visible]);

  const keepingShown = (action: () => void) => () => {
    action();
    setShown(true);
    setHideTimerRestarts((count) => count + 1);
  };
  const togglePlaying = keepingShown(() =>
    isPlaying ? player.pause() : player.play()
  );
  const close = keepingShown(() => navigation.goBack());
  const back = keepingShown(() => player.seekBy(-10));
  const forward = keepingShown(() => player.seekBy(10));
  const toggleMuted = keepingShown(() => (player.muted = !muted));
  const nextRate = keepingShown(
    () =>
      (player.playbackRate =
        RATES[(RATES.indexOf(playbackRate) + 1) % RATES.length]!)
  );
  const seek = (time: number) => {
    player.currentTime = Math.max(0, Math.min(player.duration, time));
    setHideTimerRestarts((count) => count + 1);
  };

  const title = (
    <View style={styles.titles}>
      <Text style={[styles.title, separated && styles.titleLarge]}>
        Big Buck Bunny
      </Text>
      <Text style={styles.subtitle}>Blender Foundation</Text>
    </View>
  );
  const closeButton = (
    <IconButton
      testID="close-player"
      label="Close"
      icon={{ ios: 'xmark', android: 'close' }}
      size={20}
      onPress={close}
    />
  );
  const transport = (
    <View style={[styles.transport, separated && styles.transportLarge]}>
      <IconButton
        testID="skip-back"
        label="Back 10 seconds"
        icon={{ ios: 'gobackward.10', android: 'replay_10' }}
        size={separated ? 40 : 32}
        onPress={back}
      />
      <IconButton
        testID="play-pause"
        label={isPlaying ? 'Pause' : 'Play'}
        icon={
          isPlaying
            ? { ios: 'pause.fill', android: 'pause' }
            : { ios: 'play.fill', android: 'play_arrow' }
        }
        size={separated ? 56 : 44}
        onPress={togglePlaying}
      />
      <IconButton
        testID="skip-forward"
        label="Forward 10 seconds"
        icon={{ ios: 'goforward.10', android: 'forward_10' }}
        size={separated ? 40 : 32}
        onPress={forward}
      />
    </View>
  );
  const scrubber = (
    <Scrubber
      currentTime={currentTime}
      duration={player.duration}
      onSeek={seek}
      onScrubbingChange={setScrubbing}
    />
  );
  const options = (
    <View style={styles.options}>
      <Pressable
        testID="playback-rate"
        accessibilityRole="button"
        accessibilityLabel={`Playback speed ${playbackRate}×`}
        onPress={nextRate}
        style={styles.rate}
      >
        <Text style={styles.rateText}>{playbackRate}×</Text>
      </Pressable>
      <IconButton
        testID="mute"
        label={muted ? 'Unmute' : 'Mute'}
        icon={
          muted
            ? { ios: 'speaker.slash.fill', android: 'volume_off' }
            : { ios: 'speaker.wave.2.fill', android: 'volume_up' }
        }
        size={20}
        onPress={toggleMuted}
      />
    </View>
  );

  if (separated) {
    return (
      <View
        testID="controls-pane"
        style={[styles.remote, clearOfBarsExceptHinge(28)]}
      >
        <View style={styles.remoteHeader}>
          {title}
          {closeButton}
        </View>
        <View style={styles.remoteBody}>
          {scrubber}
          {transport}
        </View>
        {options}
      </View>
    );
  }

  return (
    <View
      testID="controls-pane"
      pointerEvents="box-none"
      style={styles.overlay}
    >
      <Pressable
        testID="controls-backdrop"
        accessibilityLabel={visible ? 'Hide controls' : 'Show controls'}
        onPress={() => setShown((current) => !current)}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents={visible ? 'box-none' : 'none'}
        style={[styles.scrim, { opacity }]}
      >
        <View pointerEvents="box-none" style={styles.centred}>
          {transport}
        </View>
        <View
          pointerEvents="box-none"
          style={[styles.edges, clearOfBarsExceptHinge(20)]}
        >
          <View style={styles.overlayHeader}>
            {closeButton}
            {title}
          </View>
          <View style={styles.overlayFooter}>
            {scrubber}
            {options}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

interface IconButtonProps {
  testID: string;
  label: string;
  icon: Extract<SymbolViewProps['name'], object>;
  size: number;
  onPress: () => void;
}

function IconButton({ testID, label, icon, size, onPress }: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <SymbolView name={icon} size={size} tintColor="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#00000066' },
  centred: { ...StyleSheet.absoluteFill, justifyContent: 'center' },
  edges: { flex: 1, justifyContent: 'space-between' },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overlayFooter: { gap: 12 },
  remote: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#10121a',
  },
  remoteHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  remoteBody: { gap: 24 },
  titles: { flex: 1, gap: 2 },
  title: { color: 'white', fontSize: 17, fontWeight: '700' },
  titleLarge: { fontSize: 26, letterSpacing: -0.5 },
  subtitle: { color: '#ffffffa0', fontSize: 13, fontWeight: '500' },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  transportLarge: { gap: 56 },
  options: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rate: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ffffff26',
  },
  rateText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.5 },
});
