# About moving react-native-arrangement-view to Nitro Modules

This page answers three questions about [Nitro Modules](https://nitro.margelo.com) 0.37.1 for this library, as of 2026-10-23. What would a move cost? What would it gain? Does the Android shadow node from [#54](https://github.com/thiagobrez/react-native-arrangement-view/pull/54) have to go? The answers rest on Nitro's source, three prototypes on the Pixel 10 Pro Fold emulator, and benchmarks with 5 alternating runs per case. Everything ran on Android, and nothing here ran on iOS.

## The short answer

Keep the shadow node. Nitro cannot express it, and a Nitro view that holds React children, as the panes do, crashes the app.

Nitro can run beside the shadow node. The prototype links both into one APK and leaves `cpp/arrange.h` and the shadow node's sources untouched. #54's posture-to-frame benchmark finds no measurable difference. A fold draws its new pane frames in 9.2 ms at the median on both `main` and the prototype, over 100 folds each.

The only gain found is in how hinge readings reach JavaScript. Today they travel as Fabric view events, which Android hands to JavaScript on the next vsync. A Nitro callback skips that wait. A component that renders the hinge angle draws a new angle in 8.2 ms at p50 instead of 23.4 ms, about one frame sooner at 60 Hz. A codegen TurboModule event emitter, which adds no dependency, draws it in 10.2 ms, and the two are not measurably different. The speedup comes from leaving Fabric's event queue. Nitro is not what buys it.

So don't adopt Nitro. If hinge-driven React content needs that frame back, feed `useHingeChange` from a TurboModule event emitter, and keep the Fabric event for Reanimated worklets ([#33](https://github.com/thiagobrez/react-native-arrangement-view/pull/33)).

## What each part would become

| Part | Today | As Nitro | Verdict |
| --- | --- | --- | --- |
| `ArrangementView` on Android | A codegen component. A custom C++ shadow node places the panes from props and from a State that Kotlin fills through JNI with `unstable_Immediate`. | A Hybrid View. nitrogen declares its shadow node as a plain `ConcreteViewShadowNode` alias with a `final` descriptor, so nothing can override `layout` or `appendChild`. On Android its State slot carries Nitro's props, so `ArrangementViewState` has nowhere to live. | Not possible without forking generated files |
| The panes | Codegen views that hold React children | Hybrid Views cannot hold React children. Android crashes. On iOS, per [margelo/nitro#1644](https://github.com/margelo/nitro/pull/1644), the children mount behind the view. | Not possible |
| `ArrangementView` on iOS | A Fabric view that hosts SwiftUI, plus a pane shadow node with its own State, `layout` and `adopt` | A Swift Hybrid View wraps one `contentView`, with the same limits on children and on the shadow node | Not possible |
| `HingeObserver` and `onHingeChange` | A codegen view that sends a Fabric direct event per hinge sample | A HybridObject with a listener (prototype A) | Works. Measured below. |
| `onPanesChange` | An event sent from the shadow node's `layout()` | A Nitro callback would lose the event's order with its commit, and Reanimated could not see it | No gain found |

[research.md](research.md) cites a file and line at Nitro's `v0.37.1` tag for every row.

## Evidence

### A Nitro view cannot hold the panes

Prototype B is a Kotlin Hybrid View with one prop, `NitroPaneHost`. Alone, it renders. Given a React `<Text>` child, the release app dies as it mounts:

```
E MountItemDispatcher: java.lang.ClassCastException: com.margelo.nitro.arrangementview.views.HybridNitroPaneHostManager cannot be cast to com.facebook.react.uimanager.IViewGroupManager
	at com.facebook.react.fabric.mounting.SurfaceMountingManager.addViewAt(SurfaceMountingManager.kt:381)
E AndroidRuntime: FATAL EXCEPTION: main
```

nitrogen generates every view manager as a `SimpleViewManager`, and both Nitro's `main` and its V1 branch still do. Children support is [margelo/nitro#873](https://github.com/margelo/nitro/issues/873), open since 2025-09, with five open PRs and none merged.

### Nitro runs beside the shadow node

Prototype A adds a Kotlin HybridObject, `Hinge`, fed by the existing `HingeTracker`. Nitro's code builds into its own `libNitroArrangementView.so`. The shadow node stays in the app's `libappmodules.so`, as it is today. The two share no state, so the build needs only the steps in Nitro's module template.

#54's harness times each posture change from WindowManager's report to the first drawn frame whose pane rectangles changed. It also counts frames drawn with stale or hidden panes. Both builds carry the same probe. Each cell is the median of all events over 5 alternating rounds, with the range of the round medians in brackets.

| Scenario | `main` | Prototype with Nitro |
| --- | --- | --- |
| Fold between flat and half-open, 100 changes | 9.2 ms (7.7 to 11.3) | 9.2 ms (6.9 to 11.4) |
| The same, JS busy in 200 ms chunks | 9.5 ms (8.2 to 12.2) | 9.7 ms (8.2 to 11.0) |
| New `ArrangementView`, attach to first drawn frame, 55 mounts | 4.1 ms (4.0 to 4.8) | 4.3 ms (3.6 to 4.6) |
| Unfold from the cover display, frames with stale panes | 0 of 50 | 0 of 50 |

Nitro is not on this path, so these runs check that linking it breaks nothing. They do not look for a speedup. The attached video folds the emulator while the JS thread is blocked for 3 s. The panes still move while the on-screen JS clock is frozen, which shows that the shadow node still arranges without JavaScript.

### Hinge readings reach React a frame sooner off Fabric events

The bench screen subscribes one transport at a time, in one APK. The emulator sweeps the hinge between 70° and 130° at 60 Hz for 12 s, 732 samples, of which 721 are distinct readings. Every transport starts from the same `HingeTracker` timestamp. "Drawn" is the first frame in which a bar sized by that angle has its new width. Each cell is the median of 5 runs, with the range in brackets.

| Measure | Fabric view event (today) | Nitro callback | TurboModule event emitter |
| --- | --- | --- | --- |
| Sample reaches JS, p50 | 7.8 ms (4.7 to 8.9) | 0.34 ms (0.33 to 0.36) | 0.36 ms (0.35 to 0.36) |
| Samples JS receives, of 721 | 553 (490 to 677) | 719 | 719 |
| Sample to drawn frame, p50 | 23.4 ms (22.9 to 27.4) | 8.2 ms (7.3 to 10.6) | 10.2 ms (7.3 to 12.0) |
| Sample to drawn frame, p50, JS busy in 200 ms chunks | 25.1 ms (23.8 to 27.0) | 12.3 ms (10.2 to 13.5) | 12.0 ms (10.5 to 14.3) |
| JS thread time per sample, no render | 51 µs (35 to 55) | 16.5 µs (12.7 to 16.8) | 17.2 µs (14.8 to 18.9) |
| Main thread time for the sweep (70 ms with no listener) | 175 ms (161 to 184) | 151 ms (144 to 165) | 168 ms (162 to 172) |

Fabric against either other transport is the clear split. A rank-sum test gives p = 0.008 for drawn frames, the lowest p that 5 runs against 5 can reach. Nitro against the TurboModule gives p = 0.31 at idle and p = 1.0 under load, so the drawn-frame times do not differ. The main thread spends about 24 µs less per sample with Nitro than with the TurboModule (p = 0.016). The likely reason, read from the code and not profiled, is that Nitro passes a struct where the other two build a `WritableMap`. At 60 Hz that saving is about 1.4 ms per second.

Fabric loses the frame in two steps. `FabricEventDispatcher.dispatchEvent` only queues the event and posts a Choreographer `TIMERS_EVENTS` callback. JavaScript receives the batch when that callback runs, half a frame later on average, which matches the 7.8 ms. The commit that the handler makes then reaches the mounting layer after that frame's mount pass, so it shows a frame later. The first half comes from React Native's source and the delivery numbers. The second half is inferred from the drawn-frame numbers. Nitro and the TurboModule both call `CallInvoker::invokeAsync`, which React Native 0.86 turns into a `RuntimeScheduler::scheduleWork` task. JavaScript gets the sample in about 0.3 ms, and the next vsync becomes the only wait.

Under JS load, Fabric merges events. JavaScript receives only the newest sample after each busy chunk: 59 of 721, 8.2 ms old at p50. Nitro and the TurboModule queue every sample: 718 arrive, 92 ms old at p50 and 178 ms at p90. React batches the queued callbacks into few renders, 65 drawn frames for 718 callbacks, so the drawn frame is still fresher than Fabric's.

The users who notice are those of an app that renders hinge-driven content in React, such as a dial that follows the angle. They see it one frame sooner. The panes don't use JavaScript and don't change. Worklets that follow the hinge on the UI thread (#33) skip JavaScript too, and only Fabric events reach them.

## Effort

| Option | What it takes | Estimate |
| --- | --- | --- |
| Move the views to Nitro | Blocked. It needs children in Hybrid Views (#873) and a way to own the generated shadow node and its State, and neither exists in 0.37.1 or on the V1 branch. Forking the generated files means redoing the fork after every nitrogen run. Positioning the panes from JavaScript instead undoes #54. Its measurements were 26.0 ms instead of 8.9 per posture change, 146 ms instead of 11.4 under JS load, and 43 of 50 unfolds showing a stale frame instead of 0. | Not feasible |
| Nitro for the hinge only | Prototype A covers Android with about 210 handwritten lines, half of them build setup (Gradle, CMake, `JNI_OnLoad`, `nitro.json`), plus 18 generated files with 1,093 lines to commit. The APK grows by 1.4 MB on arm64 (`libNitroModules.so` 981 KB, `libNitroArrangementView.so` 407 KB). Left to do: a Swift HybridObject on iOS (`UIHingeInteraction` needs a view, so per-window scoping needs a design), `useHingeChange` and `HingeObserver` on the new feed, docs, tests, and every consumer installing `react-native-nitro-modules`. | 3 to 5 days (guess) |
| TurboModule event emitter for the hinge | Prototype C covers Android with about 75 handwritten lines on top of the `HingeTracker` change both prototypes share, `codegenConfig.type` set to `all`, and one `#include_next` in the library's replacement spec header. Left to do: the iOS module, plus the same API, docs and test work. No new dependency and no committed generated code. | 2 to 3 days (guess) |

Building prototypes A and B took an agent about 14 minutes, smoke runs included. Nitro's module template worked as documented, and coexisted with the library's own CMake and component descriptors. The only snag was a missing `ANDROID_HOME` in one shell.

## Trade-offs

| | Fabric view event (today) | Nitro HybridObject | TurboModule event emitter |
| --- | --- | --- | --- |
| Hinge sample to drawn frame | 23.4 ms | 8.2 ms | 10.2 ms |
| Under JS load | Merges to the newest sample | Queues every sample | Queues every sample |
| Dependency for consumers | None | `react-native-nitro-modules`, 0.x, V1 rewrite announced as weeks away | None |
| Generated code in the repo | None | 18 files, 1,093 lines | None (codegen runs at build time) |
| Reanimated `registerForEvents` (#33) | Sees the events | Cannot see the callbacks | Cannot see the events (inferred, not run) |
| Scoped to a window, as `HingeObserver` is | Yes, per view | Needs a design | Needs a design |
| Synchronous read of the current hinge | No | Yes, `current` | Possible with a sync method |
| Risk | Known | 0.37.1 was tested on RN 0.85.3. Crash reports with several JS runtimes are open. | Uses React Native's own API |

Nitro is strongest at fast synchronous calls from JavaScript into native code and at rich types, and this library barely makes such calls. Its one hot path runs from native code into JavaScript, and there Nitro and React Native's own event emitter perform the same.

## When to look again

- Nitro ships children in Hybrid Views and a way to own the generated shadow node and its State. Both are open in V1.
- A consumer reports that hinge-driven React content lags. Then try the TurboModule event emitter first.

## Reproduce

Everything runs on the `Pixel_10_Pro_Fold` emulator as `emulator-5554`, from the repository root, after `yarn install` and `yarn example expo prebuild --platform android --no-install`.

1. Build and install the bench app. Its transports switch at runtime, so one APK serves every case.

	```sh
	poc/nitro/bench/build-apk.sh arrangementview.example.hinge /tmp/poc-bench.apk bench
	adb install -r /tmp/poc-bench.apk
	```

2. Run the hinge matrix, 5 rounds, and print medians and ranges.

	```sh
	poc/nitro/bench/hinge-compare.sh 5 /tmp/hinge-results
	```

3. For the arrangement numbers, apply `poc/nitro/bench-arrange/apply.py` to a checkout of `main` and to this branch, build each with `build-apk.sh` as `arrangementview.example.base` and `arrangementview.example.native`, install both, and run `SIDES="base native" PREFIX=nitro poc/nitro/bench-arrange/compare.sh 5`.

4. `poc/nitro/proof/capture.sh <dir>` records the screenshots and videos attached to the pull request with agent-device 0.21.31.

[decisions.tsv](decisions.tsv) logs each decision in this run with its evidence.
