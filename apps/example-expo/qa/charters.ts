export type Platform = 'ios' | 'android';

export interface Charter {
  readonly id: string;
  /** The example's title in the app's list. */
  readonly example: string;
  readonly goal: string;
  readonly platforms: readonly Platform[];
}

export type Selection =
  | { readonly kind: 'rotation'; readonly count: number }
  | { readonly kind: 'all' }
  | { readonly kind: 'ids'; readonly ids: readonly string[] };

const both = ['ios', 'android'] as const;

export const charters: readonly Charter[] = [
  {
    id: 'features-split',
    example: 'Features demo',
    platforms: both,
    goal: `Check where the default split arrangement puts its two panes in every posture. Fold the device closed, open "Features demo" and keep the default chips (Split, Both, Default edge, Default vertical edge). Visit closed, half-open (book), half-open in landscape (tabletop, then back to portrait) and open, and in each read both panes' size and layout lines. The panes must stay inside the area below the chips and never overlap. At a half-open hinge they must sit on either side of it with the gap the platform keeps and nothing across the crease: side by side in book with the primary on the leading side, stacked in tabletop with the primary on top. Both panes' layout lines must agree with each other and with the screen.`,
  },
  {
    id: 'features-overlay',
    example: 'Features demo',
    platforms: both,
    goal: `Check the overlay arrangement in every posture. Fold the device closed, open "Features demo" and tap "Overlay". Visit closed, open, half-open (book) and half-open in landscape (tabletop). Closed and open, both panes must fill the arrangement with the primary in front and the layout lines must say Overlapping. At a half-open hinge the panes must separate on either side of it, the primary after the hinge: on the trailing side in book, below the hinge in tabletop. Then, in tabletop, tap "Primary top" and "Primary bottom" and check the primary moves above and below the hinge. Tap the Taps button of each pane in each posture: a pane behind another must still get taps where nothing covers it.`,
  },
  {
    id: 'features-axes',
    example: 'Features demo',
    platforms: both,
    goal: `Check that axes limits the directions the panes may take. Fold the device closed and open "Features demo". With "Horizontal" selected, visit book (half-open), tabletop (half-open in landscape) and closed: panes may only be side by side, so wherever the posture calls for stacking, the primary must show alone and the layout lines must say Primary only. With "Vertical" selected, visit the same postures: panes may only be stacked, so in book the primary must show alone. With "Both", both directions are allowed again. Check that switching axes and folding in different orders always ends in the same layout for the same posture and props.`,
  },
  {
    id: 'features-primary-edge',
    example: 'Features demo',
    platforms: both,
    goal: `Check that primaryEdge puts the primary pane on the side it names. Fold the device closed, open "Features demo", then fold half-open (book). With Split, tap "Primary trailing", "Primary leading" and "Default edge" in turn: the primary must be on the right, the left and the left. Repeat while open, if the panes are side by side there. Switch to tabletop (landscape, half-open): a split's primary must stay on top whatever vertical edge chip is selected. Tap "Overlay" and try "Primary top", "Primary bottom" and "Default vertical edge": the primary must go above, below and below the hinge. Combine a horizontal and a vertical edge chip and fold between book and tabletop: each posture must follow the chip for its own direction.`,
  },
  {
    id: 'features-hinge-state',
    example: 'Features demo',
    platforms: both,
    goal: `Check that the hinge state each pane shows follows the device. Fold the device closed, open "Features demo", then visit half-open, open, closed and half-open again, in different orders, and in landscape too. In each posture both panes must show the same hinge angle and status as each other, and they must match the posture: closed reads closed, half-open reads partiallyOpen with an angle between closed and flat, open reads fullyOpen near 180°. A pane's Taps count must survive every fold, because folding must not remount the panes. Look for a reading that stays stale after the device settles.`,
  },
  {
    id: 'step-tracker',
    example: 'Step tracker',
    platforms: both,
    goal: `Check the Step tracker, which arranges a dashboard (primary) and a history calendar (secondary) side by side only, with the dashboard on the trailing side. Fold the device closed and open "Step tracker". Visit closed, book (half-open), open and tabletop (half-open in landscape). Where the calendar fits beside the dashboard, it must be on the leading side and the dashboard on the trailing side, clear of the hinge. Where it does not fit, as in tabletop, the dashboard must show alone and the header's Calendar button must open the calendar in a sheet; folding into a posture that shows the calendar pane must close that sheet. Select a day in one pane and check the other pane follows. Visit the Activities and Insights tabs in each posture too.`,
  },
  {
    id: 'video-player',
    example: 'Video player',
    platforms: both,
    goal: `Check the Video player, an overlay with the controls as the primary pane over the video. Fold the device closed and open "Video player". Closed and open, the video must fill the screen with the controls over it; while it plays the controls hide a few seconds after the last touch and come back on a tap. Half-open in landscape (tabletop), the video must take the upper half and the controls the lower half, always visible. Half-open in portrait (book), the video must take the leading half and the controls the trailing half. Start playback, then fold through every posture: the video must keep playing and the elapsed time must keep counting, never reset, because folding must not remount the panes. Use play, pause, skip, rate and mute in each posture.`,
  },
  {
    id: 'native-components',
    example: 'Native components',
    platforms: both,
    goal: `Check that a system bottom sheet over an ArrangementView keeps working as the device folds. Fold the device closed, open "Native components" and open the sheet. Visit closed, open, book (half-open) and tabletop (half-open in landscape) with the sheet open, and again opening it in each posture. The placement caption in the panes must say the layout they show: One pane, Side by side or Stacked. On iOS the system moves the sheet to the left half in book; on Android the sheet stays in the middle, across the fold. Both are the platform's behavior. A defect is a pane laid out wrong behind the sheet, a caption that disagrees with the panes, or a sheet that can't be opened or closed.`,
  },
  {
    id: 'split-view',
    example: 'Split view',
    platforms: ['ios'],
    goal: `Check an ArrangementView inside the details column of a split view. Fold the device closed, open "Split view" and pick a trail in the sidebar. Visit open, half-open (book), closed and half-open again. Half-open, the example hides the sidebar, so the details column spans the hinge and its two panes (the trail's overview and its notes) must sit on either side of the hinge. With the sidebar shown, the details column doesn't span the hinge, so the panes must stay stacked. Show and hide the sidebar with its button in each posture and check the panes follow. The sidebar's state lines must match the screen: Collapsed or Expanded, its width, and the hinge.`,
  },
  {
    id: 'tent-posture',
    example: 'Tent posture',
    platforms: both,
    goal: `Check the Tent posture example, a bedside clock (primary) with the alarm settings (secondary). The harness can't pose a tent, so check the other postures. Fold the device closed and open "Tent posture". Closed, the settings must be stacked below the clock where the display is tall enough, or the clock alone. Half-open in landscape (tabletop), the clock must be on the upper half and the settings on the lower half. Half-open in portrait (book), the clock must be on the leading half and the settings on the trailing half. Open, the clock and the settings must be side by side. Tap "Preview wake-up" in each posture and check the glow plays in the clock and the settings stay usable.`,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function dayIndex(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

export function pickCharters(
  all: readonly Charter[],
  platform: Platform,
  day: number,
  count: number
): Charter[] {
  const eligible = all.filter((charter) =>
    charter.platforms.includes(platform)
  );
  if (count >= eligible.length) return eligible;
  const start = (day * count) % eligible.length;
  return Array.from(
    { length: count },
    (_, offset) => eligible[(start + offset) % eligible.length]!
  );
}

export function parseSelection(value: string, count: number): Selection {
  const trimmed = value.trim();
  if (trimmed === '') return { kind: 'rotation', count };
  if (trimmed === 'all') return { kind: 'all' };
  return { kind: 'ids', ids: trimmed.split(/[\s,]+/).filter(Boolean) };
}

export function selectCharters(
  all: readonly Charter[],
  platform: Platform,
  selection: Selection,
  day: number
): Charter[] {
  switch (selection.kind) {
    case 'rotation':
      return pickCharters(all, platform, day, selection.count);
    case 'all':
      return all.filter((charter) => charter.platforms.includes(platform));
    case 'ids':
      return selection.ids.map((id) => {
        const charter = all.find((candidate) => candidate.id === id);
        if (charter === undefined) {
          throw new Error(
            `No charter "${id}". Charters: ${all.map((c) => c.id).join(', ')}`
          );
        }
        if (!charter.platforms.includes(platform)) {
          throw new Error(`Charter "${id}" doesn't run on ${platform}`);
        }
        return charter;
      });
  }
}
