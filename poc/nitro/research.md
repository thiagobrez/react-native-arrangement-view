# Nitro Modules: should react-native-arrangement-view adopt it?

Researched 2026-10-23. Nitro was read as source only. None of its scripts, builds or generators were run.

## Sources, pinned

| Key | What | Pin |
| --- | --- | --- |
| **[N]** | margelo/nitro at the released tag `v0.37.1` (what users install) | `971d6ba3f8cef10d6175fe3bf7bc44a89a30ddf4` |
| **[Nm]** | margelo/nitro `main` (= npm `nightly` 0.37.2-nightly.62.gfb894f673ff0) | `fb894f673ff04bb392fbe6037ead4881cc0a9bc2` |
| **[Nv1]** | margelo/nitro `v1` branch (= npm `alpha-nightly` 1.0.0-alpha.nightly.90) | `08f78ee20cf07db6a493c488a4d2fe54e6dbf612` |
| **[U]** | jpudysz/react-native-unistyles `main` (npm 3.6.0) | `2b67c49a1e3da4ac67c30e4dfb15adf35225c0a6` |
| **[V]** | TheWidlarzGroup/react-native-video `master` (7.0.0-beta.12) | `a3cde3b22f4d99791eb9242ba97ce01064d64152` |
| **[VC]** | margelo/react-native-vision-camera `main` (5.2.3) | `1a69f290e1a4308d3fb9bec0a02acb55355005a8` |
| **[M]** | margelo/react-native-mmkv `main` (4.3.2) | `ca5acf0ca9acc5cd1b75c486be6adad40c488047` |
| **[RN]** | react-native 0.86.3 in this repo's `node_modules/react-native/ReactCommon/react/` | as installed |
| **[RA]** | react-native-reanimated 4.5.1 / react-native-worklets 0.10.1 in `t3code-0c39d172/node_modules` | branch HEAD `c8917fb` |
| **[L]** | this repo (`t3-5927d5de`) | `6b426f1` |

