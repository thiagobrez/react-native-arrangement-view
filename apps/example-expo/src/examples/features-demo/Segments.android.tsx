import {
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  testID as testTag,
} from '@expo/ui/jetpack-compose/modifiers';
import type { SegmentsProps } from './Segments';

// The sheet's content color doesn't reach segmented buttons.
const colors = {
  activeContainerColor: '#e0e7ff',
  activeContentColor: '#10121a',
  activeBorderColor: '#5a6178',
  inactiveContainerColor: 'transparent',
  inactiveContentColor: '#d3d8ea',
  inactiveBorderColor: '#5a6178',
};

export function Segments<T extends string>({
  testID,
  options,
  selected,
  onSelect,
}: SegmentsProps<T>) {
  return (
    <SingleChoiceSegmentedButtonRow
      modifiers={[fillMaxWidth(), testTag(testID)]}
    >
      {options.map((option) => (
        <SegmentedButton
          key={option.value}
          selected={option.value === selected}
          onClick={() => onSelect(option.value)}
          colors={colors}
        >
          <SegmentedButton.Label>
            <Text>{option.label}</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      ))}
    </SingleChoiceSegmentedButtonRow>
  );
}
