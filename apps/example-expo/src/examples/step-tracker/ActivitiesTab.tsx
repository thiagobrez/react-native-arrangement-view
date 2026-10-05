import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import {
  ArrangementView,
  useArrangementLayout,
} from 'react-native-arrangement-view';
import {
  colors,
  families,
  longDate,
  month,
  monthYear,
  time,
  today,
  totals,
  workoutKinds,
  workouts,
  type Workout,
  type WorkoutFamily,
} from './data';
import { useBesideHinge } from './besideHinge';
import { headerBase, headerButtons } from './header';

const Stack = createNativeStackNavigator();

/** Every workout this month: a list, and the month at a glance once unfolded. */
export function ActivitiesTab() {
  return (
    <Stack.Navigator screenOptions={headerBase}>
      <Stack.Screen
        name="activities-home"
        component={ActivitiesScreen}
        options={{
          title: 'All Activities',
          ...headerButtons([
            { label: 'Add', symbol: 'plus', icon: 'plus', tint: '#ff9500' },
            { label: 'Search', symbol: 'magnifyingglass', icon: 'magnify' },
            {
              label: 'Filter',
              symbol: 'line.3.horizontal.decrease',
              icon: 'filter-variant',
            },
            { label: 'Settings', symbol: 'gearshape', icon: 'cog-outline' },
          ]),
        }}
      />
    </Stack.Navigator>
  );
}

function ActivitiesScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ArrangementView
        style={styles.screen}
        axes="horizontal"
        primaryEdge="trailing"
      >
        <ArrangementView.Primary>
          <WorkoutList />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <MonthPane />
        </ArrangementView.Secondary>
      </ArrangementView>
    </SafeAreaView>
  );
}

const familyIcons: Record<WorkoutFamily, keyof typeof workoutKinds> = {
  walk: 'outdoorWalk',
  cycle: 'outdoorCycle',
  run: 'outdoorRun',
  hiit: 'hiit',
  swim: 'outdoorSwim',
};

/**
 * The workouts, newest first. On its own it opens with the month's summary;
 * beside the month pane, which shows it, the list starts with the workouts.
 */
function WorkoutList() {
  const layout = useArrangementLayout();
  // The list is the trailing pane: its start faces the hinge.
  const besideHinge = useBesideHinge();
  const [width, setWidth] = useState(0);
  // Two columns of compact cards where there's room for them.
  const columns = width >= 560 ? 2 : 1;
  const { count, detail } = totals(workouts);
  return (
    <ScrollView
      testID="workout-list"
      contentContainerStyle={[
        styles.list,
        besideHinge && styles.startBesideHinge,
      ]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {layout && !layout.secondaryVisible && (
        <View style={styles.listHeader}>
          <Text style={styles.month}>{monthYear(today)}</Text>
          <View style={styles.counts}>
            {families.map((family, index) => {
              const kind = workoutKinds[familyIcons[family]];
              const amount = workouts.filter(
                (workout) => workoutKinds[workout.type].family === family
              ).length;
              return (
                <Fragment key={family}>
                  {index > 0 && <Text style={styles.countText}>•</Text>}
                  <MaterialDesignIcons
                    name={kind.icon}
                    size={15}
                    color={kind.tint}
                  />
                  <Text style={styles.countText}>× {amount}</Text>
                </Fragment>
              );
            })}
          </View>
          <Text style={styles.totals} numberOfLines={1} adjustsFontSizeToFit>
            {count} · {detail}
          </Text>
        </View>
      )}
      <View style={styles.cards}>
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.start.getTime()}
            workout={workout}
            compact={columns === 2}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function WorkoutCard({
  workout,
  compact,
}: {
  workout: Workout;
  compact: boolean;
}) {
  const kind = workoutKinds[workout.type];
  const [value, unit] =
    workout.distance === null
      ? [String(workout.kcal), 'cal']
      : [workout.distance.toFixed(2), 'km'];
  const icon = (
    <View style={[styles.workoutIcon, { backgroundColor: `${kind.tint}33` }]}>
      <MaterialDesignIcons name={kind.icon} size={22} color={kind.tint} />
    </View>
  );
  const amount = (
    <Text style={styles.value}>
      {value}
      <Text style={styles.unit}> {unit}</Text>
    </Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kind.name}, ${value} ${unit}, ${longDate(workout.start)}`}
      style={[styles.card, compact && styles.compactCard]}
    >
      {icon}
      {compact ? (
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.kind} numberOfLines={1}>
              {kind.name}
            </Text>
            <Text style={styles.meta}>{time(workout.start)}</Text>
          </View>
          <Text style={styles.meta}>{longDate(workout.start)}</Text>
          {amount}
        </View>
      ) : (
        // Name and time, then the amount and the date.
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.kind} numberOfLines={1}>
              {kind.name}
            </Text>
            <Text style={styles.meta}>{time(workout.start)}</Text>
          </View>
          <View style={styles.cardBottom}>
            {amount}
            <Text style={styles.meta} numberOfLines={1}>
              {longDate(workout.start)}
            </Text>
          </View>
        </View>
      )}
      <MaterialDesignIcons
        name="chevron-right"
        size={20}
        color={colors.tertiary}
      />
    </Pressable>
  );
}

/** The month at a glance beside the list, its end facing the hinge. */
function MonthPane() {
  const besideHinge = useBesideHinge();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.summaryPane,
        besideHinge && styles.endBesideHinge,
      ]}
    >
      <MonthGrid />
    </ScrollView>
  );
}

/** The month as dots, with each workout day marked by its activity. */
function MonthGrid() {
  const days = month(today.getFullYear(), today.getMonth());
  const cells = [...Array<null>(days[0]!.date.getDay()).fill(null), ...days];
  const { count, detail } = totals(workouts);
  return (
    <View testID="month-summary">
      <Text style={styles.month}>{monthYear(today)}</Text>
      <View style={styles.grid}>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: 7 }, (__, column) => {
              const cell = cells[row * 7 + column];
              const workout =
                cell &&
                workouts.find(
                  (candidate) =>
                    candidate.start.getDate() === cell.date.getDate()
                );
              const kind = workout && workoutKinds[workout.type];
              return (
                <View key={column} style={styles.gridCell}>
                  {kind ? (
                    <MaterialDesignIcons
                      name={kind.icon}
                      size={26}
                      color={kind.tint}
                    />
                  ) : (
                    cell && <View style={styles.dot} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.summaryText}>{count}</Text>
      <Text style={styles.summaryText}>{detail}</Text>
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
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  listHeader: { marginBottom: 14, gap: 8 },
  month: { fontSize: 24, fontWeight: '700', color: colors.text },
  counts: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countText: { fontSize: 14, color: colors.secondary },
  totals: { fontSize: 12, color: colors.secondary },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  compactCard: { width: '48.5%' },
  workoutIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 6,
  },
  kind: { flexShrink: 1, fontSize: 15, color: colors.secondary },
  value: { fontSize: 23, fontWeight: '700', color: colors.text },
  unit: { fontSize: 13, fontWeight: '500', color: colors.secondary },
  meta: { fontSize: 12, color: colors.secondary },
  startBesideHinge: { paddingStart: 4 },
  endBesideHinge: { paddingEnd: 4 },
  summaryPane: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  grid: { marginTop: 18, marginBottom: 18, gap: 10 },
  gridRow: { flexDirection: 'row' },
  gridCell: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.selected,
  },
  summaryText: { fontSize: 13, color: colors.secondary, lineHeight: 19 },
});
