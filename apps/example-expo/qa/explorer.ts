import { setTimeout as sleep } from 'node:timers/promises';
import { anthropic } from '@ai-sdk/anthropic';
import { tool } from 'ai';
import type { AgentConfig } from 'e2e';
import { defineTool } from 'e2e/agent';
import type { EngineHandle } from 'e2e/engine';
import { mobileTools, unstable_deviceSession } from '@e2e-dev/mobile/tools';
import { z } from 'zod';

const context = `This is the example app of react-native-arrangement-view, a library that arranges two panes, a primary and a secondary, around a foldable's hinge. Its home screen lists the examples by title: Features demo, Step tracker, Video player, Split view (iOS only), Tent posture and Native components.

Features demo: the chips at the top set the props of the ArrangementView below them. Split and Overlay set arrangement. Both, Horizontal and Vertical set axes. Default edge, Primary leading and Primary trailing set the horizontal primaryEdge, and Default vertical edge, Primary top and Primary bottom the vertical one. Each pane is titled Primary or Secondary and shows, top to bottom: its size as "width × height pt" (on Android the numbers are dp, though the label says pt), the hinge angle ("No hinge" or degrees) and status (unknown, closed, partiallyOpen or fullyOpen), the layout the library reports (Side by side, Stacked, Primary only, Overlapping, or Layout unknown before the first report), and a "Taps: N" button that counts taps on it.

The other examples show their layout on screen: Native components captions it as One pane, Side by side or Stacked, and Split view's sidebar shows Collapsed or Expanded, its width in pt, and the hinge.

Postures, as the fold and set_orientation tools reach them: closed puts the app on the outer display, where no hinge crosses the window. half-open in portrait is book posture, with a vertical hinge down the middle of the inner display. half-open after set_orientation to landscape-left or landscape-right is tabletop, with the hinge across the screen. open is the inner display lying flat.`;

const system = `You are checking what react-native-arrangement-view promises on a foldable. Judge a screen against these promises only.

- Every visible pane lies inside the ArrangementView's area, with a positive size. In Features demo that area is everything below the chips.
- A split's panes never overlap: they are side by side or stacked, and together they span the area across their axis.
- A half-open hinge splits a split's panes along it, one on each side, with nothing across the crease, unless axes excludes that direction. Android keeps the panes hingeGap apart, 24 dp by default, centred on the hinge. iOS keeps 20 pt clear on each side of it. A hinge with no room for that gap is ignored: on Android one closer to the area's edge than half the gap, on iOS one less than 20 pt inside it.
- In tabletop, a split shows both panes stacked, unless axes is "horizontal".
- axes: a split never goes along an excluded direction ("horizontal" is side by side, "vertical" is stacked). The primary pane shows alone instead: on Android on one side of the hinge (leading, or the top), on iOS across the hinge.
- Without a hinge to split at, the window decides. Android: two panes side by side from 840 dp wide, stacked in a window at least 900 dp tall or in tabletop, and never two panes in a window under 480 dp tall. iOS: side by side needs a regular width size class and stacked a regular height one; when both are regular the longer side is halved; when both are compact the primary shows alone.
- overlay gives both panes the whole area, the primary in front, until a half-open hinge separates them. Then the primary goes after the hinge: on the trailing side, or below the hinge in tabletop.
- primaryEdge: side by side, a split's primary is on the leading side (left) by default and an overlay's on the trailing side (right); "leading" and "trailing" choose it. Stacked, a split's primary is always on top, and an overlay's is below the hinge unless primaryEdge names "top" or "bottom".
- The layout a pane reports (Side by side, Stacked, Primary only, Overlapping) matches what the screen shows, and both panes report the same layout and the same hinge.
- Folding never remounts a pane: counts, selections and playback survive every posture change.

How to work:
- Use the fold tool to change posture and set_orientation for tabletop. After each, observe again before you judge: the layout settles a moment after the device does.
- Read the sizes the panes report and do the arithmetic before you call a size wrong. When a promise depends on a size class or a threshold you can't read off the screen, and the layout could still be right, report a warning, not an issue.
- Example content is placeholder by design: the steps, trails, times, clock, video and copy are fake, and a number in them that doesn't add up is not a defect. A defect is a promise above that breaks, or an example screen whose own layout breaks: clipped or overlapping content, a control that can't be reached or doesn't respond.
- These are limits of this harness, never defects: a fold takes 10 to 20 s on iOS and a few seconds on Android; a "Swipe up to continue" or lock screen after folding closed on Android; an Android "System UI isn't responding" dialog; the back gesture not working on the iPhone Duo's inner display (fold closed, go back, then fold again); no way to pose a tent; a tool call that fails or times out.
- In each finding, write the reproduction as the steps from the app's home screen, starting with "Fold the device closed", naming each tool call and chip tap, and the expected result as one checkable sentence about the final screen.`;

/** The layout reacts a moment after agent-device confirms the posture, and the next observation should read it. */
const SETTLE_MS = 1500;

export function explorer(
  ...engines: readonly [EngineHandle, ...EngineHandle[]]
): AgentConfig {
  const fold = defineTool(
    tool({
      description:
        'Put the foldable in a hinge pose. closed lights the outer display. half-open is book posture, or tabletop after set_orientation to a landscape orientation. open lays the inner display flat. Observe the screen again afterwards.',
      inputSchema: z.object({ pose: z.enum(['closed', 'half-open', 'open']) }),
      execute: async ({ pose }) => {
        const { client, selection } = unstable_deviceSession(...engines);
        await client.command.fold({ ...selection, pose });
        await sleep(SETTLE_MS);
        return `The device is ${pose}.`;
      },
    }),
    { mutates: true }
  );
  const setOrientation = defineTool(
    tool({
      description:
        'Rotate the device. A landscape orientation turns a half-open device from book posture into tabletop. Observe the screen again afterwards.',
      inputSchema: z.object({
        orientation: z.enum([
          'portrait',
          'portrait-upside-down',
          'landscape-left',
          'landscape-right',
        ]),
      }),
      execute: async ({ orientation }) => {
        const { client, selection } = unstable_deviceSession(...engines);
        await client.command.orientation({ ...selection, orientation });
        await sleep(SETTLE_MS);
        return `The device is in ${orientation}.`;
      },
    }),
    { mutates: true }
  );
  return {
    model: anthropic('claude-sonnet-5-5'),
    context,
    system,
    tools: {
      ...mobileTools(...engines),
      fold,
      set_orientation: setOrientation,
    },
  };
}
