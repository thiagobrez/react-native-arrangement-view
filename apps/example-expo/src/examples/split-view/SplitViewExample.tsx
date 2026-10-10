import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Split,
  type SplitHostCommands,
} from 'react-native-screens/experimental';
import { Detail } from './Detail';
import { Sidebar } from './Sidebar';
import { trails } from './trails';

/**
 * react-native-screens' Split (UISplitViewController, iOS only) with an
 * ArrangementView inside its secondary column. Expo Router's
 * `expo-router/unstable-split-view` wraps the same component, but only as the
 * root layout, so this app nests `Split.Host` in its stack directly.
 */
export function SplitViewExample() {
  const navigation =
    useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const split = useRef<SplitHostCommands>(null);
  const [selectedId, setSelectedId] = useState(trails[0]!.id);
  const [collapsed, setCollapsed] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<string | null>(null);
  const trail = trails.find((item) => item.id === selectedId)!;

  // Split builds its UISplitViewController when it enters a window and only
  // attaches columns mounted after that, so wait for the push to finish.
  const [pushed, setPushed] = useState(false);
  useEffect(
    () => navigation.addListener('transitionEnd', () => setPushed(true)),
    [navigation]
  );

  // A collapsed split shows its own back button over the pushed detail; the
  // stack's would sit on top of it.
  const splitHasBackButton = collapsed && detailVisible;
  useEffect(() => {
    navigation.setOptions({ headerBackVisible: !splitHasBackButton });
  }, [navigation, splitHasBackButton]);

  if (!pushed) return <View style={styles.placeholder} />;

  return (
    <Split.Host
      // After a fold collapses the split, the secondary column keeps its
      // expanded size, so start from a new split whenever it changes.
      key={collapsed ? 'collapsed' : 'expanded'}
      ref={split}
      colorScheme="dark"
      preferredDisplayMode="oneBesideSecondary"
      preferredSplitBehavior="tile"
      topColumnForCollapsing="primary"
      onCollapse={() => {
        // The new split starts on the sidebar.
        setCollapsed(true);
        setDetailVisible(false);
      }}
      onExpand={() => setCollapsed(false)}
      onDisplayModeWillChange={({ nativeEvent }) =>
        setDisplayMode(nativeEvent.nextDisplayMode)
      }
    >
      <Split.Column>
        <SafeAreaProvider>
          <Sidebar
            selectedId={selectedId}
            collapsed={collapsed}
            displayMode={displayMode}
            onSelect={(id) => {
              setSelectedId(id);
              // Pushes the secondary column when the split is collapsed.
              split.current?.show('secondary');
            }}
          />
        </SafeAreaProvider>
      </Split.Column>
      <Split.Column
        onWillAppear={() => setDetailVisible(true)}
        onWillDisappear={() => setDetailVisible(false)}
      >
        <SafeAreaProvider>
          <Detail trail={trail} />
        </SafeAreaProvider>
      </Split.Column>
    </Split.Host>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: '#10121a' },
});
