# Fix the bugs the nightly QA confirmed

You run unattended in GitHub Actions, after the nightly exploration of react-native-arrangement-view's example app on a Pixel 10 Pro Fold emulator. The prompt that started you gives:

- `REPORT`: the JSON report that `apps/example-expo/qa/nightly.ts` wrote.
- `RUN_URL`: this workflow run. Its `nightly-qa-android` artifact holds every screenshot, video and trace the report names.
- `DRY_RUN`: `true` on a pull request that changes this pipeline.

No one answers questions here. Decide, act, and record what you did.

## Read the report

Act only on findings with `"confirmed": true`. A confirmed finding is one whose repro test failed on the defect: the explorer's reproduction steps ran as `agent.act` calls, and its `expected` result, checked by `agent.assert`, was false. The repro test is at `finding.repro.test`. Its evidence and the exploration's are at the paths in `finding.evidence` and `finding.repro.evidence`, relative to `apps/example-expo/`. Look at the screenshots before you trust the text.

A confirmed finding can still be wrong: the judge misread the screen, or the explorer expected something the library never promised. The promises are in `apps/example-expo/qa/explorer.ts`, the docs in the newest folder of `docs/docs/`, and `.claude/skills/verify-arrange/SKILL.md`. Reject a finding the code and the docs show to be intended, and say why in your summary.

## Don't duplicate earlier runs

Earlier nights may have found the same defect. Before you act on a finding, list what is open:

```sh
gh issue list --label nightly-qa --state open --json number,title,body
gh pr list --label nightly-qa --state open --json number,title,body,headRefName
```

If an open issue or pull request covers the same defect, even with other wording, comment on it with the run link and the new evidence, and do nothing else for that finding.

## Fix each new bug

Handle at most 2 new bugs, the most severe first. For each:

1. Find the root cause. Decide whether it is in the library (`src/`, `ios/`, `android/`, `cpp/`) or in the example app (`apps/example-expo/src/`). On Android, pane placement lives in `cpp/arrange.h`: read `CONTRIBUTING.md` and the verify-arrange skill before you change it, and run `yarn verify:arrange` after.
2. Create a branch from `main` named `nightly-qa/<charter>-<short-slug>`.
3. Write a regression test in `apps/example-expo/e2e/`, in the style of `features-demo.e2e.ts`: locators and `device.fold`, no `agent` calls, so it runs without a model key. It must fail on the defect and pass with the fix. You can't run it here, because this job has no device. Pull request CI runs it on the emulator.
4. Fix the root cause, not the symptom. Keep the change as small as the fix allows.
5. Run `yarn lint`, `yarn typecheck` and `yarn test`, and fix what they report.
6. If the fix changes library code, add one changeset in `.changeset/`: a `patch` for `react-native-arrangement-view`, one sentence that names what changed. Changes to the example app need none.
7. Commit, push the branch, and open a pull request against `main` with the label `nightly-qa`. The title is a short imperative sentence, like the repository's other pull requests. The body says what was wrong, from the user's side, and the root cause, the fix, and how the regression test proves it. Add the finding's expected and actual results, the run link, and the finding's screenshot: attach it with `gh pr create --attach '<path>#<alt text>'`, or link the run's artifact if this `gh` has no `--attach`. End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

If you can't find the root cause, or can't fix it with confidence, open an issue with the label `nightly-qa` instead: the finding, its evidence, the run link, and what you ruled out. Never open both an issue and a pull request for one defect.

## Rules

- Don't change `.github/`, the QA pipeline in `apps/example-expo/qa/`, or `apps/example-expo/e2e.config.ts`.
- Don't retake or add docs screenshots.
- One pull request per bug, each on its own branch from `main`.

## Dry run

When `DRY_RUN` is `true`, change nothing on GitHub: no push, no pull request, no issue, no comment. Read, root-cause and fix locally as above, then describe what you would do in the summary instead. The token in this run can't write, so a push would fail anyway.

## Summary

Write `.nightly/fix-summary.md`, in Markdown, before you finish. It is gitignored, so never commit it. For each finding in the report, give one line: its title, and what you did with it (a pull request or issue link, a comment on an existing one, rejected and why, or left for another night). In a dry run, put the title and body of each pull request, issue and comment you would have made.
