import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { examples } from './examples';
import { HingeReadout } from './HingeReadout';

/**
 * Home screen: every example, in order. Pressing one opens it. It has no
 * ArrangementView, so its hinge readout comes from the app's HingeObserver.
 */
export function ExamplesList() {
  const navigation =
    useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const insets = useSafeAreaInsets();
  return (
    <FlatList
      testID="examples-list"
      style={styles.list}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: styles.content.padding + insets.left,
          paddingRight: styles.content.padding + insets.right,
          paddingBottom: styles.content.padding + insets.bottom,
        },
      ]}
      data={examples}
      keyExtractor={(example) => example.name}
      ListHeaderComponent={<HingeReadout id="home" />}
      ListHeaderComponentStyle={styles.header}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <Pressable
          testID={`example-${item.name}`}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={() => navigation.navigate(item.name)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#10121a' },
  content: { padding: 16 },
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#1a1d2a',
  },
  rowPressed: { backgroundColor: '#222637' },
  title: { flex: 1, color: 'white', fontSize: 17, fontWeight: '700' },
  chevron: { color: '#5d6580', fontSize: 28, fontWeight: '300' },
  separator: { height: 10 },
});
