# Contributing

Use Node 24 and Yarn 4 (the repository includes its Yarn release).

```sh
yarn install

yarn example expo prebuild --platform ios
yarn example ios --port 8088       # iPhone Duo simulator

yarn example expo prebuild --platform android
yarn example android --port 8088   # Pixel_10_Pro_Fold emulator
```

Native code is in `ios/` and `android/`, the TypeScript API in `src/`, and the Expo app in `apps/example-expo/`. Generated app-native directories are ignored; change Expo configuration and regenerate them instead. Rebuild the app after changing native code. JavaScript changes use Metro Fast Refresh.

```sh
yarn test
yarn typecheck
yarn lint
yarn build
```

## End-to-end tests

The example app has end-to-end tests in `apps/example-expo/e2e/`, written with [e2e](https://e2e.tester.army/docs). They run on the iPhone Duo simulator and the booted Android emulator (use the `Pixel_10_Pro_Fold` AVD), and open whatever build is installed there, so install a Release build first and again after changing the app:

```sh
yarn example expo prebuild --platform ios
yarn example ios:release      # builds and installs, with the JavaScript bundled
yarn example test:e2e:ios

yarn example expo prebuild --platform android
yarn example android:release
yarn example test:e2e:android
```

Results are written to `apps/example-expo/.e2e/`. The CI workflow runs the Android tests. The iOS tests run locally only, because GitHub's Mac runners can't run the iPhone Duo simulator yet ([#23](https://github.com/thiagobrez/react-native-arrangement-view/issues/23)).

### Frame budgets

On Android, `e2e/frames.e2e.ts` fails when a frame draws the panes somewhere other than where they settle, or when the panes wait for JavaScript. It opens a hidden bench screen (`arrangementview://frames`), whose probe in `apps/example-expo/modules/frame-probe/` logs the pane rects of every frame the window draws. `e2e/frames.ts` judges that log. Each scenario is one row of its `scenarios` table:

- **Fold while JavaScript is held.** The panes for the new window size must be drawn before JavaScript runs again.
- **Window resize.** No frame may draw the panes elsewhere once the window and the arrangement have their new size.
- **New arrangement.** A remounted ArrangementView must draw its panes, where the old one had them, on its first frame.

A scenario also fails when a change it drove didn't happen, or when the panes never moved, so a silent probe or a missed fold can't pass. The budgets run with the other Android tests, on CI too. To run only them, with a release build installed:

```sh
yarn example test:e2e:android --tag frames
```

With more than one device connected, name one with `ANDROID_SERIAL=emulator-5554`. A failure names the change and the frame, for example `fold-closed: 1 frame(s) drew the panes out of place; the first, 0.0 ms after the window change, drew …`. Each scenario's log is in `apps/example-expo/.e2e/frames/`, and `yarn test` runs the judge's own tests in `e2e/frames.test.ts`.

To check that the budgets still catch the regressions they exist for, run `yarn example verify:frames:mutants`. It builds and installs the release app once per library mutant listed in `e2e/frames.mutants.ts`, runs the budgets, and puts the source back.

## Docs

The documentation site in `docs/` is built with [Rspress](https://rspress.rs) and deployed to GitHub Pages from `main`. The logo and screenshots it shows are served from `docs/public/`, which the README also uses. The README keeps only installation and a quick start; document everything else on the site.

```sh
yarn docs dev       # http://localhost:3000/react-native-arrangement-view/
yarn docs build
```

The docs are versioned per minor release; patch releases share their minor's docs. Each version has a folder in `docs/docs/`, such as `v0.2/`, with its own `_nav.json` and `_meta.json` for the navbar and sidebar. The version of the released package, read from `package.json`, is the default and is served at the site root; the others are served under their version, such as `/v0.1/`. Document a change in the folder of the version that ships it.

To document a minor version before it ships, copy the latest folder to the new version's name; its pages say they aren't released yet. When the release pull request merges and bumps `package.json`, the docs deploy makes the version the default. Pages that keep the same path in every version let the version menu switch between them directly.

`.yarn/patches/` fixes the version menu's link to the default version from its own pages in `@rspress/core` 2.0.23. Drop it when upgrading to a release that fixes `replaceVersion`.

## iOS

Build with Xcode 27.1+ to enable arrangement APIs. Older SDKs compile only the fallback. The CI macOS job checks the fallback build with its installed SDK; native posture validation requires an iOS 27.1 Duo simulator.

## Android

SwiftUI arranges the panes on iOS. Android has no equivalent container. There, `ArrangementView.kt` measures the view's content box, its window and the fold, and the view's shadow node in `android/src/main/jni/` places the panes with the layout policy in `cpp/arrange.h`, which follows Material's adaptive layout rules. `tests/arrange.test.ts` is the policy's contract. Change pane placement in `cpp/arrange.h`, not in Kotlin or in the shadow node.

`yarn test` and `yarn verify:arrange` build `cpp/arrange.h` into a small program with your C++ compiler, so they need one that supports C++20: `c++` by default, or the one `CXX` names. On macOS, Xcode's command line tools include one.

The Android script runs on an AVD named `Pixel_10_Pro_Fold`; create it with Android Studio's Pixel 10 Pro Fold profile, or `avdmanager create avd -n Pixel_10_Pro_Fold -d pixel_10_pro_fold -k <system image>`. Drive the posture through the emulator console:

```sh
adb emu sensor set hinge-angle0 180   # open; the fold is flat and separates nothing
adb emu sensor set hinge-angle0 90    # half-opened; the fold separates the panes
adb emu sensor set hinge-angle0 0     # closed; the app moves to the cover display
adb emu rotate                        # a vertical fold becomes a horizontal one
```

## Device automation

Keep app interactions serial within an agent-device session. Follow `agent-device help workflow`, use a dedicated device/session, and do not terminate another task's simulator lease. On iOS use Device Hub (`agent-device fold`) for hardware postures; on Android use the emulator console above. Use agent-device for app actions, assertions, and evidence. A posture change invalidates every ref, so re-snapshot after one.

## Releasing

Releases use [changesets](https://github.com/changesets/changesets). If a change affects the published library, add a changeset:

```sh
yarn changeset
```

Changes to the example app or docs don't need one.

When a changeset is merged to `main`, the release workflow opens or updates a `chore(release): version packages` PR. That PR bumps the version and updates `CHANGELOG.md`. Merging it builds the library and publishes it to npm through trusted publishing.
