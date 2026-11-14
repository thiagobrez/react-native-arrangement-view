import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RunResult } from 'e2e/runner';
import { charters } from './charters.ts';
import { reproSource, verdictOf, type Finding } from './report.ts';

function runEnding(
  status: RunResult['status'],
  steps: { api: string; status: string; code?: string }[]
): RunResult {
  return {
    status,
    report: {
      run: {
        errors: [],
        results: [
          {
            attempts: [
              {
                steps: steps.map(({ api, status: stepStatus, code }) => ({
                  api,
                  status: stepStatus,
                  ...(code ? { error: { code, message: code } } : {}),
                })),
              },
            ],
          },
        ],
      },
    },
  } as unknown as RunResult;
}

test('a finding is confirmed only when the closing assert judges it false', () => {
  const steps = [{ api: 'agent.act', status: 'passed' }];
  assert.deepEqual(
    verdictOf(
      runEnding('failed', [
        ...steps,
        { api: 'agent.assert', status: 'failed', code: 'ASSERTION_FAILED' },
      ])
    ),
    { kind: 'confirmed' }
  );
  assert.deepEqual(
    verdictOf(
      runEnding('passed', [...steps, { api: 'agent.assert', status: 'passed' }])
    ),
    { kind: 'not-reproduced' }
  );
});

test('a repro that fails before its assert, or that the judge could not decide, is inconclusive', () => {
  for (const run of [
    runEnding('failed', [
      { api: 'agent.act', status: 'failed', code: 'STEP_NO_CONCLUSION' },
    ]),
    runEnding('failed', [
      { api: 'agent.act', status: 'passed' },
      {
        api: 'agent.assert',
        status: 'failed',
        code: 'ASSERTION_INCONCLUSIVE',
      },
    ]),
    runEnding('error', []),
  ]) {
    assert.equal(verdictOf(run).kind, 'inconclusive');
  }
});

test('a repro test replays the reproduction from a closed device and asserts the expected result', () => {
  const finding = {
    kind: 'issue',
    severity: 3,
    title: 'Primary pane crosses the hinge',
    expected: 'The "Primary" pane ends left of the hinge.',
    actual: 'It spans it.',
    reproduction: ['Fold the device closed', "Tap the 'Overlay' chip"],
  } as unknown as Finding;
  const source = reproSource(charters[0]!, finding);
  assert.match(
    source,
    /await device\.fold\('closed'\);\n {2}await app\.open\(\);/
  );
  assert.ok(source.includes(`await agent.act("Tap the 'Overlay' chip");`));
  assert.ok(
    source.includes(
      'await agent.assert("The \\"Primary\\" pane ends left of the hinge.");'
    )
  );
  assert.ok(source.includes("{ agent: 'explorer' }"));
});