Unless a path says otherwise, Nitro paths are relative to the repo root. `NMM` = `packages/react-native-nitro-modules`, `NG` = `packages/nitrogen/src`, `NT` = `packages/react-native-nitro-test/nitrogen/generated`, `DOCS` = `docs/docs` (the same content is published at https://nitro.margelo.com/docs/...).

---

## 1. Versions, release cadence, RN support, Expo

- **Latest stable:** `react-native-nitro-modules` 0.37.1 and `nitrogen` 0.37.1, both published 2026-08-27 (`npm view … time`). Other dist-tags: `beta` 0.37.0-beta.1, `nightly` 0.37.2-nightly.62.gfb894f673ff0 (= [Nm] HEAD), and `alpha-nightly` 1.0.0-alpha.nightly.90.g08f78ee20cf0 (2026-10-23, = [Nv1]).
- **Cadence:** 118 stable releases since 0.0.2 (2024-06-15): 38 in 2024, 47 in 2025, 33 so far in 2026. Each 2026 minor first appeared on: 0.33 (01-12), 0.34 (02-26), 0.35 (03-04), 0.36 (06-30), 0.37 (08-20). The project is still 0.x. A rewrite, "Nitro V1", is under way. The maintainer said on 2026-10-16: "Nitro V1 is currently still work in progress. ETA: a few weeks" (https://github.com/margelo/nitro/issues/1705, maintainer comment).
- **Supported RN versions:**
  - The peer dependency is `react-native: "*"` ([N] `NMM/package.json:82-85`).
  - The documented minimum is RN 0.75 ([N] `DOCS/getting-started/minimum-requirements.md:13-24`). Hybrid Views need "react-native 0.78.0 or higher, and require the new architecture" ([N] `DOCS/guides/view-components.md:14-16`).
  - Non-view HybridObjects also ship an old-architecture entry point ([N] `NMM/ios/turbomodule/NativeNitroModules+OldArch.mm:55`; `DOCS/guides/entry-point.md:12`). So Nitro as a whole is not New-Architecture-only. Views are.
- **RN 0.86 specifically:**
  - The source branches explicitly on RN 0.86 vs 0.87 ([N] `NMM/cpp/views/RawPropsCompat.cpp:17-33`).
  - However, 0.37.1 was built and tested against RN 0.85.3 ([N] `NMM/package.json:78`). `main` moved to RN 0.88.0 on 2026-10-19 (https://github.com/margelo/nitro/pull/1746). "Supports 0.86" is therefore inferred from the compat code, not from CI.
  - **Known RN 0.86 issue in 0.37.1 (Android):** Hybrid Views can receive no base View props: `opacity`, `transform`, `backgroundColor`, `testID`, accessibility (https://github.com/margelo/nitro/issues/1656). The fix, PR #1749, says the bug "affects RN 0.87+ and RN 0.84-0.86 when `enableExclusivePropsUpdateAndroid` is enabled" (https://github.com/margelo/nitro/pull/1749). That flag defaults to `false` in [RN] `featureflags/ReactNativeFeatureFlagsDefaults.h:114-116`.
  - The fix is on `main` only ([Nm] commit `ffd9031`, which adds `RawPropsCompat::initializeDynamicProps` in `NG/views/CppHybridViewComponent.ts:188-204`). It is not in any stable release yet.
  - A production crash was reported on "Android arm64, RN 0.86 bridgeless" when worklet runtimes are active (https://github.com/margelo/nitro/pull/1451, open). See §3.
- **Expo:**
  - There is no Expo config plugin in the repo: no `app.plugin.*` exists in [N].
  - The library-user docs say only "install the Nitro Modules core package" and run `pod install` ([N] `DOCS/resources/for-library-users.md:12-39`). No Expo SDK version is mentioned anywhere in the docs.
  - Open https://github.com/margelo/nitro/issues/1216: "Deep import of react-native/Libraries/NativeComponent/NativeComponentRegistry breaks expo web builds with tree shaking". The import is at [N] `NMM/src/views/getHostComponent.ts:2-4`.
  - Expo SDK 57 compatibility: **unconfirmed**. Nothing found either way.

## 2. Hybrid Views ("Nitro Views")

**What nitrogen generates** ([N] `NG/views/`):

- *Shared C++* (`CppHybridViewComponent.ts:97-171`), with a real instance at `NT/shared/c++/views/HybridTestViewComponent.hpp:38-93`:
  ```cpp
  class HybridTestViewProps final: public react::ViewProps { … nitro::ReactProp<bool> isBlue; …
    nitro::ReactProp<std::optional<std::function<void(const std::shared_ptr<HybridTestViewSpec>&)>>> hybridRef; … };
  using HybridTestViewState = nitro::ViewPropsHolderState<HybridTestViewProps>;
  using HybridTestViewShadowNode = react::ConcreteViewShadowNode<HybridTestViewComponentName,
        HybridTestViewProps /* custom props */, react::ViewEventEmitter /* default */, HybridTestViewState /* custom state */>;
  using HybridTestViewComponentDescriptor = nitro::ViewComponentDescriptor<HybridTestViewShadowNode>;
  ```
  It also generates a props constructor that parses every prop through `nitro::ReactProp<T>::fromRawValue` (`CppHybridViewComponent.ts:173-209`), and a view config JSON with empty `bubblingEventTypes` and `directEventTypes` (`NG/views/createHostComponentJs.ts:15-19`; `NT/shared/json/TestViewConfig.json`).
- *Android*: `KotlinHybridViewManager.ts`.
  - The view manager is `public class HybridXManager: SimpleViewManager<View>()` (line 58). It overrides `updateState(view, props, stateWrapper)`, which calls `HybridXStateUpdater.updateViewProps(hybridView, newState, oldState)` (lines 85-100).
  - The Kotlin `external fun updateViewProps` sits in a generated companion (143-152).
  - JNI `JHybridXStateUpdater` (161-211) reads props out of `StateWrapperImpl` (237-261) and calls each changed setter, then `hybridRef` (263-287).
  - `registerNatives()` adds the descriptor to `react::CoreComponentsRegistry::sharedProviderRegistry()` (203-206), so the app's autolinking does not register it.
  - The header fails to compile without `RN_SERIALIZABLE_STATE` (166-168).
- *iOS*: `SwiftHybridViewManager.ts`.
  - It generates an Objective-C++ `@interface HybridXComponent: RCTViewComponentView` (line 88). That class self-registers in `+load` (97-100) and returns `concreteComponentDescriptorProvider<…>` (102-104).
  - It puts the Swift view in as `[self setContentView:view]` (116-126).
  - It diffs props in `updateProps:oldProps:` against the previous Props snapshot (138-173). iOS does not route props through State.
- Hybrid Views can only be Swift and Kotlin (`NMM/src/views/HybridView.ts:6-9`; `KotlinHybridViewManager.ts:34-38`). There is no C++ view.

**a. ShadowNode type.** Yes, it is `react::ConcreteViewShadowNode<Name, HybridXProps, react::ViewEventEmitter, nitro::ViewPropsHolderState<HybridXProps>>`, declared as a `using` alias, not a subclass ([N] `NG/views/CppHybridViewComponent.ts:158-161`). The props class extends `react::ViewProps` (126). The descriptor is `nitro::ViewComponentDescriptor<…>`, declared `final`, deriving from `react::ConcreteComponentDescriptor` ([N] `NMM/cpp/views/ViewComponentDescriptor.hpp:25-27`). [Nv1] has the same shape: `NG/views/CppHybridViewComponent.ts:180-193` and `KotlinHybridViewManager.ts:73` (still `SimpleViewManager`).

**b. Android prop transport: yes, through Fabric State.**
1. `ViewPropsHolderState<TProps>` is a `final` struct that only holds `shared_ptr<const TProps>` ([N] `NMM/cpp/views/ViewPropsHolderState.hpp:15-48`). Its doc comment says it exists "to set props via a custom route through JNI on Android, instead of going through react-native's JNI/folly prop parser".
2. On Android, `ViewComponentDescriptor::adopt()` replaces the node's state data with `State{props}` whenever the Nitro props changed. It keeps the old state only if `hasSameProps` ([N] `ViewComponentDescriptor.hpp:53-73`). A `static_assert` requires the State to be constructible from the props (31-35).
3. The folly constructor *discards* everything: `ViewPropsHolderState(const ViewPropsHolderState&, folly::dynamic) {}`. `getDynamic()` and `getMapBuffer()` throw (`ViewPropsHolderState.hpp:36-44`).
4. The JNI updater `static_pointer_cast`s the state to `react::ConcreteState<HybridXState>` (`KotlinHybridViewManager.ts:235,250-256`).

**Can a library keep its own State on the same node? No, not without forking.** The State slot is taken, its type is fixed and `final`, it is rewritten on every prop change, and a Kotlin `StateWrapper.updateState(...)` would replace it with an empty-props state. The updater would then throw "Current StateWrapper doesn't contain any props!" (`KotlinHybridViewManager.ts:270-272`). That consequence is inferred from source.

**c. Customising the shadow node: no documented or source-level extension point.**
- Nothing can be overridden:
  - The ShadowNode is an alias, so there is no `layout`, `appendChild` or `measureContent` override.
  - The descriptor is `final`.
  - The Kotlin manager is a non-`open` Kotlin class (`KotlinHybridViewManager.ts:58`).
  - The iOS component lives only in a `.mm` with no header (`SwiftHybridViewManager.ts:59-194`).
- Every generated file says "DO NOT MODIFY THIS FILE" (`NT/shared/c++/views/HybridTestViewComponent.hpp:1-6`) and is rewritten on each nitrogen run.
- The `nitro.json` schema has no view or template options ([N] `NG/config/NitroUserConfig.ts:143-229`).
- An open feature request for `measureContent` lists the only workaround as "Patching the generated files" (https://github.com/margelo/nitro/issues/1199). The maintainer adds that it also needs the `LeafYogaNode`/`MeasurableYogaNode` traits (https://github.com/margelo/nitro/issues/873, comment 2026-02-03).
- **Conclusion: you would have to fork the generated files.**

**d. React children: not supported.**
- Open issue https://github.com/margelo/nitro/issues/873, "[Feature] Support children in Nitro Views" (since 2025-09-15).
- Open PRs: #652, #1142, #1388, #1444, #1644. None is merged.
- PR #1644 states: "On Android React Native's mounting layer threw `IllegalStateException: Unable to add a view into a view that is not a ViewGroup` … on iOS the children mounted *behind* the native view, because `RCTViewComponentView` adds `contentView` as its last subview" (https://github.com/margelo/nitro/pull/1644).
- This matches the source: `SimpleViewManager<View>` at [N] `KotlinHybridViewManager.ts:58` and `setContentView` at `SwiftHybridViewManager.ts:125`. [Nm] `main` still generates `SimpleViewManager` (`NG/views/kotlin/KotlinHybridViewManager.ts:48,58`).

**e. Callbacks, `{ f }`, `hybridRef`, threading.**
- **Why the wrapping:** functions cannot be plain props, because "functions are wrapped in an event listener registry, and a simple boolean is passed to the native side". So Nitro requires `callback(fn)` ([N] `DOCS/guides/view-components.md:238-261`, which cites facebook/react#32119).
  - `callback()` always returns `{ f: func }` ([N] `NMM/src/views/callback.ts:10-18`). Its doc comment says newer RN returns the function as-is, but the code does not.
  - The typings wrap every function prop ([N] `NMM/src/views/getHostComponent.ts:74-85`).
  - C++ unwraps `.f` before converting ([N] `NMM/cpp/views/ReactProp.hpp:101-106`).
- **`hybridRef`** is an implicit `(ref) => void` prop added to every view (`NG/views/CppHybridViewComponent.ts:44-50,73`). After prop updates, on the UI/main thread, it is invoked with the HybridObject: Android at `KotlinHybridViewManager.ts:277-286`, iOS at `SwiftHybridViewManager.ts:157-166`.
- **Threading of props:** "If props are set normally via React, they will be set on the UI Thread" (`DOCS/guides/view-components.md:203-207`).
- **How a native→JS callback runs.** A JS function whose return type is `void` or `Promise` becomes an `AsyncJSCallback` bound to the runtime's `Dispatcher` ([N] `NMM/cpp/jsi/JSIConverter+Function.hpp:29-53`). Calling it does `dispatcher->runAsync(...)` (`NMM/cpp/utils/JSCallback.hpp:99-125`). On the React runtime that dispatcher is `CallInvokerDispatcher`, built from the JS `CallInvoker` (`NMM/android/src/main/cpp/turbomodule/JNitroModules.cpp:26-32`). It forwards to `callInvoker->invokeAsync` (`NMM/cpp/threading/CallInvokerDispatcher.hpp:24-30`). In RN 0.86 that becomes `RuntimeScheduler::scheduleWork`, which is an `ImmediatePriority` task ([RN] `renderer/runtimescheduler/RuntimeSchedulerCallInvoker.cpp:19-24`; `RuntimeScheduler_Modern.cpp:45-48`).
- **Batching:** Nitro does no batching or coalescing. Each call is one scheduled task.
- **Synchronous native→JS:**
  - `Sync<T>` callbacks run on the caller's thread. "The `getValue()` callback can now only be called from the JS Thread" (`DOCS/types/callbacks.md:144-176`; `NMM/src/Sync.ts:1-8`; `JSCallback.hpp:36-57`).
  - `Dispatcher::runSync` → `CallInvoker::invokeSync` exists (`CallInvokerDispatcher.hpp:28-30`), but no Nitro code calls it. A grep finds only definitions, and `UIThreadDispatcher::runSync` throws (`NMM/android/src/main/cpp/threading/UIThreadDispatcher.cpp:18-20`).
  - **So there is no supported synchronous UI-thread→React-JS call.**

**f. Interaction with Reanimated.**
- *Animated props:*
  - Reanimated 4.5.1 applies UI-thread prop updates by cloning with `RawProps(folly::dynamic)` ([RA] `react-native-reanimated/Common/cpp/reanimated/Fabric/updates/UpdatesRegistryManager.cpp:121-133`; `Fabric/ShadowTreeCloner.cpp:24-35`). RN's dynamic mode stores folly values ([RN] `renderer/core/RawPropsParser.cpp:146-163`).
  - Nitro's `ReactProp::fromRawValue` casts every *present* Nitro prop to `std::pair<jsi::Runtime*, jsi::Value>` ([N] `NMM/cpp/views/ReactProp.hpp:93-99`). For a folly-backed value that cast throws "Cannot cast dynamic to a jsi::Value type" ([RN] `renderer/core/RawValue.h:405-409`). The maintainer confirmed this cast requires JSI-backed RawValues (https://github.com/margelo/nitro/issues/1572).
  - Inferred, not run: animating a **Nitro-declared** prop through Reanimated throws. Animating base `ViewProps` such as `opacity` or `transform` is unaffected, because `ReactProp` returns the previous value when its key is absent (`ReactProp.hpp:93-97`).
- *`registerForEvents(viewTag)` / `useEvent`:* Reanimated only sees Fabric events.
  - Android listens through `mFabricUIManager.eventDispatcher.addListener(this)` and `onEventDispatch` ([RA] `react-native-reanimated/android/src/main/java/com/swmansion/reanimated/NodesManager.kt:72,196-226`).
  - iOS listens through a scheduler `EventListener` on RawEvents on the main queue ([RA] `react-native-reanimated/apple/reanimated/apple/ReanimatedModule.mm:60-72`).
  - Nitro views declare no Fabric events: the view config has empty event types and the emitter is the default `ViewEventEmitter`. Their callbacks travel via `CallInvoker` instead. **So Reanimated cannot intercept Nitro view callbacks.**
- Also open: https://github.com/margelo/nitro/issues/1380, "HybridView props are not re-applied when Fabric recreates the native view" (reported on 0.35.x with react-native-screens). Whether 0.37's `ReactProp` rewrite fixes it is **unconfirmed**.

## 3. HybridObjects (non-view)

- **Kotlin calling a JS listener:**
  - A JS function parameter appears in Kotlin as a generated `fun interface Func_void_double: (Double) -> Unit` ([N] `NT/android/kotlin/com/margelo/nitro/test/Func_void_double.kt:23-31`). When the function comes from JS, it is `Func_void_double_cxx`, whose `invoke` calls `external fun invoke_cxx` (45-62). That lands in C++ `JFunc_void_double_cxx::invoke_cxx` → `std::function` (`NT/android/c++/JFunc_void_double.hpp:41-53`).
  - The `std::function` is an `AsyncJSCallback` (§2e). The full path is: JNI down-call → C++ `std::function` → `CallInvoker::invokeAsync` (RuntimeScheduler `ImmediatePriority`) → on the JS thread, `JSIConverter::toJSI` for each argument → `jsi::Function::call` (`JSCallback.hpp:43-57,105-116`).
  - It can be called from any thread (`DOCS/types/callbacks.md:146-147`), and there is no coalescing. Callbacks that return a value return a `Promise` (`DOCS/types/callbacks.md:114-142`; `JSIConverter+Function.hpp:30`).
- **Per-call overhead, JS→Kotlin:** a JSI host function → C++ `JHybrid…Spec` → cached fbjni `getMethod` → Kotlin. For example, `getNumberValue` ([N] `NT/android/c++/JHybridTestObjectSwiftKotlinSpec.cpp:187-191`). The docs advise "Use C++ if possible … bridging to Swift or Kotlin is not required" (`DOCS/guides/performance-tips.md:287-289`).
- **Synchronous property reads:** yes. "Every method on a Hybrid Object is synchronous and runs on the JS Thread" (`DOCS/guides/sync-vs-async.md:9-10`). Properties support get and set (`DOCS/concepts/hybrid-objects.md:11`).
- **Worklets and Reanimated 4:**
  - Since https://github.com/margelo/nitro/pull/1166 (merged 2026-01-16, so ≥0.33.2 judging by the publish time), Nitro registers a `react-native-worklets` custom serializable on import. It `box`es and `unbox`es HybridObjects automatically ([N] `NMM/src/worklets/installWorkletsSupport.ts:4-30`; `NMM/src/index.ts:17`). The docs example is `runOnUI(() => { 'worklet'; math.add(5, 3) })()` (`DOCS/guides/worklets.md:14-23`).
  - `react-native-worklets-core` needs a manual `NitroModules.box(...)` and `.unbox()` (`DOCS/guides/worklets.md:25-37,70-89`; box was added in https://github.com/margelo/nitro/pull/138).
  - Callbacks and Promises need a `Dispatcher` on that runtime (`DOCS/guides/worklets.md:41-68`). On the UI thread Nitro auto-installs a `UIThreadDispatcher` ([N] `NMM/cpp/threading/Dispatcher.cpp:48-52`). Its `runAsync` posts a Runnable to the main looper, so it is async (`NMM/android/src/main/cpp/threading/UIThreadDispatcher.cpp:13-16`). The docs for worklet runtimes created with `createWorkletRuntime` are still an open PR (https://github.com/margelo/nitro/pull/1688).
  - Reanimated 4 issue https://github.com/margelo/nitro/issues/1104 was closed by the maintainer as not Nitro-related.
- **Open multi-runtime risks:**
  - https://github.com/margelo/nitro/issues/1705: process-wide caches are unsynchronised across runtimes, causing "SIGSEGV / heap corruption / hang". The maintainer says this is "fixed in Nitro V1".
  - https://github.com/margelo/nitro/pull/1451 (open): the same race, with a production crash "RN 0.86 bridgeless … shortly after additional worklet runtimes spin up".
  - I verified unlocked static maps in source: `NMM/cpp/jsi/JSICache.hpp:70` with `JSICache.cpp:39-65`, and `NMM/cpp/threading/Dispatcher.cpp:23-61`.
  - Also open: https://github.com/margelo/nitro/issues/1549 (worklets init errors swallowed) and https://github.com/margelo/nitro/issues/1645 (SIGSEGV in a worklet during unmount or reload).

## 4. C++ HybridObject ↔ a library's own Fabric shadow node

- **No Nitro API connects the two.** A C++ HybridObject is a plain `std::shared_ptr<HybridObject>`, registered through `HybridObjectRegistry::registerHybridObjectConstructor` ([N] `NMM/cpp/registry/HybridObjectRegistry.hpp:33-42`; `DOCS/getting-started/configuration-nitro-json.md:151-180`).
- Shared state is ordinary C++. Calling into JS from `layout()` through a stored Nitro `std::function` would be async through `CallInvoker` (§2e). Shadow nodes are cloned and laid out on the JS thread, and also on the UI thread for `unstable_Immediate` and Reanimated commits, so any shared state needs locking (inferred).
- **Library-specific build constraint (inferred):**
  - The library's Android shadow nodes are an `OBJECT` library compiled into the app's autolinked target ([L] `react-native.config.js:4-16`; `android/src/main/jni/CMakeLists.txt:5,16,31`).
  - A Nitro module builds its own `SHARED` library through its own `externalNativeBuild` ([N] `packages/template/android/build.gradle:49-70`; `packages/template/android/CMakeLists.txt:9-14`).
  - Sharing state therefore crosses two `.so`s, unless the shadow nodes move into the Nitro library. Nitro's generated code shows that a library `.so` can register a descriptor at JNI load through `CoreComponentsRegistry::sharedProviderRegistry()->add(...)` ([N] `NG/views/kotlin/KotlinHybridViewManager.ts:203-206`). Whether that suits a hand-written descriptor here is **unconfirmed**.
- **Unistyles 3 ([U], `packages/unistyles/`)** uses Nitro plus shadow-tree updates without any custom ShadowNode:
  1. Its HybridObjects are C++ classes: `HybridStyleSheet`, `HybridUnistylesRuntime` and `HybridShadowRegistry`. They are registered by hand inside a **codegen TurboModule's** `getBindingsInstaller`, which also captures the JS `CallInvoker` as `runOnJSThread` (`android/src/main/cxx/NativeUnistylesModule.cpp:34-62`). `nitro.json` has `"autolinking": {}`, and `package.json:241-245` declares `codegenConfig` type `modules`.
  2. The Babel plugin makes components call `ShadowRegistry.link(ref, styles)`. `link` resolves the host ref to a `ShadowNode` with RN's `Bridging<std::shared_ptr<const ShadowNode>>::fromJs` (`cxx/hybridObjects/HybridShadowRegistry.cpp:6-14,332-334`). It then keys unistyles by `ShadowNodeFamily`.
  3. Native changes (orientation, color scheme, IME) arrive from a Kotlin/Swift Nitro HybridObject's listener (`android/src/main/java/com/unistyles/NativePlatform+android.kt:313`). C++ hops to the JS thread (`cxx/hybridObjects/HybridStyleSheet.cpp:285-293,334`), recomputes styles, then calls `ShadowTreeManager::updateShadowTree(rt)` (`HybridStyleSheet.cpp:347-375`). JS-side link changes are batched with `rt.queueMicrotask` (`HybridShadowRegistry.cpp:165-190`).
  4. `updateShadowTree` takes the pending updates under a lock and builds `tagToProps` as `folly::dynamic`. It merges them into `ShadowNodeFamily::nativeProps_DEPRECATED`, so later React commits keep them (`cxx/shadowTree/NativeProps.h:25-37`). It then calls RN's `UIManager::updateShadowTree(std::move(tagToProps))` (`cxx/shadowTree/ShadowTreeManager.cpp:7-38`). RN clones each node's props with `RawProps(folly::dynamic)` and commits ([RN] `renderer/uimanager/UIManager.h:215`; `UIManagerUpdateShadowTree.cpp:87,174-177`).
  5. In short: the commits run on the **JS thread** and patch props of stock host components. Unistyles subclasses no ShadowNode or ComponentDescriptor. `UnistylesCommitTrait` is defined (`cxx/core/UnistylesCommitShadowNode.h:10`) but not referenced elsewhere at this SHA.
- **Other precedents:**
  - VisionCamera v5 uses only nitrogen-generated Hybrid Views (`nitrogen/generated/.../HybridPreviewViewComponent.hpp`, `HybridFrameRendererViewComponent.hpp`). A tree search for `ShadowNode`/`ComponentDescriptor` outside `nitrogen/generated` returned nothing, and it has no `codegenConfig` ([VC]).
  - react-native-video v7 pairs a **codegen Fabric component** `RNCVideoView` (`packages/react-native-video/src/spec/fabric/VideoViewNativeComponent.ts:12-17`; `package.json` `codegenConfig` type `components`) with Nitro HybridObjects. The two are linked by a numeric `nitroId` prop and `VideoViewViewManagerFactory.createViewManager(nitroId)` (`src/spec/nitro/VideoViewViewManager.nitro.ts:91-95`; `src/core/video-view/VideoView.tsx:78-130,310-312`) ([V]).
  - MMKV is a pure C++ HybridObject (`nitro.json` autolinking `"language": "c++"`) with no views ([M]).
  - **No precedent found** for a library that combines Nitro with a custom `ConcreteViewShadowNode` subclass that overrides `layout` or `appendChild`. GitHub code search for `ConcreteViewShadowNode` turned up none alongside Nitro. This absence is **unconfirmed**.

## 5. Build integration cost

- **Library files:**
  - `nitro.json` at the module root ([N] `DOCS/getting-started/configuration-nitro-json.md:8-25`).
  - `*.nitro.ts` specs.
  - `nitrogen` as a devDependency (`packages/template/package.json:62`).
  - Generated `nitrogen/generated/**`, which "should be committed to the repository/package" (`DOCS/concepts/nitrogen.md:46,157-158`). It goes in the npm `files` list (`packages/template/package.json:10-14`).
- **iOS:** `load 'nitrogen/generated/ios/<Module>+autolinking.rb'` and `add_nitrogen_files(s)` at the end of the podspec (`packages/template/$$iosModuleName$$.podspec:25-26`; `DOCS/concepts/nitrogen.md:175-180`).
- **Android:**
  - `apply from: '../nitrogen/generated/android/<Lib>+autolinking.gradle'` (`packages/template/android/build.gradle:23`).
  - A library-level CMake `SHARED` library (`build.gradle:49-70`; `CMakeLists.txt:9-14`).
  - `prefab true` (97) and `implementation project(":react-native-nitro-modules")` (140).
  - The generated CMake adds `-DRN_SERIALIZABLE_STATE` and links `fbjni`, `ReactAndroid::jsi`, `react-native-nitro-modules::NitroModules` and `ReactAndroid::reactnative` (`NT/android/NitroTest+autolinking.cmake:19-20,87-110`).
  - `JNI_OnLoad` registers natives (`packages/template/android/src/main/cpp/cpp-adapter.cpp:5-9`). The Package's companion `init` loads the library (`…/$$androidCxxLibName$$Package.kt:13-16`; `NT/android/kotlin/com/margelo/nitro/test/NitroTestOnLoad.kt:21-25`).
  - Hybrid View managers must be added by hand to `createViewManagers` (`DOCS/guides/view-components.md:119-135`).
  - [L] currently has no `externalNativeBuild` in `android/build.gradle`, so all of this would be new.
- **Consumers** must install `react-native-nitro-modules` (`DOCS/resources/for-library-users.md:12-39`). The template declares it as a peer dependency, marked optional in `peerDependenciesMeta` (`packages/template/package.json:69-77`).
- **Coexistence with RN codegen:** yes, by precedent.
  - Nitro itself ships a codegen TurboModule (`NMM/package.json:86-88`).
  - Unistyles has codegen modules plus Nitro (§4).
  - react-native-video v7 has codegen components plus Nitro (§4).
  - Nitro libraries normally have no `codegenConfig` (`packages/template/package.json`) and an empty `react-native.config.js` (`packages/template/react-native.config.js`). Whether Nitro conflicts with this library's `cmakeListsPath` and `componentDescriptors` override is **unconfirmed**. No conflict is apparent from source, since the two build different targets.

## 6. Published benchmarks

- **Docs table:** "total execution time when calling a single native method 100.000 times" ([N] `DOCS/getting-started/what-is-nitro.md:53-78`; `DOCS/resources/comparison.md:16-41`):

  | | ExpoModules | TurboModules | NitroModules |
  | --- | --- | --- | --- |
  | `addNumbers` | 434.85 ms | 115.86 ms | 7.27 ms |
  | `addStrings` | 429.53 ms | 179.02 ms | 29.94 ms |

  The source is https://github.com/mrousavy/NitroBenchmarks (README: iPhone 15 Pro, Release; TurboModule in Objective-C, Expo and Nitro in Swift; measured with `performance.now()`). These measure only **synchronous JS→native call throughput**. The docs say they "do not necessarily reflect real world use-cases".
- **In-repo benchmark app ([Nm]):** a Release/Hermes app "for measuring JS ↔ native boundary performance" (`tests/react-native/apps/benchmark/README.md:1-5`). It includes `callback/synchronous` and promise cases plus TurboModule and plain-JS controls (`src/benchmarks/suite.ts:323-335,466-489`). No published numbers were found in the repo (**unconfirmed**).
- **Not found:** any benchmark of Nitro Views vs Fabric components, or of native→JS callbacks vs Fabric events (the library's `onHingeChange` path). This absence is **unconfirmed**.

---

## Implications for this library

1. **Android `ArrangementViewShadowNode` cannot become a Hybrid View.** Nitro's node is a bare `ConcreteViewShadowNode` alias with a `final` descriptor, so overriding `appendChild` and `layout` would mean forking files that nitrogen regenerates (§2a, §2c). Verdict: **keep**.
2. **The State slot conflicts.** Nitro uses Fabric State to carry props on Android and rewrites it in `adopt()`. `ArrangementViewState` (the environment pushed by `ArrangementStateBridge.cpp` with `unstable_Immediate`) has nowhere to live. A `StateWrapper.updateState` on a Nitro view would erase the props (§2b). Verdict: **conflict**.
3. **Children are a hard blocker.** Panes hold arbitrary React children, but Nitro views are `SimpleViewManager` on Android and mount children behind `contentView` on iOS. That stays true until #873 or PR #1644 lands. Both [Nm] and [Nv1] still generate `SimpleViewManager` (§2d, §2a).
4. **The iOS side has the same mismatch.** `RNArrangementPaneShadowNode.h` (custom `ArrangementPaneState` plus a `layout` override plus a custom `adopt`) cannot be expressed. Nitro iOS views are Swift-only and wrap a single `contentView` (§2).
5. **`onPanesChange` gains nothing.** Emitted from `layout()`, it could be a Nitro callback. That path is async through `CallInvoker` and safe from any thread, but it leaves Fabric's event pipeline, so it loses ordering with the commit and can't be seen by Reanimated (§2e, §2f). No benefit was found.
6. **`onHingeChange` (~60/s) gains are unproven.** As a Nitro listener, each sample is one JNI call plus one RuntimeScheduler `ImmediatePriority` task, with no coalescing. Nitro's published numbers measure sync JS→native calls, not this direction (§3, §6). Measure before switching.
7. **Nitro would hurt `useAnimatedHinge` (branch `t3code-0c39d172`, `src/reanimated/index.ts:40-63`).** `registerForEvents(tag)` only sees Fabric events (Android `EventDispatcher` listener, iOS RawEvent listener), and Nitro callbacks bypass both (§2f). The `hingeWorklets` replay via a Fabric prop would also need redesigning.
8. **The worklet alternative is not ready.** A HybridObject captured in a worklet with a UI-runtime listener is possible (§3), but async delivery posts to the main looper. It would also run into the open multi-runtime races (#1705, PR #1451, which includes an RN 0.86 crash report).
9. **Never animate Nitro-declared view props through Reanimated.** Its `folly::dynamic` RawProps would throw in `ReactProp` (inferred, §2f). This matters if a pane prop is ever animated.
10. **Unistyles proves the C++ HybridObject + shadow-tree pattern only on the JS thread.** Its updates go through `UIManager::updateShadowTree`, which is slower than this library's UI-thread immediate state update. It is no precedent for a custom ShadowNode subclass (§4).
11. **Sharing C++ state is possible in principle but needs a build rework.** The shadow nodes would move from the app's `OBJECT` target into a Nitro-built `.so` and self-register their descriptors (§4, inferred). That is high cost for no identified gain.
12. **Build cost is real:** `nitro.json`, specs, committed `nitrogen/generated/**`, a new library-level CMake/prefab build, `RN_SERIALIZABLE_STATE`, and a new peer dependency for every consumer (§5).
13. **Version risk is high:**
    - Nitro is 0.x with a V1 rewrite said to be weeks away.
    - 0.37.1 was tested on RN 0.85.3.
    - The Android base-props fix for RN 0.86 (with the exclusive-props flag on) and 0.87+ exists only on nightly.
    - There is no Expo plugin or SDK 57 statement, and an open Expo-web deep-import issue (#1216) for any view usage (§1).
14. **Nothing found would replace the custom shadow node.** No Nitro feature covers what it does: pane frames that mount in the same frame, without JS. Nitro's strengths (sync JS→native calls, rich types) are paths this library barely uses.
15. **Verdict: do not adopt Nitro for views. Keep the custom shadow node and codegen components.** Revisit only if V1 ships children support plus customisable shadow nodes and State, and a measured win for hinge events shows up that keeps Reanimated event interception working.
