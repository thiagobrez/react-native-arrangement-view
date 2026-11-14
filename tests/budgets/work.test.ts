import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  AndroidArrangement,
  HingeObserver,
  IosArrangement,
  measure,
  type NativeHinge,
  type NativePanes,
  type Step,
} from './measure.ts';

const fold: NativeHinge[] = [
  { available: true, angle: Math.PI, status: 'fullyOpen' },
  { available: true, angle: Math.PI, status: 'partiallyOpen' },
  { available: true, angle: 2.6, status: 'partiallyOpen' },
  { available: true, angle: 2.1, status: 'partiallyOpen' },
  { available: true, angle: Math.PI / 2, status: 'partiallyOpen' },
  { available: true, angle: 2.1, status: 'partiallyOpen' },
  { available: true, angle: Math.PI, status: 'fullyOpen' },
];
const halfOpenChanges = 2;
const sweep: Step[] = fold.flatMap((hinge) => [
  { hinge },
  { hinge: { ...hinge } },
]);

const rect = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
});
const sideBySide: NativePanes = {
  primary: rect(0, 0, 418, 800),
  secondary: rect(442, 0, 418, 800),
  secondaryVisible: true,
};
const stacked: NativePanes = {
  primary: rect(0, 0, 443, 485),
  secondary: rect(0, 509, 443, 485),
  secondaryVisible: true,
};
const primaryOnly: NativePanes = {
  primary: rect(0, 0, 443, 994),
  secondary: rect(0, 0, 0, 0),
  secondaryVisible: false,
};
const layouts = [sideBySide, stacked, primaryOnly];
const panes: Step[] = [
  { panes: sideBySide },
  { panes: { ...sideBySide } },
  {
    panes: {
      ...sideBySide,
      primary: rect(0, 0, 500, 800),
      secondary: rect(524, 0, 336, 800),
    },
  },
  { panes: stacked },
  { panes: primaryOnly },
];

const parentRenders = 5;
const rerenders: Step[] = Array.from({ length: parentRenders }, () => ({
  render: {},
}));

for (const [platform, host] of [
  ['android', AndroidArrangement],
  ['ios', IosArrangement],
] as const) {
  test(`${platform} ArrangementView: a hinge sweep renders each reader once per change to what it reads`, async () => {
    assert.deepEqual(await measure(host, sweep), {
      renders: {
        RNArrangementView: 1,
        angle: 1 + fold.length,
        halfOpen: 1 + halfOpenChanges,
        layout: 1,
        inert: 1,
      },
      callbacks: { angle: 1 + fold.length },
      nativeUpdates: {},
    });
  });

  test(`${platform} ArrangementView: pane events render layout readers once per new layout`, async () => {
    assert.deepEqual(await measure(host, panes), {
      renders: {
        RNArrangementView: 1,
        angle: 1,
        halfOpen: 1,
        layout: 1 + layouts.length,
        inert: 1,
      },
      callbacks: { angle: 1, onArrangementLayoutChange: layouts.length },
      nativeUpdates: {},
    });
  });

  test(`${platform} ArrangementView: a parent render with the same props renders no reader and sends nothing to native`, async () => {
    assert.deepEqual(await measure(host, rerenders), {
      renders: {
        RNArrangementView: 1 + parentRenders,
        angle: 1,
        halfOpen: 1,
        layout: 1,
        inert: 1,
      },
      callbacks: { angle: 1 },
      nativeUpdates: {},
    });
  });

  test(`${platform} ArrangementView: a prop the app changes reaches native once per change`, async () => {
    const steps: Step[] = [
      { render: { arrangement: 'overlay' } },
      { render: { arrangement: 'overlay' } },
      { render: {} },
    ];
    assert.deepEqual(await measure(host, steps), {
      renders: {
        RNArrangementView: 1 + steps.length,
        angle: 1,
        halfOpen: 1,
        layout: 1,
        inert: 1,
      },
      callbacks: { angle: 1 },
      nativeUpdates: { 'RNArrangementView.arrangement': 2 },
    });
  });
}

test('HingeObserver: a hinge sweep renders each reader once per change to what it reads', async () => {
  assert.deepEqual(await measure(HingeObserver, sweep), {
    renders: {
      RNHingeObserver: 1,
      angle: 1 + fold.length,
      halfOpen: 1 + halfOpenChanges,
      inert: 1,
    },
    callbacks: { angle: 1 + fold.length },
    nativeUpdates: {},
  });
});

test('HingeObserver: a parent render renders no reader and sends nothing to native', async () => {
  assert.deepEqual(await measure(HingeObserver, rerenders), {
    renders: {
      RNHingeObserver: 1 + parentRenders,
      angle: 1,
      halfOpen: 1,
      inert: 1,
    },
    callbacks: { angle: 1 },
    nativeUpdates: {},
  });
});
