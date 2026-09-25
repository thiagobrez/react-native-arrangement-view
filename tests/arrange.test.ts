import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { arrange, type Fold, type Geometry } from '../src/arrange.ts';

// Windows named for the Pixel 10 Pro Fold, in dp. The arrangement fills each.
const window = (width: number, height: number): Geometry => ({
  width,
  height,
  window: { width, height },
});
const coverPortrait = window(440, 960); // compact width, expanded height
const coverLandscape = window(960, 440); // expanded width, compact height
const inner = window(850, 880); // expanded width, medium height
const phone = window(400, 700); // compact width, medium height
const mediumTablet = window(700, 700); // medium width, medium height
const full = ({ width, height }: Geometry) => ({
  left: 0,
  top: 0,
  width,
  height,
});

// A seamless fold down the middle of `inner`, the way WindowManager reports it.
const bookFold: Fold = {
  x: 425,
  y: 0,
  width: 0,
  height: 880,
  orientation: 'vertical',
  separating: true,
  halfOpened: true,
};
const flatFold: Fold = { ...bookFold, separating: false, halfOpened: false };
const book: Geometry = { ...inner, fold: bookFold };
const tabletop: Geometry = {
  ...window(880, 850),
  fold: {
    ...bookFold,
    x: 0,
    y: 425,
    width: 880,
    height: 0,
    orientation: 'horizontal',
  },
};

const split = { arrangement: 'split', axes: 'both' } as const;
const overlay = { arrangement: 'overlay', axes: 'both' } as const;

test('an expanded-width window puts the panes side by side', () => {
  assert.deepEqual(arrange(inner, split), {
    primary: { left: 0, top: 0, width: 425, height: 880 },
    secondary: { left: 425, top: 0, width: 425, height: 880 },
  });
  // From 480 dp tall, the end of compact height.
  const shortest = window(960, 480);
  assert.deepEqual(arrange(shortest, split), {
    primary: { left: 0, top: 0, width: 480, height: 480 },
    secondary: { left: 480, top: 0, width: 480, height: 480 },
  });
});

test('a compact-height window, such as a phone in landscape, shows one pane', () => {
  for (const axes of ['both', 'horizontal', 'vertical'] as const) {
    assert.deepEqual(arrange(coverLandscape, { ...split, axes }), {
      primary: full(coverLandscape),
      secondary: null,
    });
  }
  assert.deepEqual(arrange(coverLandscape, overlay), {
    primary: full(coverLandscape),
    secondary: full(coverLandscape),
  });
});

test('a single-column window stacks the panes only when it has expanded height', () => {
  assert.deepEqual(arrange(coverPortrait, split), {
    primary: { left: 0, top: 0, width: 440, height: 480 },
    secondary: { left: 0, top: 480, width: 440, height: 480 },
  });
  assert.deepEqual(arrange(phone, split), {
    primary: full(phone),
    secondary: null,
  });
});

test('a medium-width window shows one pane', () => {
  assert.deepEqual(arrange(mediumTablet, split), {
    primary: full(mediumTablet),
    secondary: null,
  });
});

test('a half-open hinge splits the panes whatever the window size', () => {
  const narrowBook = {
    ...mediumTablet,
    fold: { ...bookFold, x: 350, height: 700 },
  };
  assert.deepEqual(arrange(narrowBook, split), {
    primary: { left: 0, top: 0, width: 338, height: 700 },
    secondary: { left: 362, top: 0, width: 338, height: 700 },
  });
});

test('the window decides, not the arrangement inside it', () => {
  // A wide arrangement in a tall single-column window still stacks.
  const banner = { width: 400, height: 200, window: coverPortrait.window };
  assert.deepEqual(arrange(banner, split), {
    primary: { left: 0, top: 0, width: 400, height: 100 },
    secondary: { left: 0, top: 100, width: 400, height: 100 },
  });
});

test('an axis restriction hides the secondary rather than choosing another axis', () => {
  assert.deepEqual(arrange(inner, { ...split, axes: 'vertical' }), {
    primary: full(inner),
    secondary: null,
  });
  assert.deepEqual(arrange(coverPortrait, { ...split, axes: 'horizontal' }), {
    primary: full(coverPortrait),
    secondary: null,
  });
});

test('overlay stacks both panes at full size when no hinge separates them', () => {
  for (const geometry of [inner, phone, { ...inner, fold: flatFold }]) {
    assert.deepEqual(arrange(geometry, overlay), {
      primary: full(geometry),
      secondary: full(geometry),
    });
  }
});

