# Review tonight's docs page

You run unattended in GitHub Actions. Each night one page of react-native-arrangement-view's docs gets a review against the code, in the order of its sidebar. The prompt that started you gives:

- `PAGE`: tonight's page, such as `docs/docs/v0.5/guide/installation.mdx`.
- `RUN_URL`: this workflow run.
- `DRY_RUN`: `true` on a pull request that changes this pipeline.

No one answers questions here. Decide, act, and record what you did.

## Check every claim

Read the page, then check each claim it makes against the code: props and their defaults, types, platform behavior, thresholds, event timing, and what each code sample would do. The code is in `src/` (TypeScript API), `ios/`, `android/` and `cpp/` (`cpp/arrange.h` places Android's panes). Code samples should match what `apps/example-expo/` compiles. `.claude/skills/verify-arrange/SKILL.md` lists what Android's arrangement promises.

- If the page is wrong, fix the page.
- If the code is wrong and the page describes what the library should do, don't change the code. Open an issue with the label `nightly-qa` that quotes the page, points to the code, and says how they differ. First run `gh issue list --label nightly-qa --state open --json number,title,body`, and comment on an open issue that already covers it instead.

## Say it plainly

Rewrite sentences that are hard to read, in plainer, more natural English, without losing a fact. Keep each sentence to one idea. Use the words a developer would say, and the real names of props, types and files. Don't rewrite what already reads well: a small, accurate diff beats a large one.

Keep the repository's conventions:

- Edit only the page's own version folder. Never edit an older version's folder. A page under `examples/` that is a guideline rather than API reference, such as Tent posture, is kept the same in every version folder: if you change one, copy the change to the same page in every `docs/docs/v*/examples/`.
- Don't retake, add or remove screenshots.
- A platform-only page has `tag: ios` or `tag: android` in its frontmatter, and an inline badge needs the page to be `.mdx`. Keep them.
- An API page leads with what the API lets any app do, and gives a specific app's use as an example after.

Run `yarn docs build` and fix what it reports.

## Open one pull request

Open at most one pull request, labelled `nightly-docs`, and only if you changed something. First check that no open pull request with that label already changes this page:

```sh
gh pr list --label nightly-docs --state open --json number,title,files
```

If one does, change nothing and say so in the summary. Otherwise create a branch from `main` named `nightly-docs/<page-slug>`, commit, push, and open the pull request against `main`. The title is a short imperative sentence, like the repository's other pull requests. The body lists each fact you corrected, with the code that proves it, then says the rest is rewording. End it with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Docs need no changeset.

## Dry run

When `DRY_RUN` is `true`, change nothing on GitHub: no push, no pull request, no issue, no comment. Review and edit the page locally as above, and describe what you would do in the summary instead, including the diff. The token in this run can't write, so a push would fail anyway.

## Summary

Write `.nightly/docs-summary.md`, in Markdown, before you finish. It is gitignored, so never commit it. Say which page you reviewed, each fact you found wrong and where, what you reworded, and the pull request or issue you opened, or would open in a dry run.
