import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useArrangementLayout } from 'react-native-arrangement-view';
import {
  calories,
  colors,
  day,
  distanceKm,
  flights,
  formatSteps,
  GOAL,
  halfHours,
  longDate,
  sameDay,
  shortWeekday,
  STREAK,
  week,
} from './data';
import { HourlyChart } from './HourlyChart';

type IconName = ComponentProps<typeof MaterialDesignIcons>['name'];

export interface DashboardProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

/**
 * The day's activity. Beside the calendar pane it swaps the week strip, which
 * the calendar already covers, for an hourly chart.
 */
export function Dashboard({ selected, onSelect }: DashboardProps) {
  const layout = useArrangementLayout();
  const selectedDay = day(selected);
  const steps = selectedDay.steps ?? 0;
  const besideCalendar = layout?.secondaryVisible === true;
  return (
    <View
      testID="step-dashboard"
      style={[
        styles.dashboard,
        layout?.axis === 'horizontal' && styles.divided,
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weatherRow}>
          <Text style={styles.weatherCondition}>Clear</Text>
          <MaterialDesignIcons name="weather-sunny" size={22} color="#f5b400" />
          <Text style={styles.weatherTemperature}>15°C</Text>
        </View>
        <View style={styles.attribution}>
          <MaterialDesignIcons
            name="apple"
            size={10}
            color={colors.secondary}
          />
          <Text style={styles.attributionText}>Weather</Text>
          <Text style={[styles.attributionText, styles.legal]}>Legal</Text>
        </View>
        <View style={styles.titleRow}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityRole="header"
          >
            {longDate(selected)}
          </Text>
          <MaterialDesignIcons name="meditation" size={20} color="#d4bb8e" />
          <MaterialDesignIcons
            name="export-variant"
            size={19}
            color={colors.secondary}
          />
        </View>

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <Stat
              icon="shoe-print"
              tint="#ff9500"
              label="Steps"
              value={formatSteps(steps)}
            />
            <Stat
              icon="walk"
              tint="#1e88f5"
              label="Distance"
              value={distanceKm(steps)}
              unit="km"
            />
          </View>
          <View style={styles.gridRow}>
            <Stat
              icon="fire"
              tint="#ff3b30"
              label="Calories"
              value={String(calories(steps))}
            />
            <Stat
              icon="stairs"
              tint="#34c759"
              label="Flights"
              value={String(flights(selected))}
            />
          </View>
          <View style={styles.gridRow}>
            <View style={[styles.card, styles.compactCard]}>
              <Laurel />
              <Text style={styles.streak}>days streak</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              style={[styles.card, styles.compactCard, styles.stepboard]}
            >
              <MaterialDesignIcons name="trophy" size={20} color="#e3a21a" />
              <Text style={styles.stepboardText}>Stepboard</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.goal}>
          {steps >= GOAL
            ? `Your ${formatSteps(GOAL)} goal didn't stand a chance! ⚡`
            : `${formatSteps(GOAL - steps)} steps to your ${formatSteps(GOAL)} goal`}
        </Text>

        {/* Unknown until the panes are laid out: show neither, rather than flash one. */}
        {layout &&
          (besideCalendar ? (
            <HourlyChart values={halfHours(selectedDay)} />
          ) : (
            <WeekStrip selected={selected} onSelect={onSelect} />
          ))}
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  tint,
  label,
  value,
  unit,
}: {
  icon: IconName;
  tint: string;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${label} ${value} ${unit ?? ''}`}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${tint}22` }]}>
          <MaterialDesignIcons name={icon} size={18} color={tint} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

function Laurel() {
  return (
    <View style={styles.laurel}>
      <MaterialDesignIcons
        name="leaf"
        size={16}
        color={colors.tertiary}
        style={styles.leafLeading}
      />
      <Text style={styles.streakCount}>{STREAK}</Text>
      <MaterialDesignIcons
        name="leaf"
        size={16}
        color={colors.tertiary}
        style={styles.leafTrailing}
      />
    </View>
  );
}

function WeekStrip({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
}) {
  return (
    <View testID="week-strip" style={styles.week}>
      {week(selected).map((entry) => {
        const isSelected = sameDay(entry.date, selected);
        return (
          <Pressable
            key={entry.date.getDate()}
            accessibilityRole="button"
            accessibilityLabel={longDate(entry.date)}
            accessibilityState={{ selected: isSelected }}
            disabled={entry.steps === null}
            onPress={() => onSelect(entry.date)}
            style={[styles.weekDay, isSelected && styles.weekDaySelected]}
          >
            {entry.steps !== null && entry.steps >= GOAL && (
              <View style={styles.goalDot} />
            )}
            <Text style={styles.weekDayName}>{shortWeekday(entry.date)}</Text>
            <Text style={styles.weekDayDate}>{entry.date.getDate()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

const styles = StyleSheet.create({
  dashboard: { flex: 1, backgroundColor: colors.background },
  divided: {
    borderStartWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  scroll: { flex: 1 },
  content: {
    paddingStart: 18,
    paddingEnd: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherCondition: {
    fontSize: 21,
    fontWeight: '600',
    color: colors.secondary,
  },
  weatherTemperature: { fontSize: 21, color: colors.tertiary },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  attributionText: { fontSize: 10, color: colors.secondary },
  legal: { textDecorationLine: 'underline', marginStart: 3 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  title: { flexShrink: 1, fontSize: 24, fontWeight: '700', color: colors.text },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
    ...shadow,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontSize: 15, color: colors.secondary },
  statValue: { fontSize: 23, fontWeight: '700', color: colors.text },
  statUnit: { fontSize: 12, fontWeight: '500', color: colors.secondary },
  laurel: { flexDirection: 'row', alignItems: 'center' },
  leafLeading: { transform: [{ scaleX: -1 }, { rotate: '-20deg' }] },
  leafTrailing: { transform: [{ rotate: '-20deg' }] },
  streakCount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Georgia',
  },
  streak: { flexShrink: 1, fontSize: 15, color: colors.text },
  stepboard: { justifyContent: 'center' },
  stepboardText: { fontSize: 15, color: colors.text },
  goal: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  week: { flexDirection: 'row', gap: 4 },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 2,
  },
  weekDaySelected: { backgroundColor: colors.selected },
  goalDot: {
    position: 'absolute',
    top: 5,
    end: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  weekDayName: { fontSize: 13, color: colors.secondary },
  weekDayDate: { fontSize: 16, fontWeight: '600', color: colors.secondary },
});