test('a half-open hinge separates the panes by hingeGap, centred on the crease', () => {
  assert.deepEqual(arrange(book, split), {
    primary: { left: 0, top: 0, width: 413, height: 880 },
    secondary: { left: 437, top: 0, width: 413, height: 880 },
  });
  assert.deepEqual(arrange(book, { ...split, hingeGap: 40 }), {
    primary: { left: 0, top: 0, width: 405, height: 880 },
    secondary: { left: 445, top: 0, width: 405, height: 880 },
  });
  // The gap is never narrower than a physical hinge.
  const thick = { ...book, fold: { ...bookFold, x: 415, width: 20 } };
  assert.deepEqual(arrange(thick, { ...split, hingeGap: 0 }), {
    primary: { left: 0, top: 0, width: 415, height: 880 },
    secondary: { left: 435, top: 0, width: 415, height: 880 },
  });
});

test('the hinge picks the split axis: tabletop stacks even in a wide window', () => {
  assert.deepEqual(arrange(tabletop, split), {
    primary: { left: 0, top: 0, width: 880, height: 413 },
    secondary: { left: 0, top: 437, width: 880, height: 413 },
  });
});

test('flat, the panes touch; hingePolicy decides which hinges to avoid', () => {
  const flat = { ...inner, fold: flatFold };
  assert.deepEqual(arrange(flat, split), arrange(inner, split));
  assert.deepEqual(
    arrange(flat, { ...split, hingePolicy: 'alwaysAvoid' }),
    arrange(book, split)
  );
  // An off-centre half-open hinge, ignored: the panes halve the window and touch.
  const offCentre = { ...book, fold: { ...bookFold, x: 300 } };
  assert.deepEqual(
    arrange(offCentre, { ...split, hingePolicy: 'neverAvoid' }),
    arrange(inner, split)
  );
});

test('one pane beside a hinge stays on its leading side', () => {
  // The hinge's axis is excluded...
  assert.deepEqual(arrange(book, { ...split, axes: 'vertical' }), {
    primary: { left: 0, top: 0, width: 413, height: 880 },
    secondary: null,
  });
  assert.deepEqual(arrange(tabletop, { ...split, axes: 'horizontal' }), {
    primary: { left: 0, top: 0, width: 880, height: 413 },
    secondary: null,
  });
  // ...or a flat hinge is avoided in a window too narrow for two panes.
  const narrowFlat = {
    ...mediumTablet,
    fold: { ...flatFold, x: 350, height: 700 },
  };
  assert.deepEqual(
    arrange(narrowFlat, { ...split, hingePolicy: 'alwaysAvoid' }),
    { primary: { left: 0, top: 0, width: 338, height: 700 }, secondary: null }
  );
});

test('overlay separated by a hinge puts the primary pane after it', () => {
  assert.deepEqual(arrange(book, overlay), {
    primary: { left: 437, top: 0, width: 413, height: 880 },
    secondary: { left: 0, top: 0, width: 413, height: 880 },
  });
  assert.deepEqual(arrange(tabletop, overlay), {
    primary: { left: 0, top: 437, width: 880, height: 413 },
    secondary: { left: 0, top: 0, width: 880, height: 413 },
  });
  // When the hinge cannot separate them, the panes overlay across it.
  assert.deepEqual(arrange(book, { ...overlay, axes: 'vertical' }), {
    primary: full(book),
    secondary: full(book),
  });
});

test('a fold that does not cross the arrangement separates nothing', () => {
  for (const x of [-300, 0, 850, 1200]) {
    const fold = { ...bookFold, x };
    assert.deepEqual(arrange({ ...inner, fold }, split), arrange(inner, split));
  }
});

test('right-to-left mirrors which side is leading', () => {
  const rtl = { ...split, rtl: true };
  assert.deepEqual(arrange(inner, rtl), {
    primary: { left: 425, top: 0, width: 425, height: 880 },
    secondary: { left: 0, top: 0, width: 425, height: 880 },
  });
  assert.deepEqual(arrange(book, { ...rtl, axes: 'vertical' }), {
    primary: { left: 437, top: 0, width: 413, height: 880 },
    secondary: null,
  });
  assert.deepEqual(arrange(book, { ...overlay, rtl: true }).primary, {
    left: 0,
    top: 0,
    width: 413,
    height: 880,
  });
  // Stacked panes are unaffected.
  assert.deepEqual(arrange(coverPortrait, rtl), arrange(coverPortrait, split));
});
