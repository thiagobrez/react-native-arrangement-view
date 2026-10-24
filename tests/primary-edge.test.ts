import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { resolvePrimaryEdge } from '../src/primaryEdge.ts';
import { untyped } from './untyped.ts';

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

test('a pair sets the horizontal side, then the vertical one', () => {
  assert.deepEqual(resolvePrimaryEdge(['leading', 'bottom']), {
    horizontal: 'leading',
    vertical: 'bottom',
    problems: [],
  });
});

test('any other array is ignored and reported', () => {
  const invalid = [
    ['top', 'leading'],
    ['leading', 'trailing'],
    ['leading'],
    [],
    ['leading', 'top', 'bottom'],
  ];
  for (const value of invalid) {
    const edges = resolvePrimaryEdge(untyped(value));
    assert.equal(edges.horizontal, undefined);
    assert.equal(edges.vertical, undefined);
    assert.equal(edges.problems.length, 1);
    assert.match(edges.problems[0]!, /in that order/);
  }
});
