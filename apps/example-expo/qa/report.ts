import type { ExploreResult, RunResult } from 'e2e/runner';
import type { Charter, Platform } from './charters.ts';

type Explore = ExploreResult['explore'];
export type Finding = Explore['findings'][number];
type Results = RunResult['report']['run']['results'];

/**
 * Whether a finding's repro test proved it, the bug-bash rule: the closing
 * `agent.assert` judged the expected result false.
 */
export type Verdict =
  | { readonly kind: 'confirmed' }
  | { readonly kind: 'not-reproduced' }
  | { readonly kind: 'inconclusive'; readonly reason: string }
  | { readonly kind: 'not-checked' };

export interface ReproRun {
  readonly test: string;
  readonly status: RunResult['status'];
  readonly evidence: readonly string[];
}

export interface FindingReport {
  readonly charter: string;
  readonly kind: Finding['kind'];
  readonly severity: Finding['severity'];
  readonly title: string;
  readonly expected: string;
  readonly actual: string;
  readonly reproduction: readonly string[];
  readonly confirmed: boolean;
  readonly verdict: Verdict;
  readonly evidence: readonly string[];
  readonly repro?: ReproRun;
}

export type CharterReport = {
  readonly id: string;
  readonly example: string;
  readonly goal: string;
} & (
  | {
      readonly status: 'explored';
      readonly ended: Explore['ended'];
      readonly summary: string | undefined;
      readonly steps: readonly {
        readonly title: string;
        readonly status: Explore['steps'][number]['status'];
      }[];
      readonly toolCalls: readonly string[];
      readonly modelTokens: number;
      readonly estimatedCostUsd: number | undefined;
      readonly evidence: readonly string[];
      readonly findings: readonly FindingReport[];
    }
  | { readonly status: 'error'; readonly error: string }
);

export interface NightlyReport {
  readonly commit: string;
  readonly target: Platform;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly confirmed: number;
  readonly charters: readonly CharterReport[];
}

export function reproSource(charter: Charter, finding: Finding): string {
  const steps = finding.reproduction
    .map((step) => `  await agent.act(${JSON.stringify(step)});`)
    .join('\n');
  return `import { test } from '@e2e-dev/mobile';

test(${JSON.stringify(`${charter.id}: ${finding.title}`)}, { agent: 'explorer' }, async ({ agent, app, device }) => {
  await device.fold('closed');
  await app.open();
${steps}
  await agent.assert(${JSON.stringify(finding.expected)});
});
`;
}

export function verdictOf(result: RunResult): Verdict {
  if (result.status === 'passed') return { kind: 'not-reproduced' };
  const attempt = result.report.run.results[0]?.attempts.at(-1);
  const failed = attempt?.steps.find((step) => step.status !== 'passed');
  if (
    failed?.api === 'agent.assert' &&
    failed.error?.code === 'ASSERTION_FAILED'
  ) {
    return { kind: 'confirmed' };
  }
  const error = failed?.error ?? attempt?.error ?? result.report.run.errors[0];
  return {
    kind: 'inconclusive',
    reason: error
      ? `${failed?.api ?? 'run'}: ${error.code}: ${error.message}`
      : `the repro run ended ${result.status}`,
  };
}

export function explorationError(result: ExploreResult): string | undefined {
  const { report, explore, status } = result;
  const runError = report.run.errors[0];
  if (runError) return `${runError.code}: ${runError.message}`;
  if (status === 'error' || status === 'blocked' || status === 'interrupted') {
    return `the exploration ended ${status}`;
  }
  const failed = explore.steps.filter(
    (step) => step.status === 'failed' || step.status === 'blocked'
  );
  if (explore.steps.length === 0 || failed.length === explore.steps.length) {
    const codes = [...new Set(failed.map((step) => step.errorCode))];
    return `no exploration step ran to the end (${codes.join(', ') || 'no steps'})`;
  }
  return undefined;
}

export function projectToolCalls(
  results: Results,
  tools: readonly string[]
): string[] {
  return results.flatMap((result) =>
    result.attempts.flatMap((attempt) =>
      attempt.steps.flatMap((step) =>
        (step.turns ?? []).flatMap((turn) =>
          turn.calls.filter((call) =>
            tools.some((name) => call.startsWith(name))
          )
        )
      )
    )
  );
}

export interface Artifact {
  readonly id: string;
  readonly kind: string;
  /** Relative to the app's directory. */
  readonly path: string;
}

export function artifactsOf(results: Results, output: string): Artifact[] {
  return results.flatMap((result) =>
    result.attempts.flatMap((attempt) =>
      attempt.artifacts.flatMap(({ id, kind, path }) =>
        path === undefined
          ? []
          : [{ id, kind, path: `${output}/results/${path}` }]
      )
    )
  );
}

export function markdownSummary(
  report: NightlyReport,
  runUrl?: string
): string {
  const lines = [
    `## Nightly exploratory QA on ${report.target}`,
    '',
    `Commit \`${report.commit.slice(0, 12)}\`, ${report.charters.length} charter${report.charters.length === 1 ? '' : 's'}, ${report.confirmed} confirmed bug${report.confirmed === 1 ? '' : 's'}.${runUrl ? ` [Run](${runUrl})` : ''}`,
    '',
    '| Charter | Result | Steps | Findings | Fold and rotate calls | Tokens | Cost |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const charter of report.charters) {
    if (charter.status === 'error') {
      lines.push(
        `| \`${charter.id}\` | error: ${cell(charter.error)} | | | | | |`
      );
      continue;
    }
    lines.push(
      `| \`${charter.id}\` | ${charter.ended} | ${charter.steps.length} | ${charter.findings.length} | ${charter.toolCalls.length} | ${charter.modelTokens} | ${charter.estimatedCostUsd === undefined ? '' : `$${charter.estimatedCostUsd.toFixed(2)}`} |`
    );
  }
  const findings = report.charters.flatMap((charter) =>
    charter.status === 'explored' ? charter.findings : []
  );
  if (findings.length > 0) {
    lines.push('', '### Findings', '');
    for (const finding of findings) {
      const verdict =
        finding.verdict.kind === 'inconclusive'
          ? `inconclusive (${finding.verdict.reason})`
          : finding.verdict.kind;
      lines.push(
        `- **${verdict}** \`${finding.charter}\`, ${finding.kind} of severity ${finding.severity}: ${finding.title}`,
        `  - Expected: ${finding.expected}`,
        `  - Actual: ${finding.actual}`
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

function cell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ');
}
