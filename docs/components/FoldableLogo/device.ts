import { describeLayout, type Frame } from '../../../src/layout.ts';
import type { HingeStatus } from '../../../src/types.ts';
import { PANES } from './panes.ts';

export type Hold = 'upright' | 'tabletop' | 'tent';
export type Posture = 'closed' | 'open' | 'tabletop' | 'book' | 'tent';

export interface Pose {
  hold: Hold;
  degrees: number;
}

export const postures: readonly { id: Posture; label: string; pose: Pose }[] = [
  { id: 'closed', label: 'Closed', pose: { hold: 'upright', degrees: 0 } },
  { id: 'open', label: 'Open', pose: { hold: 'upright', degrees: 180 } },
  {
    id: 'tabletop',
    label: 'Tabletop',
    pose: { hold: 'tabletop', degrees: 100 },
  },
  { id: 'book', label: 'Book', pose: { hold: 'upright', degrees: 130 } },
  { id: 'tent', label: 'Tent', pose: { hold: 'tent', degrees: 80 } },
];

export const logoPose = postures.find(({ id }) => id === 'book')!.pose;

export const coverDp = { width: 470, height: 920 };
export const innerDp = { width: 1012, height: 920 };

const CLOSED_BELOW_DEGREES = 30;
const FULLY_OPEN_FROM_DEGREES = 160;

const displayKey = (
  appDisplay: 'cover' | 'inner',
  landscape: boolean,
  halfOpened: boolean
) =>
  `${appDisplay}${landscape ? ' landscape' : ''}${
    appDisplay === 'inner' && halfOpened ? ' half-open' : ''
  }` as keyof typeof PANES;

type DisplayFrame = Frame;

export interface DeviceState {
  posture: Posture;
  status: HingeStatus;
  appDisplay: 'cover' | 'inner';
  landscape: boolean;
  primary: DisplayFrame;
  secondary: DisplayFrame | null;
  panes: 'Primary only' | 'Side by side' | 'Stacked';
}

export function describeDevice({ hold, degrees }: Pose): DeviceState {
  const status: HingeStatus =
    degrees < CLOSED_BELOW_DEGREES
      ? 'closed'
      : degrees < FULLY_OPEN_FROM_DEGREES
        ? 'partiallyOpen'
        : 'fullyOpen';
  const posture: Posture =
    status === 'closed'
      ? 'closed'
      : status === 'fullyOpen'
        ? 'open'
        : hold === 'upright'
          ? 'book'
          : hold;

  const appDisplay = hold === 'tent' || status === 'closed' ? 'cover' : 'inner';
  const landscape = hold !== 'upright';
  const display = appDisplay === 'cover' ? coverDp : innerDp;
  const window = landscape
    ? { width: display.height, height: display.width }
    : display;
  const frames =
    PANES[displayKey(appDisplay, landscape, status === 'partiallyOpen')];
  const toDisplayFrame = (frame: Frame): DisplayFrame =>
    landscape
      ? {
          left: frame.top,
          top: window.width - frame.left - frame.width,
          width: frame.height,
          height: frame.width,
        }
      : frame;

  const layout = describeLayout(frames);

  return {
    posture,
    status,
    appDisplay,
    landscape,
    primary: toDisplayFrame(frames.primary),
    secondary: frames.secondary && toDisplayFrame(frames.secondary),
    panes: !layout.secondaryVisible
      ? 'Primary only'
      : layout.axis === 'horizontal'
        ? 'Side by side'
        : 'Stacked',
  };
}
