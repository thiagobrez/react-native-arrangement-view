---
name: verify-arrange
description: Check Android's pane layout, arrange() in cpp/arrange.h and describeLayout() in src/layout.ts, against its promises (panes stay inside the arrangement, never overlap, keep clear of an avoided hinge, split at a separating hinge, show both panes in tabletop, honour axes and primaryEdge, and report the layout they show) on every input in a bounded grid plus 500,000 seeded random cases. Use whenever a change touches cpp/arrange.h, describeLayout(), resolvePrimaryEdge() in src/primaryEdge.ts, their option types in src/types.ts, or how the Android shadow node (android/src/main/jni/ArrangementShadowNodes.cpp) calls arrange(), and before releasing a change to hinge or window size class handling.
---

# Verify arrange()

On Android, the ArrangementView's shadow node (`android/src/main/jni/ArrangementShadowNodes.cpp`) hands the geometry the native view measured (the arrangement's content box, its window, the fold) and the props to `arrange()` in `cpp/arrange.h`, and places the two panes at the frames it returns. It reports those frames through `onPanesChange`, and JS reports `describeLayout()` of them through `useArrangementLayout` and `onArrangementLayoutChange`. JS resolves `primaryEdge` with `resolvePrimaryEdge()` before it reaches the native view. iOS doesn't use `arrange()`: SwiftUI lays out its panes.

The unit tests in `tests/arrange.test.ts` and `tests/primary-edge.test.ts` pin hand-picked layouts. This check runs the real functions on every combination of options and on every fold position, fold width, hinge gap and window size class in a grid, then on 500,000 random layouts in realistic dp. It checks every result against the properties below. It runs the C++ the app ships: `tests/harness/arrange.ts` compiles `tests/harness/harness.cpp` with `cpp/arrange.h` on the host and passes the program the cases in batches.

## Properties

Each property is one entry in `PROPERTIES` in `tests/properties/arrange.check.ts`. Below, each gets the promise, then the harm if it breaks.

| Property | The promise | The harm if it breaks |
| --- | --- | --- |
| inside the arrangement | Every shown pane lies within the arrangement's bounds, with non-negative size. | Content is clipped off screen. |
| no empty pane | Every shown pane has positive width and height. | A pane the app expects to see, often the primary pane holding the main content, is invisible. |
| split panes do not overlap | Panes that aren't overlaid sit side by side or stacked, span the arrangement across their axis, and don't overlap. | One pane covers part of the other. |
| clear of an avoided hinge | When `hingePolicy` avoids the fold and the fold crosses the arrangement, no pane lies across it. Overlay with both panes full-size is the exception. | Content sits under a half-open crease or a physical hinge. |
| hingeGap between panes | Panes on either side of an avoided hinge are at least `max(hingeGap, fold width)` apart, unless a pane is clamped to the edge (that case is "no empty pane"). | The panes crowd the crease. |
| a separating hinge always splits | A separating fold that crosses the arrangement always splits the panes along it, whatever the window size, unless `axes` excludes that axis. | Book or tabletop posture shows one pane across the crease. |
| tabletop shows both panes | In tabletop (a half-open horizontal fold), split shows both panes whatever the window size, unless `axes` is `'horizontal'`. That holds even when the fold isn't avoided (`neverAvoid`) or doesn't cross the arrangement. | A phone-sized window in tabletop shows one pane, against Material's rule. |
| axes is respected | A split never goes along an axis that `axes` excludes. | Panes are stacked when the app asked only for side by side, or the other way round. |
| primary on its edge | Side by side, the primary pane takes the horizontal side `primaryEdge` names: leading by default for split, trailing for overlay. Leading is left in LTR and right in RTL. Stacked, a split's primary pane is always on top, and an overlay's takes the vertical side `primaryEdge` names, below the hinge by default. `primaryEdge` can be one side or a `[horizontal, vertical]` pair. Any other array is ignored. A single pane beside a hinge goes where the primary pane would split to. | The panes swap sides, ignore RTL, or misread a pair. |
| layout matches the frames | `describeLayout()` reports `secondaryVisible`, `axis` and `isOverlapping` as the frames show them. | `useArrangementLayout` tells the app something different from what is on screen. |

## Run it

```sh
yarn verify:arrange           # about 45 s; checks the current cpp/arrange.h and src
yarn verify:arrange:mutants   # about 3.5 min on 10 cores; proves each property can still fail
```

Both commands run with the repo's own Node and need a C++20 compiler: `c++`, or the one `CXX` names. The harness is built once per source and kept in the system's temporary directory. The check exits 0 when every property passes, or when a property fails only because of a finding in `KNOWN_FINDINGS`. For each failing property it prints the number of failing cases and the first one: the geometry, the options and the frames `arrange()` returned.

Run `yarn verify:arrange` on every change that touches the covered code. Also run `yarn verify:arrange:mutants` when you change the check itself, or when the covered code changed enough that a mutant may no longer apply. The mutant runner prints `STALE` for a mutant whose line is gone.

## Known findings

