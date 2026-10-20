export type Activity = 'walk' | 'run' | 'bike' | 'swim';

export interface Day {
  date: Date;
  steps: number | null;
  activity?: Activity;
}

export const GOAL = 5000;
export const STREAK = 14;
export const FIXED_TODAY = new Date(2026, 8, 26);

const HISTORY_START = new Date(2026, 7, 1);
const history: { steps: number; activity?: Activity }[] = [
  { steps: 8_000 },
  { steps: 12_000, activity: 'walk' },
  { steps: 9_000 },
  { steps: 7_000 },
  { steps: 11_000, activity: 'run' },
  { steps: 13_000 },
  { steps: 6_000 },
  { steps: 5_000 },
  { steps: 10_000 },
  { steps: 9_000, activity: 'bike' },
  { steps: 12_000 },
  { steps: 14_000, activity: 'run' },
  { steps: 7_000 },
  { steps: 5_000 },
  { steps: 11_000 },
  { steps: 13_000, activity: 'walk' },
  { steps: 9_000 },
  { steps: 4_000 },
  { steps: 10_000 },
  { steps: 12_000, activity: 'run' },
  { steps: 8_000 },
  { steps: 6_000 },
  { steps: 4_000 },
  { steps: 9_000 },
  { steps: 7_000 },
  { steps: 6_000 },
  { steps: 10_000 },
  { steps: 8_000 },
  { steps: 2_000 },
  { steps: 6_000 },
  { steps: 10_000 },
  { steps: 11_000 },
  { steps: 6_000 },
  { steps: 12_000, activity: 'walk' },
  { steps: 15_000 },
  { steps: 15_000, activity: 'swim' },
  { steps: 6_000, activity: 'walk' },
  { steps: 7_000 },
  { steps: 11_000 },
  { steps: 14_000 },
  { steps: 10_000, activity: 'run' },
  { steps: 13_000 },
  { steps: 3_000 },
  { steps: 5_000, activity: 'bike' },
  { steps: 8_000, activity: 'walk' },
  { steps: 16_000, activity: 'run' },
  { steps: 13_000, activity: 'run' },
  { steps: 14_000, activity: 'run' },
  { steps: 14_000 },
  { steps: 15_000, activity: 'walk' },
  { steps: 9_000 },
  { steps: 13_000, activity: 'bike' },
  { steps: 11_000, activity: 'run' },
  { steps: 9_000 },
  { steps: 13_000 },
  { steps: 15_000, activity: 'bike' },
  { steps: 10_282 },
];

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function month(year: number, index: number): Day[] {
  const length = new Date(year, index + 1, 0).getDate();
  return Array.from({ length }, (_, offset) => {
    const date = new Date(year, index, offset + 1);
    const recordIndex = Math.round(
      (date.getTime() - HISTORY_START.getTime()) / 86_400_000
    );
    const record = date <= FIXED_TODAY ? history[recordIndex] : undefined;
    return { date, steps: record?.steps ?? null, activity: record?.activity };
  });
}

export const months = [month(2026, 7), month(2026, 8)];

export function day(date: Date): Day {
  return (
    months.flat().find((candidate) => sameDay(candidate.date, date)) ?? {
      date,
      steps: null,
    }
  );
}

export function mondayToSaturday(date: Date): Day[] {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, offset) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + offset);
    return day(next);
  });
}

const TODAY_SO_FAR = [
  60, 75, 55, 40, 50, 65, 45, 80, 70, 95, 160, 690, 1310, 1120, 1060,
];

export function halfHours(of: Day): number[] {
  if (sameDay(of.date, FIXED_TODAY)) return TODAY_SO_FAR;
  if (of.steps === null) return [];
  let seed = of.date.getDate() * 7919 + of.date.getMonth() * 104729;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const weights = Array.from({ length: 48 }, (_, slot) => {
    const hour = slot / 2;
    const awake = hour >= 7 && hour <= 22 ? 1 : 0.05;
    return awake * (0.2 + random()) * (random() > 0.92 ? 4 : 1);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => Math.round((weight / total) * of.steps!));
}

export const distanceKm = (steps: number) => (steps * 0.0008).toFixed(2);
export const calories = (steps: number) => Math.round(steps * 0.04);
export const flights = (date: Date) => (date.getDate() * 3 + 6) % 7;

export const formatSteps = (steps: number) => steps.toLocaleString('en-US');
export const thousands = (steps: number) => `${Math.round(steps / 1000)}K`;

export const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const longDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
export const monthName = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long' });
export const shortWeekday = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'short' });

export const colors = {
  background: '#f2f2f4',
  card: '#f9f9fa',
  border: '#e2e2e7',
  text: '#111114',
  secondary: '#8e8e93',
  tertiary: '#b4b4ba',
  green: '#30b850',
  orange: '#f08a3c',
  selected: '#e4e4e9',
};

