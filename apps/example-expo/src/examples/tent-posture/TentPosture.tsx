import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrangementView,
  useHingeChange,
  type HingeState,
} from 'react-native-arrangement-view';
import { AlarmSettings } from './AlarmSettings';
import { ClockFace } from './ClockFace';

// A preview waits a little, which leaves time to stand the phone up, and
// then lets the glow rise over a few seconds instead of the minutes before a
// real alarm.
const PREVIEW_LEAD_SECONDS = 8;
const PREVIEW_GLOW_SECONDS = 15;

/**
 * A view that takes over the display in the tent posture: a bedside clock,
 * after the one Apple showed with iPhone Duo stood up on a nightstand, which
 * glows before the alarm. Only the layout is real: nothing rings, and the
 * glow is a preview.
 *
 * The clock is the primary pane, so it's what shows where only one fits. The
 * alarm's settings are the secondary pane, beside the clock once unfolded and
 * below it, on the half resting on the table, when half-open like a laptop.
 */
export function TentPosture() {
  const [alarm, setAlarm] = useState(() => new Date(2026, 0, 1, 6, 30));
  const [wake, setWake] = useState<'asleep' | 'waking' | 'ringing'>('asleep');
  const glow = useAnimatedValue(0);
  const [tent, setTent] = useState(false);

  const stop = () => {
    glow.stopAnimation();
    glow.setValue(0);
    setWake('asleep');
  };
  const preview = () => {
    setWake('waking');
    Animated.timing(glow, {
      toValue: 1,
      delay: PREVIEW_LEAD_SECONDS * 1000,
      duration: PREVIEW_GLOW_SECONDS * 1000,
      // The digits' color follows the glow, which the native driver can't animate.
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setWake('ringing');
    });
  };
  useEffect(() => () => glow.stopAnimation(), [glow]);

  // Stood up as a tent, the clock is all there is.
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !tent, autoHideHomeIndicator: tent });
  }, [navigation, tent]);

  return (
    <SafeAreaView
      style={styles.screen}
      // In a tent the clock reaches every edge and keeps clear of them itself.
      edges={tent ? [] : ['left', 'right', 'bottom']}
    >
      <ArrangementView style={styles.screen}>
        <ArrangementView.Primary>
          <Clock
            alarm={alarm}
            glow={glow}
            ringing={wake === 'ringing'}
            onTentChange={setTent}
            onStop={stop}
          />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <AlarmSettings
            alarm={alarm}
            onChange={setAlarm}
            previewing={wake !== 'asleep'}
            onPreview={wake === 'asleep' ? preview : stop}
          />
        </ArrangementView.Secondary>
      </ArrangementView>
    </SafeAreaView>
  );
}

/**
 * iOS has no tent posture, and the hinge's status can't tell one apart: it
 * lags behind the angle, so a tent reads `closed` when reached from closed
 * and `partiallyOpen` when reached from open. What a tent is, is the hinge
 * open while the app is on the outer display, in landscape: a window with a
 * compact height, under 480 pt. The inner display is never that short.
 */
function isTent(hinge: HingeState, windowHeight: number) {
  return (hinge.angle ?? 0) > 0.5 && windowHeight < 480; // radians, about 30°
}

/** The clock face, which finds out from the hinge whether it's on a nightstand. */
function Clock({
  onTentChange,
  ...props
}: Omit<Parameters<typeof ClockFace>[0], 'standBy'> & {
  onTentChange: (tent: boolean) => void;
}) {
  const tent = isTent(useHingeChange(), useWindowDimensions().height);
  // The hook only works inside a pane, so the pane tells the screen.
  useEffect(() => onTentChange(tent), [tent, onTentChange]);
  return <ClockFace {...props} standBy={tent} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
});
