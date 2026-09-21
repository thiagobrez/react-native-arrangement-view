import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { arrange } from '../src/arrange.ts';

const landscape = { width: 800, height: 400 };
const portrait = { width: 400, height: 800 };
const full = (size: { width: number; height: number }) => ({
  left: 0,
  top: 0,
  ...size,
});

test('split halves the longer side when no fold separates the arrangement', () => {
  assert.deepEqual(arrange(landscape, 'split', 'both'), {
    primary: { left: 0, top: 0, width: 400, height: 400 },
    secondary: { left: 400, top: 0, width: 400, height: 400 },
  });
  assert.deepEqual(arrange(portrait, 'split', 'both'), {
    primary: { left: 0, top: 0, width: 400, height: 400 },
    secondary: { left: 0, top: 400, width: 400, height: 400 },
  });
});

test('an axis restriction hides the secondary rather than forcing a split', () => {
  assert.deepEqual(arrange(portrait, 'split', 'horizontal'), {
    primary: full(portrait),
    secondary: null,
  });
  assert.deepEqual(arrange(landscape, 'split', 'vertical'), {
    primary: full(landscape),
    secondary: null,
  });
  assert.notEqual(arrange(landscape, 'split', 'horizontal').secondary, null);
  assert.notEqual(arrange(portrait, 'split', 'vertical').secondary, null);
});

test('overlay stacks both panes at full size when no fold separates them', () => {
  for (const axes of ['both', 'horizontal', 'vertical'] as const) {
    assert.deepEqual(arrange(landscape, 'overlay', axes), {
      primary: full(landscape),
      secondary: full(landscape),
    });
  }
});

test('a separating fold splits either arrangement around itself', () => {
  // A vertical hinge 20 wide, off-centre because the arrangement is inset.
  const book = {
    ...landscape,
    fold: { x: 420, y: -50, width: 20, height: 500 },
  };
  const sideBySide = {
    primary: { left: 0, top: 0, width: 420, height: 400 },
    secondary: { left: 440, top: 0, width: 360, height: 400 },
  };
  assert.deepEqual(arrange(book, 'split', 'both'), sideBySide);
  assert.deepEqual(arrange(book, 'overlay', 'both'), sideBySide);

  // A seamless horizontal fold: no gap, and it wins over the longer side.
  const tabletop = {
    ...landscape,
    fold: { x: 0, y: 150, width: 800, height: 0 },
  };
  assert.deepEqual(arrange(tabletop, 'split', 'both'), {
    primary: { left: 0, top: 0, width: 800, height: 150 },
    secondary: { left: 0, top: 150, width: 800, height: 250 },
  });
});

test('a fold along an excluded axis is ignored', () => {
  const book = { ...landscape, fold: { x: 400, y: 0, width: 0, height: 400 } };
  assert.deepEqual(arrange(book, 'split', 'vertical'), {
    primary: full(landscape),
    secondary: null,
  });
  assert.deepEqual(arrange(book, 'overlay', 'vertical'), {
    primary: full(landscape),
    secondary: full(landscape),
  });
});

test('a fold that does not cross the arrangement separates nothing', () => {
  const unsplit = arrange(landscape, 'split', 'both');
  for (const x of [-300, 0, 800, 1200]) {
    const fold = { x, y: 0, width: 0, height: 400 };
    assert.deepEqual(arrange({ ...landscape, fold }, 'split', 'both'), unsplit);
  }
});

test('right-to-left puts the primary pane on the right', () => {
  assert.deepEqual(arrange(landscape, 'split', 'both', true), {
    primary: { left: 400, top: 0, width: 400, height: 400 },
    secondary: { left: 0, top: 0, width: 400, height: 400 },
  });
  // Stacked panes are unaffected.
  assert.deepEqual(
    arrange(portrait, 'split', 'both', true),
    arrange(portrait, 'split', 'both')
  );
});
