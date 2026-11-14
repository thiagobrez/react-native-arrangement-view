import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  charters,
  parseSelection,
  pickCharters,
  selectCharters,
  type Charter,
} from './charters.ts';

const fixture: readonly Charter[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id,
  example: id,
  goal: id,
  platforms: id === 'c' ? ['ios'] : ['ios', 'android'],
}));

const ids = (list: readonly Charter[]) => list.map((charter) => charter.id);

test('consecutive days take consecutive slices of the platform charters', () => {
  assert.deepEqual(ids(pickCharters(fixture, 'android', 0, 2)), ['a', 'b']);
  assert.deepEqual(ids(pickCharters(fixture, 'android', 1, 2)), ['d', 'e']);
  assert.deepEqual(ids(pickCharters(fixture, 'android', 2, 2)), ['a', 'b']);
  assert.deepEqual(ids(pickCharters(fixture, 'ios', 2, 2)), ['e', 'a']);
});

test('every charter recurs within ceil(charters / count) days', () => {
  for (const platform of ['ios', 'android'] as const) {
    const eligible = charters.filter((c) => c.platforms.includes(platform));
    const days = Math.ceil(eligible.length / 2);
    const seen = new Set<string>();
    for (let day = 1000; day < 1000 + days; day++) {
      for (const charter of pickCharters(charters, platform, day, 2)) {
        seen.add(charter.id);
      }
    }
    assert.equal(
      seen.size,
      eligible.length,
      `${platform} covers every charter`
    );
  }
});

test('a count at or above the charters picks each once', () => {
  assert.deepEqual(ids(pickCharters(fixture, 'android', 7, 9)), [
    'a',
    'b',
    'd',
    'e',
  ]);
});

test('a selection names the rotation, every charter, or charter ids', () => {
  assert.deepEqual(parseSelection('', 2), { kind: 'rotation', count: 2 });
  assert.deepEqual(parseSelection(' all ', 2), { kind: 'all' });
  assert.deepEqual(parseSelection('a, b', 2), { kind: 'ids', ids: ['a', 'b'] });
  assert.deepEqual(ids(selectCharters(fixture, 'ios', { kind: 'all' }, 0)), [
    'a',
    'b',
    'c',
    'd',
    'e',
  ]);
});

test('an unknown charter or one for the other platform is an error', () => {
  assert.throws(
    () => selectCharters(fixture, 'ios', { kind: 'ids', ids: ['z'] }, 0),
    /No charter "z"/
  );
  assert.throws(
    () => selectCharters(fixture, 'android', { kind: 'ids', ids: ['c'] }, 0),
    /doesn't run on android/
  );
});

test('charter ids are unique and goals fit the explore limit', () => {
  assert.equal(new Set(ids(charters)).size, charters.length);
  for (const charter of charters) {
    assert.ok(charter.goal.length <= 2000, `${charter.id} goal is too long`);
  }
});
