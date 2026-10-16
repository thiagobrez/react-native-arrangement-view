import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { examples } from './examples';

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
          {item.platform && <PlatformBadge platform={item.platform} />}
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const platformBadges = {
  ios: { label: 'iOS only', color: '#6cb0ff', backgroundColor: '#0a84ff2e' },
  android: {
    label: 'Android only',
    color: '#5fe39b',
    backgroundColor: '#3ddc8424',
  },
};

function PlatformBadge({ platform }: { platform: 'ios' | 'android' }) {
  const { label, color, backgroundColor } = platformBadges[platform];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#10121a' },
  content: { padding: 16 },
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
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeLabel: { fontSize: 12, fontWeight: '600' },
  chevron: { color: '#5d6580', fontSize: 28, fontWeight: '300' },
  separator: { height: 10 },
});
