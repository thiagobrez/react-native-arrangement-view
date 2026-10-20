import type { PaneFrames } from '../../../src/layout.ts';

/**
 * Where Android's pane policy, cpp/arrange.h, puts the panes on each display,
 * for arrangeInput() in device.ts. tests/foldable-logo.test.ts recomputes them
 * and prints the table to paste here when it is stale.
 */
export const PANES = {
  'cover': {
    primary: { left: 0, top: 0, width: 470, height: 460 },
    secondary: { left: 0, top: 460, width: 470, height: 460 },
  },
  'cover landscape': {
    primary: { left: 0, top: 0, width: 920, height: 470 },
    secondary: null,
  },
  'inner': {
    primary: { left: 0, top: 0, width: 506, height: 920 },
    secondary: { left: 506, top: 0, width: 506, height: 920 },
  },
  'inner half-open': {
    primary: { left: 0, top: 0, width: 494, height: 920 },
    secondary: { left: 518, top: 0, width: 494, height: 920 },
  },
  'inner landscape': {
    primary: { left: 0, top: 0, width: 460, height: 1012 },
    secondary: { left: 460, top: 0, width: 460, height: 1012 },
  },
  'inner landscape half-open': {
    primary: { left: 0, top: 0, width: 920, height: 494 },
    secondary: { left: 0, top: 518, width: 920, height: 494 },
  },
} satisfies Record<string, PaneFrames>;
