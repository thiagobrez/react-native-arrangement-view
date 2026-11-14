import { Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

export interface SegmentsProps<T extends string> {
  testID: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

export function Segments<T extends string>({
  testID,
  options,
  selected,
  onSelect,
}: SegmentsProps<T>) {
  return (
    <Picker
      testID={testID}
      selection={selected}
      onSelectionChange={onSelect}
      modifiers={[pickerStyle('segmented')]}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}