export type WorkoutType =
  | 'outdoorCycle'
  | 'hiit'
  | 'outdoorWalk'
  | 'indoorWalk'
  | 'indoorRun'
  | 'outdoorRun'
  | 'outdoorSwim';

export interface Workout {
  type: WorkoutType;
  start: Date;
  distanceKm: number | null;
  kcal: number;
  minutes: number;
}

export const workoutKinds: Record<
  WorkoutType,
  {
    name: string;
    icon: 'bike' | 'run-fast' | 'walk' | 'run' | 'swim';
    tint: string;
    family: WorkoutFamily;
  }
> = {
  outdoorCycle: {
    name: 'Outdoor Cycle',
    icon: 'bike',
    tint: '#30b850',
    family: 'cycle',
  },
  hiit: { name: 'HIIT', icon: 'run-fast', tint: '#ff3b30', family: 'hiit' },
  outdoorWalk: {
    name: 'Outdoor Walk',
    icon: 'walk',
    tint: '#1e88f5',
    family: 'walk',
  },
  indoorWalk: {
    name: 'Indoor Walk',
    icon: 'walk',
    tint: '#1e88f5',
    family: 'walk',
  },
  indoorRun: {
    name: 'Indoor Run',
    icon: 'run',
    tint: '#bf5af2',
    family: 'run',
  },
  outdoorRun: {
    name: 'Outdoor Run',
    icon: 'run',
    tint: '#bf5af2',
    family: 'run',
  },
  outdoorSwim: {
    name: 'Outdoor Swim',
    icon: 'swim',
    tint: '#32ade6',
    family: 'swim',
  },
};

export type WorkoutFamily = 'walk' | 'cycle' | 'run' | 'hiit' | 'swim';

const at = (date: number, hours: number, minutes: number) =>
  new Date(2026, 8, date, hours, minutes);

export const workouts: Workout[] = [
  {
    type: 'outdoorCycle',
    start: at(25, 18, 43),
    distanceKm: 54.05,
    kcal: 1220,
    minutes: 116,
  },
  {
    type: 'hiit',
    start: at(22, 17, 11),
    distanceKm: null,
    kcal: 462,
    minutes: 41,
  },
  {
    type: 'outdoorCycle',
    start: at(21, 7, 47),
    distanceKm: 32.15,
    kcal: 880,
    minutes: 79,
  },
  {
    type: 'outdoorWalk',
    start: at(19, 9, 1),
    distanceKm: 8.06,
    kcal: 410,
    minutes: 70,
  },
  {
    type: 'indoorRun',
    start: at(17, 17, 30),
    distanceKm: 6.86,
    kcal: 520,
    minutes: 39,
  },
  {
    type: 'hiit',
    start: at(16, 18, 33),
    distanceKm: null,
    kcal: 396,
    minutes: 35,
  },
  {
    type: 'indoorRun',
    start: at(15, 7, 4),
    distanceKm: 6.32,
    kcal: 480,
    minutes: 36,
  },
  {
    type: 'outdoorWalk',
    start: at(14, 19, 1),
    distanceKm: 1.93,
    kcal: 105,
    minutes: 24,
  },
  {
    type: 'outdoorCycle',
    start: at(13, 8, 38),
    distanceKm: 34.68,
    kcal: 910,
    minutes: 86,
  },
  {
    type: 'outdoorRun',
    start: at(10, 7, 13),
    distanceKm: 6.92,
    kcal: 530,
    minutes: 38,
  },
  {
    type: 'indoorWalk',
    start: at(6, 8, 31),
    distanceKm: 4.12,
    kcal: 230,
    minutes: 52,
  },
  {
    type: 'outdoorSwim',
    start: at(5, 17, 32),
    distanceKm: 1.88,
    kcal: 340,
    minutes: 44,
  },
  {
    type: 'indoorWalk',
    start: at(3, 6, 48),
    distanceKm: 6.43,
    kcal: 330,
    minutes: 52,
  },
];

export const families: WorkoutFamily[] = [
  'walk',
  'cycle',
  'run',
  'hiit',
  'swim',
];

export function totals(of: Workout[]) {
  const minutes = of.reduce((sum, workout) => sum + workout.minutes, 0);
  const kcal = of.reduce((sum, workout) => sum + workout.kcal, 0);
  const km = of.reduce((sum, workout) => sum + (workout.distanceKm ?? 0), 0);
  const days = new Set(of.map((workout) => workout.start.getDate())).size;
  return {
    count: `${of.length} workouts over ${days} days`,
    detail: `${Math.floor(minutes / 60)}h ${minutes % 60}m · ${kcal.toLocaleString('en-US')} kcal · ${km.toFixed(1)} km`,
  };
}

export const time = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const monthYear = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
