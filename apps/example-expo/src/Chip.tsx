import { Pressable, StyleSheet, Text } from 'react-native';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A selectable pill used for the arrangement and axis controls. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222637',
  },
  chipSelected: { backgroundColor: '#e0e7ff' },
  chipText: { color: '#aab3ce', fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#20253b' },
});