- **no empty pane.** Suppose a hinge the policy avoids crosses the arrangement within `hingeGap / 2` of its edge, which with the default `hingeGap` of 24 means within 12 dp. `arrange()` then clamps the pane on that side to 0 dp and still reports it as shown.

  Take a Pixel Fold's inner screen in book posture (841 × 701 dp, crease at x = 420.5) with an `ArrangementView` in a column that starts 414 dp from the left. The fold reaches the arrangement at x = 6.5. The primary pane then gets a frame 0 dp wide, the secondary pane starts at 18.5, and `useArrangementLayout` reports `{ secondaryVisible: true, axis: 'horizontal' }`. The app's primary content is gone.

  With `axes: 'vertical'` it is worse: the only pane is 0 dp wide, so the arrangement shows nothing. A little further from the edge, the pane is a sliver: at 20.5 dp it is 8.5 dp wide.

  The cause is the clamp in `const double before = jsMax(0, middle - half)` and `const double after = jsMin(extent, middle + half)` in `cpp/arrange.h`, together with the check `start > 0 && end < extent`, which treats such a fold as dividing the arrangement.

  Found on 2026-10-19 and not fixed. A fix belongs in `arrange()` in `cpp/arrange.h`, for example treating a fold that leaves no room on one side like a fold along the edge. Once the fix lands, the check prints `was a known finding` and exits 1. Remove the entry from `KNOWN_FINDINGS`, and add a mutant to `tests/properties/arrange.mutants.ts` that reintroduces the clamp, so this property is proven able to fail too.

## Reading a failure

A FAIL means either `arrange()` or `describeLayout()` broke a promise, or the check models the promise wrongly. To tell which:

1. Take the printed geometry and options, and call `arrange()` on them yourself (`node --no-warnings --input-type=module -e` with an import of `./tests/harness/arrange.ts`, or add a case to `tests/arrange.test.ts`). Confirm the frames.
2. Draw the frames against the arrangement and the fold, and ask whether a user would see the harm in the table. If they would, it is a real bug: report it with that case, in dp, and do not change the property to make it pass.
3. If the frames are right and the property is wrong, the property needs updating. That can happen because the change is intended (see below), or because the check misreads a layout. Examples of a misread: overlay's two full-size panes read as a split, or float rounding. All the comparisons allow `EPS = 1e-6` dp for rounding. Never raise `EPS` to hide a failure larger than rounding.

## When a change is intended

When you deliberately change what `arrange()` promises, such as a new option, a new breakpoint, or a different default side, update the check in the same change:

- Update or add the property in `PROPERTIES`, and the row in the table above.
- Add the new option values to `OPTIONS`, new breakpoints to `WINDOWS`, and anything else the code now compares to the grid. Every constant the code compares against needs a value on each side of it in the grid.
- Add a mutant to `tests/properties/arrange.mutants.ts` that breaks the new behaviour, and confirm `yarn verify:arrange:mutants` catches it.
- Update `tests/arrange.test.ts` as usual. The check doesn't replace the exact layouts pinned there.

## Scope

What a pass means: on every input in the grid, and on the 500,000 random inputs, every property held. It is a bounded check, not a proof for all inputs. The grid covers:

- **Options:** every combination of `arrangement`, `axes`, `hingePolicy`, `primaryEdge` and `rtl`. The `primaryEdge` values are: unset, each of the four sides, all four `[horizontal, vertical]` pairs, and one out-of-order pair.
- **Window sizes:** 839 and 840 dp wide, and 479, 480, 899 and 900 dp tall, which puts every window on each side of the breakpoints in `arrange()`: `COMPACT_HEIGHT`, `EXPANDED_WIDTH` and `EXPANDED_HEIGHT`.
- **Arrangement:** 1 to 8 dp along the fold's axis, and 1 or 3 dp across it.
- **Fold:** vertical and horizontal, from 1 dp before the arrangement to 1 dp past it, 0 to 3 dp wide, and flat, separating, or half-open.
- **`hingeGap`:** 0 to 4, 6, and 24.

`arrange()` only compares sizes with each other, with 0, and with the three window breakpoints, so small integers reach the same branches and orderings as real dp. The random cases cover fractional and realistic sizes: windows up to 1400 dp, `hingeGap` up to 60 dp, and folds up to 40 dp wide.

Assumptions: the arrangement and window sizes are positive, the fold's width and height are non-negative, `hingeGap` is non-negative, and a half-open fold is also separating, as Jetpack WindowManager reports it.

Not covered:

- How `android/src/main/java/com/arrangementview/ArrangementView.kt` and `HingeTracker.kt` measure the geometry and fold.
- How the shadow node maps the props to `ArrangeOptions` (`optionsFrom()`) and turns a frame into a pane's Yoga style, including the `end` edge it writes for a swapped right-to-left layout (`applyPlacement()` in `ArrangementShadowNodes.cpp`).
- Whether a placement reaches the screen: the state update, commit, layout and mount.
- iOS, where SwiftUI decides the layout.

## Coverage record

| Check | Covers |
| --- | --- |
| `tests/properties/arrange.check.ts` | `arrange()`, `Geometry`, `Fold`, `ArrangeOptions` in `cpp/arrange.h`, through the TS shapes and encoding in `tests/harness/arrange.ts`; `resolvePrimaryEdge()` in `src/primaryEdge.ts` (as `ArrangementView.android.tsx` calls it; its `problems` messages are not checked); `describeLayout()` in `src/layout.ts`; `Arrangement`, `ArrangementAxes`, `HingePolicy`, `PrimaryEdge`, `HorizontalEdge`, `VerticalEdge`, `ArrangementLayout` in `src/types.ts` |
| `tests/properties/arrange.mutants.ts` | The same lines, by exact text; a `STALE` mutant means its line changed |

Last confirmed in sync at commit `<pending>`.

To see whether the covered code has changed since then, run:

```sh
git diff <pending> -- cpp/arrange.h src/primaryEdge.ts src/layout.ts src/types.ts tests/harness
```

If it has, read the diff against the properties and the grid, run both commands, and update the check as described above. Move the commit forward only after you have confirmed that the check describes the code at the new commit: update both the hash in this section and the one in the `git diff` command.
