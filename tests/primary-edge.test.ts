import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { resolvePrimaryEdge } from '../src/arrange.ts';

test('one side sets its own axis only', () => {
  assert.deepEqual(resolvePrimaryEdge('trailing'), {
    horizontal: 'trailing',
    problems: [],
  });
  assert.deepEqual(resolvePrimaryEdge('top'), {
    vertical: 'top',
    problems: [],
  });
  assert.deepEqual(resolvePrimaryEdge(undefined), { problems: [] });
});

test('an array sets a side for each axis, in any order', () => {
  assert.deepEqual(resolvePrimaryEdge(['bottom', 'leading']), {
    horizontal: 'leading',
    vertical: 'bottom',
    problems: [],
  });
  assert.deepEqual(resolvePrimaryEdge(['top', 'top']), {
    vertical: 'top',
    problems: [],
  });
});

test('two sides on one axis keep the first and report the other', () => {
  const edges = resolvePrimaryEdge(['leading', 'top', 'trailing', 'bottom']);
  assert.equal(edges.horizontal, 'leading');
  assert.equal(edges.vertical, 'top');
  assert.equal(edges.problems.length, 2);
  assert.match(edges.problems[0]!, /"leading" and "trailing"/);
});
