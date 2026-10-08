import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import {
  ArrangementView,
  useHingeChange,
  type HingeState,
} from 'react-native-arrangement-view';
import { headerButtons } from '../step-tracker/header';
import { AlarmSettings } from './AlarmSettings';
import { ClockFace } from './ClockFace';
import {
  previewWake,
  SNOOZE_MINUTES,
  snoozePreview,
  useNow,
  wake,
  type Alarm,
  type Preview,
  type Response,
} from './wake';

const noResponse: Response = { stoppedAt: null, snoozedUntil: null };

/**
 * A bedside clock after the one Apple showed with iPhone Duo: stood up as a
 * tent on a nightstand, the outer display becomes a clock that glows before
 * the alarm.
 *
 * The clock is the primary pane, so it's what shows where only one fits. The
 * alarm's settings are the secondary pane, beside the clock once unfolded and
 * below it, on the half resting on the table, when half-open like a laptop.
 */
export function BedsideClock() {
  const [alarm, setAlarm] = useState<Alarm>({
    hour: 6,
    minute: 30,
    glow: true,
    glowMinutes: 20,
  });
  const [response, setResponse] = useState(noResponse);
  // A preview runs on its own clock and doesn't touch the real alarm.
  const [preview, setPreview] = useState<{
    clock: Preview;
    response: Response;
  } | null>(null);
  const [tent, setTent] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const now = useNow(preview?.clock ?? null);
  const current = wake(now, alarm, preview?.response ?? response);
  const snooze = () => {
    const snoozed = {
      stoppedAt: null,
      snoozedUntil: now + SNOOZE_MINUTES * 60_000,
    };
    if (!preview) return setResponse(snoozed);
    setPreview({
      clock: snoozePreview(preview.clock, now, snoozed.snoozedUntil),
      response: snoozed,
    });
  };
  // Stopping the alarm ends a preview.
  const stop = () =>
    preview
      ? setPreview(null)
      : setResponse({ stoppedAt: now, snoozedUntil: null });

  const changeAlarm = (next: Alarm) => {
    setAlarm(next);
    setResponse(noResponse);
  };
  const togglePreview = () => {
    setPreview(
      preview ? null : { clock: previewWake(alarm), response: noResponse }
    );
    setSettingsOpen(false);
  };

  // Stood up as a tent, the clock is all there is: no header, and the
  // display stays on.
  const navigation = useNavigation();
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !tent,
      autoHideHomeIndicator: tent,
      ...headerButtons(
        settingsVisible
          ? []
          : [
              {
                label: 'Alarm',
                symbol: 'alarm',
                icon: 'alarm',
                tint: 'white',
                onPress: openSettings,
              },
            ]
      ),
    });
  }, [navigation, tent, settingsVisible, openSettings]);

  const settings = (
    <AlarmSettings
      alarm={alarm}
      onChange={changeAlarm}
      previewing={preview !== null}
      onPreview={togglePreview}
    />
  );

  return (
    <SafeAreaView
      style={styles.screen}
      // In a tent the clock reaches every edge and keeps clear of them itself.
      edges={tent ? [] : ['left', 'right', 'bottom']}
    >
      {tent && <KeepAwake />}
      <ArrangementView
        style={styles.screen}
        onArrangementLayoutChange={({ secondaryVisible }) => {
          setSettingsVisible(secondaryVisible);
          if (secondaryVisible) setSettingsOpen(false);
        }}
      >
        <ArrangementView.Primary>
          <Clock
            now={now}
            wake={current}
            onTentChange={setTent}
            onSnooze={snooze}
            onStop={stop}
          />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>{settings}</ArrangementView.Secondary>
      </ArrangementView>
      <Modal
        visible={settingsOpen && !tent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsOpen(false)}
      >
        {/* A modal is a separate window, with insets of its own. */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Alarm</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSettingsOpen(false)}
                hitSlop={12}
              >
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            {settings}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * iOS has no tent posture. Stood up as a tent, iPhone Duo stays on its outer
 * display and reports the hinge closed, but at the angle it's open at. A
 * closed phone's angle is near 0.
 */
function isTent(hinge: HingeState) {
  return hinge.status === 'closed' && (hinge.angle ?? 0) > 0.5; // radians, about 30°
}

/** The clock face, which finds out from the hinge whether it's on a nightstand. */
function Clock({
  onTentChange,
  ...props
}: Omit<Parameters<typeof ClockFace>[0], 'standBy'> & {
  onTentChange: (tent: boolean) => void;
}) {
  const tent = isTent(useHingeChange((hinge) => onTentChange(isTent(hinge))));
  return <ClockFace {...props} standBy={tent} />;
}

function KeepAwake() {
  useKeepAwake();
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  sheet: { flex: 1, backgroundColor: '#10121a' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  done: { fontSize: 17, fontWeight: '600', color: '#ff9f0a' },
});
