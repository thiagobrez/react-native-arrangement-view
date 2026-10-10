import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import {
  colors,
  GOAL,
  monthName,
  months,
  sameDay,
  thousands,
  today,
  weekdayNames,
  type Day,
} from './data';

export interface HistoryCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

/**
 * Steps for every day, a month at a time, with the current month at the
 * bottom. The scroll view is flipped, so its resting position is the bottom:
 * the current month stays in place when the pane changes size, as it does
 * when the device unfolds, with no scrolling after layout.
 */
export function HistoryCalendar({ selected, onSelect }: HistoryCalendarProps) {
  return (
    <ScrollView
      testID="history-calendar"
      style={[styles.scroll, styles.flipped]}
      contentContainerStyle={styles.content}
      // A flipped indicator would move against the scroll.
      showsVerticalScrollIndicator={false}
    >
      {[...months].reverse().map((days) => (
        <View key={days[0]!.date.getMonth()} style={styles.flipped}>
          <Month days={days} selected={selected} onSelect={onSelect} />
        </View>
      ))}
    </ScrollView>
  );
}

function Month({
  days,
  selected,
  onSelect,
}: { days: Day[] } & HistoryCalendarProps) {
  const first = days[0]!.date;
  const cells: (Day | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...days,
  ];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) =>
    Array.from({ length: 7 }, (__, column) => cells[row * 7 + column] ?? null)
  );
  return (
    <View style={styles.month}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthName}>{monthName(first)}</Text>
        <Text style={styles.monthName}>{first.getFullYear()}</Text>
      </View>
      <View style={styles.row}>
        {weekdayNames.map((name, index) => (
          <Text key={index} style={styles.weekday}>
            {name}
          </Text>
        ))}
      </View>
      {weeks.map((week, index) => (
        <View key={index} style={styles.row}>
          {week.map((day, column) =>
            day ? (
              <Cell
                key={column}
                day={day}
                selected={sameDay(day.date, selected)}
                onSelect={onSelect}
              />
            ) : (
              <View key={column} style={styles.empty} />
            )
          )}
        </View>
      ))}
    </View>
  );
}

const activityIcons = {
  walk: 'walk',
  run: 'run',
  bike: 'bike',
  swim: 'swim',
} as const;

function Cell({
  day,
  selected,
  onSelect,
}: {
  day: Day;
  selected: boolean;
  onSelect: (date: Date) => void;
}) {
  const date = day.date.getDate();
  if (day.steps === null)
    return (
      <View style={[styles.cell, styles.future]}>
        <Hatching />
        <Text style={styles.date}>{date}</Text>
      </View>
    );
  const label = `${monthName(day.date)} ${date}, ${day.steps.toLocaleString('en-US')} steps`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => onSelect(day.date)}
      style={[styles.cell, selected && styles.selected]}
    >
      <Text style={[styles.date, sameDay(day.date, today) && styles.today]}>
        {date}
      </Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[
          styles.steps,
          { color: day.steps >= GOAL ? colors.green : colors.orange },
        ]}
      >
        {thousands(day.steps)}
      </Text>
      <View style={styles.activity}>
        {day.activity && (
          <MaterialDesignIcons
            name={activityIcons[day.activity]}
            size={11}
            color={colors.secondary}
          />
        )}
      </View>
    </Pressable>
  );
}

/** Diagonal stripes for days still to come. */
function Hatching() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 12 }, (_, index) => (
        <View key={index} style={[styles.stripe, { left: index * 8 - 40 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  flipped: { transform: [{ scaleY: -1 }] },
  // Flipped: the top padding is at the bottom of the screen.
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  month: { marginBottom: 20 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  monthName: { fontSize: 17, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 6,
  },
  empty: { flex: 1 },
  cell: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  selected: { backgroundColor: colors.selected },
  future: { backgroundColor: '#f7f7f8' },
  stripe: {
    position: 'absolute',
    top: -20,
    width: 2,
    height: 140,
    backgroundColor: '#e6e6ea',
    transform: [{ rotate: '35deg' }],
  },
  date: { fontSize: 11, color: colors.secondary, fontWeight: '500' },
  today: { color: colors.text, fontWeight: '700' },
  steps: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  activity: { alignItems: 'center', height: 13, marginTop: 1 },
});
