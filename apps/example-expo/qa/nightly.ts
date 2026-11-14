import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import type { E2EConfig } from 'e2e';
import { explore, run, type RunEventSink } from 'e2e/runner';
import config from '../e2e.config.ts';
import {
  charters,
  dayIndex,
  parseSelection,
  selectCharters,
  type Charter,
  type Platform,
} from './charters.ts';
import {
  artifactsOf,
  explorationError,
  markdownSummary,
  projectToolCalls,
  reproSource,
  verdictOf,
  type Artifact,
  type CharterReport,
  type Finding,
  type FindingReport,
  type NightlyReport,
} from './report.ts';

const root = path.join(import.meta.dirname, '..');
const output = '.e2e/qa';
const PROJECT_TOOLS = ['fold', 'set_orientation'];

const { values } = parseArgs({
  options: {
    'target': { type: 'string', default: 'android' },
    'charters': { type: 'string', default: '' },
    'count': { type: 'string', default: '2' },
    'max-steps': { type: 'string', default: '8' },
    'timeout-minutes': { type: 'string', default: '10' },
  },
});
const target = parsePlatform(values.target);
const selected = selectCharters(
  charters,
  target,
  parseSelection(values.charters, positive('count', values.count)),
  dayIndex(new Date())
);
const maxSteps = positive('max-steps', values['max-steps']);
const timeoutMs =
  positive('timeout-minutes', values['timeout-minutes']) * 60_000;

const startedAt = new Date().toISOString();
await rm(path.join(root, output), { recursive: true, force: true });
await mkdir(path.join(root, output), { recursive: true });
const reports: CharterReport[] = [];
for (const charter of selected) {
  reports.push(await exploreCharter(charter));
}

const report: NightlyReport = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  target,
  startedAt,
  finishedAt: new Date().toISOString(),
  confirmed: reports
    .flatMap((charter) =>
      charter.status === 'explored' ? charter.findings : []
    )
    .filter((finding) => finding.confirmed).length,
  charters: reports,
};
const runUrl = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : undefined;
const summary = markdownSummary(report, runUrl);
await writeFile(
  path.join(root, output, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`
);
await writeFile(path.join(root, output, 'summary.md'), summary);
console.log(`\n${summary}`);
console.log(`Report: ${path.join(root, output, 'report.json')}`);

const failed = reports.filter((charter) => charter.status === 'error');
if (failed.length > 0) {
  console.error(
    `${failed.length} charter(s) could not be explored: ${failed.map((c) => c.id).join(', ')}`
  );
  process.exitCode = 1;
}

async function exploreCharter(charter: Charter): Promise<CharterReport> {
  const charterOutput = `${output}/${charter.id}/explore`;
  console.log(`\n▶ ${charter.id}: exploring ${charter.example} on ${target}`);
  const result = await explore({
    cwd: root,
    config: {
      ...config,
      output: charterOutput,
      video: 'on',
    } satisfies E2EConfig,
    goal: charter.goal,
    target,
    agent: 'explorer',
    maxSteps,
    timeoutMs,
    onEvent: logProgress,
  });
  const error = explorationError(result);
  if (error !== undefined) {
    console.error(`✗ ${charter.id}: ${error}`);
    return {
      id: charter.id,
      example: charter.example,
      goal: charter.goal,
      status: 'error',
      error,
    };
  }
  const { explore: exploration, report: runReport } = result;
  const artifacts = artifactsOf(runReport.run.results, charterOutput);
  const findings: FindingReport[] = [];
  for (const [index, finding] of exploration.findings.entries()) {
    findings.push(await reproduce(charter, finding, index, artifacts));
  }
  return {
    id: charter.id,
    example: charter.example,
    goal: charter.goal,
    status: 'explored',
    ended: exploration.ended,
    summary: exploration.summary,
    steps: exploration.steps.map(({ title, status }) => ({ title, status })),
    toolCalls: projectToolCalls(runReport.run.results, PROJECT_TOOLS),
    modelTokens: runReport.run.usage.modelTokens,
    estimatedCostUsd: runReport.run.usage.estimatedCostUsd,
    evidence: artifacts.map((artifact) => artifact.path),
    findings,
  };
}

async function reproduce(
  charter: Charter,
  finding: Finding,
  index: number,
  artifacts: readonly Artifact[]
): Promise<FindingReport> {
  const base = {
    charter: charter.id,
    kind: finding.kind,
    severity: finding.severity,
    title: finding.title,
    expected: finding.expected,
    actual: finding.actual,
    reproduction: finding.reproduction,
    evidence: artifacts
      .filter(({ id, kind }) => id === finding.artifactId || kind === 'video')
      .map((artifact) => artifact.path),
  };
  if (finding.kind !== 'issue') {
    return { ...base, confirmed: false, verdict: { kind: 'not-checked' } };
  }
  const reproDir = `${output}/${charter.id}/repro-${index + 1}`;
  const test = `${reproDir}/repro.e2e.ts`;
  await mkdir(path.join(root, reproDir), { recursive: true });
  await writeFile(path.join(root, test), reproSource(charter, finding));
  console.log(`  ↻ re-walking "${finding.title}" with ${test}`);
  const result = await run({
    cwd: root,
    config: {
      ...config,
      tests: `${reproDir}/*.e2e.ts`,
      targets: config.targets.filter((candidate) => candidate.name === target),
      output: `${reproDir}/results`,
      retries: 0,
      video: 'on',
    } satisfies E2EConfig,
    onEvent: logProgress,
  });
  const verdict = verdictOf(result);
  console.log(
    `  ${verdict.kind === 'confirmed' ? '✓ confirmed' : `· ${verdict.kind}`}: ${finding.title}`
  );
  return {
    ...base,
    confirmed: verdict.kind === 'confirmed',
    verdict,
    repro: {
      test,
      status: result.status,
      evidence: artifactsOf(
        result.report.run.results,
        `${reproDir}/results`
      ).map((artifact) => artifact.path),
    },
  };
}

function logProgress(...[event]: Parameters<RunEventSink>) {
  if (event.type === 'notice') {
    console.log(`  ${event.message}`);
  } else if (event.type === 'explore') {
    const { progress } = event;
    if (progress.phase === 'step-finished') {
      console.log(
        `  ${progress.step.status} step ${progress.step.index}: ${progress.step.title}`
      );
    } else if (progress.phase === 'finding') {
      const { finding } = progress;
      console.log(
        `  ⚑ ${finding.kind} (severity ${finding.severity}): ${finding.title}`
      );
    } else if (progress.phase === 'finished') {
      console.log(`  ended: ${progress.ended}`);
    }
  }
}

function parsePlatform(value: string | undefined): Platform {
  if (value === 'ios' || value === 'android') return value;
  throw new Error(`--target must be ios or android, not ${value}`);
}

function positive(name: string, value: string | undefined): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`--${name} must be a positive integer, not ${value}`);
  }
  return number;
}
