import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createElement, Fragment } from 'react';
import {
  ArrangementPrimary,
  ArrangementSecondary,
  resolveSlots,
} from '../src/slots.ts';

const primary = () => createElement(ArrangementPrimary, null, 'p');
const secondary = () => createElement(ArrangementSecondary, null, 's');

test('slots are matched by identity in either order, with no problems', () => {
  const inOrder = resolveSlots([primary(), secondary()]);
  assert.equal(inOrder.primary?.type, ArrangementPrimary);
  assert.equal(inOrder.secondary?.type, ArrangementSecondary);
  assert.deepEqual(inOrder.problems, []);

  const reversed = resolveSlots([secondary(), primary()]);
  assert.equal(reversed.primary?.type, ArrangementPrimary);
  assert.equal(reversed.secondary?.type, ArrangementSecondary);
  assert.deepEqual(reversed.problems, []);
});

test('slot markers render only their children', () => {
  assert.equal(ArrangementPrimary({ children: 'p' }), 'p');
  assert.equal(ArrangementSecondary({ children: 's' }), 's');
});

test('missing slots are reported and left empty', () => {
  const { primary: p, secondary: s, problems } = resolveSlots(primary());
  assert.equal(p?.type, ArrangementPrimary);
  assert.equal(s, null);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /missing an ArrangementView\.Secondary/);
});

test('unexpected children are reported and ignored; falsy children are not', () => {
  const Custom = () => null;
  const { problems } = resolveSlots([
    primary(),
    secondary(),
    createElement(Custom),
    createElement('div'),
    createElement(Fragment, null, secondary()),
    'text',
    null,
    false,
    undefined,
  ]);
  assert.deepEqual(
    problems.map((m) => m.match(/unexpected child \((.*?)\)/)?.[1]),
    ['<Custom>', '<div>', '<Fragment>', 'string "text"']
  );
});

test('duplicate slots keep the first and report the rest', () => {
  const first = primary();
  const { primary: p, problems } = resolveSlots([
    first,
    primary(),
    secondary(),
  ]);
  assert.equal(p?.props, first.props);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /more than one ArrangementView\.Primary/);
});
