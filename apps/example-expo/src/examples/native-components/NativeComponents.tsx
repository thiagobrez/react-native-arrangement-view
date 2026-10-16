import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomSheet,
  Button,
  Column,
  Spacer,
  Text as NativeText,
} from '@expo/ui';
import {
  ArrangementView,
  useArrangementLayout,
} from 'react-native-arrangement-view';

export function NativeComponents() {
  const [sheetShown, setSheetShown] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ArrangementView style={styles.screen}>
        <ArrangementView.Primary>
          <View style={styles.pane}>
            <Text style={styles.title}>Native components</Text>
            <Text style={styles.body}>
              Open the sheet, then fold or unfold the device. Native iOS
              components will avoid the hinge automatically. This is not done by
              the library.
            </Text>
            <Text style={styles.body}>
              react-native-arrangement-view only places the panes and what's
              inside them.
            </Text>
            <Pressable
              testID="open-sheet"
              accessibilityRole="button"
              onPress={() => setSheetShown(true)}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonLabel}>Open sheet</Text>
            </Pressable>
            <Placement />
          </View>
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <View style={[styles.pane, styles.secondary]}>
            <Text style={styles.title}>Second pane</Text>
            <Text style={styles.body}>
              ArrangementView places this pane beside or below the first one.
            </Text>
          </View>
        </ArrangementView.Secondary>
      </ArrangementView>

      <BottomSheet
        testID="sheet"
        isPresented={sheetShown}
        onDismiss={() => setSheetShown(false)}
        snapPoints={['half', 'full']}
        containerColor="#1a1d2a"
        contentColor="white"
      >
        <Column spacing={12}>
          <NativeText textStyle={styles.sheetTitle}>A native sheet</NativeText>
          <NativeText textStyle={styles.sheetBody}>
            The system draws this sheet, so it also decides where it goes.
          </NativeText>
          <Button label="Close" onPress={() => setSheetShown(false)} />
          <Spacer flexible />
        </Column>
      </BottomSheet>
    </SafeAreaView>
  );
}

function Placement() {
  const layout = useArrangementLayout();
  let text = '…';
  if (layout) {
    if (!layout.secondaryVisible) text = 'One pane';
    else text = layout.axis === 'horizontal' ? 'Side by side' : 'Stacked';
  }
  return (
    <Text testID="placement" style={styles.caption}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  pane: { flex: 1, padding: 22, gap: 14 },
  secondary: { backgroundColor: '#1a1d2a' },
  title: { color: 'white', fontSize: 26, fontWeight: '700' },
  body: { color: '#d3d8ea', fontSize: 16, lineHeight: 22 },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
  },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { color: '#10121a', fontSize: 16, fontWeight: '700' },
  caption: { color: '#ffffffa0', fontSize: 13, marginTop: 'auto' },
  sheetTitle: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  sheetBody: { color: '#d3d8ea', fontSize: 16 },
});
