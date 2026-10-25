import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrangementView,
  useHingeSelector,
} from 'react-native-arrangement-view';
import { AlarmSettings } from './AlarmSettings';
import { ClockFace } from './ClockFace';

const PREVIEW_LEAD_SECONDS = 8;
const PREVIEW_GLOW_SECONDS = 15;
const HINGE_OPEN_RADIANS = 0.5;
const COMPACT_HEIGHT = 480;

export function TentPosture() {
  const [alarm, setAlarm] = useState(() => new Date(2026, 0, 1, 6, 30));
  const [wake, setWake] = useState<'asleep' | 'waking' | 'ringing'>('asleep');
  const glow = useAnimatedValue(0);
  const tent = useTentPosture();
  const symmetricSafeArea = useSymmetricSafeArea();

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

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !tent, autoHideHomeIndicator: tent });
  }, [navigation, tent]);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={tent ? [] : ['left', 'right', 'bottom']}
    >
      <ArrangementView style={styles.screen}>
        <ArrangementView.Primary>
          <ClockFace
            style={tent && symmetricSafeArea}
            alarm={alarm}
            glow={glow}
            ringing={wake === 'ringing'}
            night={tent}
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

// iOS has no tent posture, and the hinge's status lags behind its angle, so a
// tent reads `closed` when reached from closed and `partiallyOpen` when
// reached from open.
function useTentPosture() {
  const hingeOpen = useHingeSelector(
    (hinge) => (hinge.angle ?? 0) > HINGE_OPEN_RADIANS
  );
  const outerDisplayInLandscape = useWindowDimensions().height < COMPACT_HEIGHT;
  return hingeOpen && outerDisplayInLandscape;
}

function useSymmetricSafeArea() {
  const insets = useSafeAreaInsets();
  return {
    paddingVertical: Math.max(insets.top, insets.bottom),
    paddingHorizontal: Math.max(insets.left, insets.right),
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
});
