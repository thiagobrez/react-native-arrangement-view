import { useEffect, useState } from 'react';

export interface Alarm {
  hour: number;
  minute: number;
  /** Brighten the clock face before the alarm, like a sunrise. */
  glow: boolean;
  glowMinutes: number;
}

/** What's been done about the alarm since it was set. */
export interface Response {
  /** When the alarm was last stopped. */
  stoppedAt: number | null;
  /** When a snoozed alarm rings again. */
  snoozedUntil: number | null;
}

export const SNOOZE_MINUTES = 9;
// An alarm nobody stops gives up after this long, as the Clock app's does.
const RING_MINUTES = 15;
// The face turns red this long before the alarm, StandBy's night mode.
const NIGHT_HOURS = 9;
const MINUTE = 60_000;

export interface Wake {
  /** When the alarm next rings, or rang if it's ringing. */
  alarmAt: number;
  /** How far the glow has risen, from 0 to 1. */
  glow: number;
  ringing: boolean;
  /** The hours before the alarm, while it's still dark. */
  night: boolean;
}

export function wake(now: number, alarm: Alarm, response: Response): Wake {
  if (response.snoozedUntil !== null) {
    // A snoozed alarm stays lit until it rings again.
    return {
      alarmAt: response.snoozedUntil,
      glow: alarm.glow ? 1 : 0,
      ringing: now >= response.snoozedUntil,
      night: false,
    };
  }
  const date = new Date(now);
  date.setHours(alarm.hour, alarm.minute, 0, 0);
  const today = date.getTime();
  const done =
    now >= today + RING_MINUTES * MINUTE ||
    (response.stoppedAt !== null && response.stoppedAt >= today);
  if (done) date.setDate(date.getDate() + 1);
  const alarmAt = date.getTime();
  const glowFrom = alarmAt - alarm.glowMinutes * MINUTE;
  const glow = alarm.glow
    ? Math.min(1, Math.max(0, (now - glowFrom) / (alarmAt - glowFrom)))
    : 0;
  return {
    alarmAt,
    glow,
    ringing: now >= alarmAt,
    night: glow === 0 && now >= alarmAt - NIGHT_HOURS * 60 * MINUTE,
  };
}

/**
 * A clock that runs faster than real time from `at` until the alarm rings,
 * to preview a wake-up, and then at real time, so there's time to stop it.
 */
export interface Preview {
  at: number;
  until: number;
  speed: number;
  /** When the preview started, in real time. */
  startedAt: number;
}

function read(preview: Preview | null) {
  if (!preview) return Date.now();
  const { at, until, speed, startedAt } = preview;
  const elapsed = Date.now() - startedAt;
  const fast = (until - at) / speed;
  return elapsed < fast ? at + elapsed * speed : until + elapsed - fast;
}

/** The time now, or in the preview while one runs. */
export function useNow(preview: Preview | null): number {
  const [now, setNow] = useState(() => read(preview));
  useEffect(() => {
    const tick = () => setNow(read(preview));
    tick();
    // A preview's glow rises smoothly; otherwise the minutes only need to change on time.
    const id = setInterval(tick, preview ? 100 : 1000);
    return () => clearInterval(id);
  }, [preview]);
  return now;
}

// A preview starts in the night, which leaves a few seconds to stand the
// phone up, and lets the glow rise over this long.
const PREVIEW_LEAD_SECONDS = 10;
const PREVIEW_GLOW_SECONDS = 15;

/** A preview of the alarm's wake-up, starting in the night before its glow. */
export function previewWake(alarm: Alarm, now = Date.now()): Preview {
  const { alarmAt } = wake(now, alarm, { stoppedAt: null, snoozedUntil: null });
  const glowMinutes = alarm.glow ? alarm.glowMinutes : 10;
  const speed = (glowMinutes * MINUTE) / (PREVIEW_GLOW_SECONDS * 1000);
  return {
    at: alarmAt - glowMinutes * MINUTE - PREVIEW_LEAD_SECONDS * 1000 * speed,
    until: alarmAt,
    speed,
    startedAt: now,
  };
}

/** The preview, sped up again until a snoozed alarm rings. */
export function snoozePreview(preview: Preview, now: number, until: number) {
  return { ...preview, at: now, until, startedAt: Date.now() };
}
