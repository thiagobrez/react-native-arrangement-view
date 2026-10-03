/** A step tracker's history, fixed so screenshots are repeatable. */

export type Activity = 'walk' | 'run' | 'bike' | 'swim';

export interface Day {
  date: Date;
  /** Null for a day still to come. */
  steps: number | null;
  activity?: Activity;
}

export const GOAL = 5000;
export const STREAK = 14;
export const today = new Date(2026, 8, 26);

// Steps in thousands, from August 1, 2026; a letter marks the day's workout.
const history =
  '8 ' +
  '12w 9 7 11r 13 6 5 ' +
  '10 9b 12 14r 7 5 11 ' +
  '13w 9 4 10 12r 8 6 ' +
  '4 9 7 6 10 8 2 ' +
  '6 10 ' +
  '11 6 12w 15 15s ' +
  '6w 7 11 14 10r 13 3 ' +
  '5b 8w 16r 13r 14r 14 15w ' +
  '9 13b 11r 9 13 15b 10.282';

const activities: Record<string, Activity> = {
  w: 'walk',
  r: 'run',
  b: 'bike',
  s: 'swim',
};

const recorded = history.split(' ').map((entry) => {
  const match = /^([\d.]+)([wrbs])?$/.exec(entry)!;
  return {
    steps: Math.round(Number(match[1]) * 1000),
    activity: match[2] ? activities[match[2]] : undefined,
  };
});

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Every day of a month, with its steps once it has passed. */
export function month(year: number, index: number): Day[] {
  const length = new Date(year, index + 1, 0).getDate();
  return Array.from({ length }, (_, offset) => {
    const date = new Date(year, index, offset + 1);
    const recordIndex = Math.round(
      (date.getTime() - new Date(2026, 7, 1).getTime()) / 86_400_000
    );
    const record = date <= today ? recorded[recordIndex] : undefined;
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

/** The Monday-to-Saturday stretch shown under the dashboard, ending at `date`'s week. */
export function week(date: Date): Day[] {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, offset) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + offset);
    return day(next);
  });
}

/** Steps per half hour. Today stops at the last half hour so far. */
export function halfHours(of: Day): number[] {
  if (sameDay(of.date, today))
    return [60, 75, 55, 40, 50, 65, 45, 80, 70, 95, 160, 690, 1310, 1120, 1060];
  if (of.steps === null) return [];
  // A day's steps spread over waking hours, with the date as the seed.
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
