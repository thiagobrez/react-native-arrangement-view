import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { arrange, type Fold, type Geometry } from './harness/arrange.ts';
import { untyped } from './untyped.ts';

const window = (width: number, height: number): Geometry => ({
  width,
  height,
  window: { width, height },
});
const coverPortrait = window(440, 960);
const coverLandscape = window(960, 440);
const inner = window(850, 880);
const phone = window(400, 700);
const mediumTablet = window(700, 700);
const full = ({ width, height }: Geometry) => ({
  left: 0,
  top: 0,
  width,
  height,
});

const bookFold: Fold = {
  x: inner.width / 2,
  y: 0,
  width: 0,
  height: inner.height,
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
  const shortest = window(960, 480);
  assert.deepEqual(
    arrange(shortest, split),
    {
      primary: { left: 0, top: 0, width: 480, height: 480 },
      secondary: { left: 480, top: 0, width: 480, height: 480 },
    },
    'two columns start at 480 dp tall'
  );
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
  const thick = { ...book, fold: { ...bookFold, x: 415, width: 20 } };
  assert.deepEqual(
    arrange(thick, { ...split, hingeGap: 0 }),
    {
      primary: { left: 0, top: 0, width: 415, height: 880 },
      secondary: { left: 435, top: 0, width: 415, height: 880 },
    },
    'the gap is never narrower than a physical hinge'
  );
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
  const offCentre = { ...book, fold: { ...bookFold, x: 300 } };
  assert.deepEqual(
    arrange(offCentre, { ...split, hingePolicy: 'neverAvoid' }),
    arrange(inner, split),
    'the panes halve the window and touch across an ignored off-centre hinge'
  );
});

test('one pane beside a hinge stays on its leading side', () => {
  assert.deepEqual(
    arrange(book, { ...split, axes: 'vertical' }),
    { primary: { left: 0, top: 0, width: 413, height: 880 }, secondary: null },
    "axes excludes the book hinge's axis"
  );
  assert.deepEqual(
    arrange(tabletop, { ...split, axes: 'horizontal' }),
    { primary: { left: 0, top: 0, width: 880, height: 413 }, secondary: null },
    "axes excludes the tabletop hinge's axis"
  );
  const narrowFlat = {
    ...mediumTablet,
    fold: { ...flatFold, x: 350, height: 700 },
  };
  assert.deepEqual(
    arrange(narrowFlat, { ...split, hingePolicy: 'alwaysAvoid' }),
    { primary: { left: 0, top: 0, width: 338, height: 700 }, secondary: null },
    'a flat hinge is avoided in a window too narrow for two panes'
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
});

test('overlay stacks both panes at full size across a hinge that axes excludes', () => {
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

test('a fold too close to the edge for hingeGap separates nothing, as on iOS', () => {
  const hingeGap = 24;
  const column = { width: 431.5, height: 880, window: inner.window };
  const options = [
    { ...split, hingeGap },
    { ...split, hingeGap, axes: 'vertical' },
    { ...overlay, hingeGap },
  ] as const;
  for (const x of [6.5, hingeGap / 2, column.width - hingeGap / 2]) {
    const geometry = { ...column, fold: { ...bookFold, x } };
    for (const o of options)
      assert.deepEqual(arrange(geometry, o), arrange(column, o));
  }
  const pastHalfGap = {
    ...column,
    fold: { ...bookFold, x: hingeGap / 2 + 0.5 },
  };
  assert.deepEqual(arrange(pastHalfGap, options[0]), {
    primary: { left: 0, top: 0, width: 0.5, height: 880 },
    secondary: { left: 24.5, top: 0, width: 407, height: 880 },
  });
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
  assert.deepEqual(
    arrange(coverPortrait, rtl),
    arrange(coverPortrait, split),
    'stacked panes are unaffected'
  );
});

test('primaryEdge puts the primary pane on the leading or trailing side', () => {
  const left = { left: 0, top: 0, width: 425, height: 880 };
  const right = { left: 425, top: 0, width: 425, height: 880 };
  for (const rtl of [false, true]) {
    const [leading, trailing] = rtl ? [right, left] : [left, right];
    assert.deepEqual(
      arrange(inner, { ...split, rtl, primaryEdge: 'trailing' }),
      { primary: trailing, secondary: leading }
    );
    assert.deepEqual(
      arrange(inner, { ...split, rtl, primaryEdge: 'leading' }),
      arrange(inner, { ...split, rtl })
    );
    const [beforeHinge, afterHinge] = [
      { left: 0, top: 0, width: 413, height: 880 },
      { left: 437, top: 0, width: 413, height: 880 },
    ];
    for (const options of [split, overlay]) {
      assert.deepEqual(
        arrange(book, { ...options, rtl, primaryEdge: 'trailing' }).primary,
        rtl ? beforeHinge : afterHinge
      );
      assert.deepEqual(
        arrange(book, { ...options, rtl, primaryEdge: 'leading' }).primary,
        rtl ? afterHinge : beforeHinge
      );
    }
  }
  assert.deepEqual(
    arrange(book, { ...split, axes: 'vertical', primaryEdge: 'trailing' }),
    {
      primary: { left: 437, top: 0, width: 413, height: 880 },
      secondary: null,
    },
    'one pane beside a hinge goes to that side too'
  );
  for (const geometry of [coverPortrait, tabletop]) {
    assert.deepEqual(
      arrange(geometry, { ...split, primaryEdge: 'trailing' }),
      arrange(geometry, split),
      'stacked panes are unaffected'
    );
  }
});

test("primaryEdge's top or bottom puts an overlay's primary pane above or below the hinge", () => {
  const above = { left: 0, top: 0, width: 880, height: 413 };
  const below = { left: 0, top: 437, width: 880, height: 413 };
  assert.deepEqual(arrange(tabletop, { ...overlay, primaryEdge: 'top' }), {
    primary: above,
    secondary: below,
  });
  assert.deepEqual(arrange(tabletop, { ...overlay, primaryEdge: 'bottom' }), {
    primary: below,
    secondary: above,
  });
  assert.deepEqual(
    arrange(tabletop, { ...split, primaryEdge: 'bottom' }),
    arrange(tabletop, split),
    "a split's primary pane stays on top, as on iOS"
  );
  for (const geometry of [book, inner, coverPortrait]) {
    for (const options of [split, overlay]) {
      assert.deepEqual(
        arrange(geometry, { ...options, primaryEdge: 'top' }),
        arrange(geometry, options),
        "primaryEdge 'top' moves only an overlay's stacked panes"
      );
    }
  }
});

test('primaryEdge takes a horizontal and a vertical side', () => {
  const edges = ['leading', 'top'] as const;
  assert.deepEqual(
    arrange(book, { ...overlay, primaryEdge: edges }),
    arrange(book, { ...overlay, primaryEdge: 'leading' })
  );
  assert.deepEqual(
    arrange(tabletop, { ...overlay, primaryEdge: edges }),
    arrange(tabletop, { ...overlay, primaryEdge: 'top' })
  );
  assert.deepEqual(
    arrange(tabletop, { ...overlay, primaryEdge: untyped(['top', 'leading']) }),
    arrange(tabletop, overlay),
    'a pair with the vertical side first is ignored'
  );
});
