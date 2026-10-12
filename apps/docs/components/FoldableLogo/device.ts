import { arrange, type Frame, type Geometry } from '../../../../src/arrange.ts';
import type { HingeStatus } from '../../../../src/types.ts';

/** How the device is held: standing like a book, laid on a table, or stood up as a tent. */
export type Orientation = 'upright' | 'tabletop' | 'tent';
export type Posture = 'closed' | 'open' | 'tabletop' | 'book' | 'tent';

/** The hinge angle is in degrees: 0 closed, 180 open flat. */
export interface Pose {
  orientation: Orientation;
  angle: number;
}

export const postures: readonly { id: Posture; label: string; pose: Pose }[] = [
  { id: 'closed', label: 'Closed', pose: { orientation: 'upright', angle: 0 } },
  { id: 'open', label: 'Open', pose: { orientation: 'upright', angle: 180 } },
  {
    id: 'tabletop',
    label: 'Tabletop',
    pose: { orientation: 'tabletop', angle: 100 },
  },
  { id: 'book', label: 'Book', pose: { orientation: 'upright', angle: 130 } },
  { id: 'tent', label: 'Tent', pose: { orientation: 'tent', angle: 80 } },
];

/** The logo is the device in book posture. */
export const initialPose: Pose = { orientation: 'upright', angle: 130 };

/**
 * The displays in dp, upright. They are sized after a book-style foldable, so
 * the cover is a compact width closed and a compact height on its side, and
 * the inner display is an expanded width.
 */
export const cover = { width: 470, height: 920 };
export const inner = { width: 1012, height: 920 };

// The cover display hands over to the inner one about here, and a hinge open
// further than FLAT_DEGREES no longer separates the panes.
const HANDOVER_DEGREES = 30;
const FLAT_DEGREES = 160;

export interface DeviceState {
  posture: Posture;
  status: HingeStatus;
  /** The display the app is on. */
  screen: 'cover' | 'inner';
  /** The app is turned a quarter, its top at the upright display's left. */
  landscape: boolean;
  /** The panes on that display, upright: `arrange` places them in the window. */
  primary: Frame;
  secondary: Frame | null;
  /** The layout in words, as the example app's panes put it. */
  panes: 'Primary only' | 'Side by side' | 'Stacked';
}

/**
 * What the device shows in a pose. The panes are placed by the library's own
 * `arrange`, the policy it applies on Android.
 */
export function describeDevice({ orientation, angle }: Pose): DeviceState {
  const status: HingeStatus =
    angle < HANDOVER_DEGREES
      ? 'closed'
      : angle < FLAT_DEGREES
        ? 'partiallyOpen'
        : 'fullyOpen';
  const posture: Posture =
    status === 'closed'
      ? 'closed'
      : status === 'fullyOpen'
        ? 'open'
        : orientation === 'upright'
          ? 'book'
          : orientation;

  // A tent keeps the app on the cover display, however far it is open.
  const screen =
    orientation === 'tent' || status === 'closed' ? 'cover' : 'inner';
  const landscape = orientation !== 'upright';
  const display = screen === 'cover' ? cover : inner;
  const window = landscape
    ? { width: display.height, height: display.width }
    : display;

  const halfOpened = status === 'partiallyOpen';
  const fold: Geometry['fold'] =
    screen === 'cover'
      ? undefined
      : landscape
        ? {
            x: 0,
            y: window.height / 2,
            width: window.width,
            height: 0,
            orientation: 'horizontal',
            separating: halfOpened,
            halfOpened,
          }
        : {
            x: window.width / 2,
            y: 0,
            width: 0,
            height: window.height,
            orientation: 'vertical',
            separating: halfOpened,
            halfOpened,
          };

  const frames = arrange(
    { ...window, window, fold },
    { arrangement: 'split', axes: 'both' }
  );
  // A window turned a quarter has its top at the display's left.
  const upright = (frame: Frame): Frame =>
    landscape
      ? {
          left: frame.top,
          top: window.width - frame.left - frame.width,
          width: frame.height,
          height: frame.width,
        }
      : frame;

  return {
    posture,
    status,
    screen,
    landscape,
    primary: upright(frames.primary),
    secondary: frames.secondary && upright(frames.secondary),
    panes: !frames.secondary
      ? 'Primary only'
      : frames.secondary.left > frames.primary.left
        ? 'Side by side'
        : 'Stacked',
  };
}
