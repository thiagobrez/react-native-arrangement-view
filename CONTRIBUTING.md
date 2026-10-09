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

Results are written to `apps/example-expo/.e2e/`. The E2E workflow runs the Android tests on CI. The iOS tests run locally only, because GitHub's Mac runners can't run the iPhone Duo simulator yet ([#23](https://github.com/thiagobrez/react-native-arrangement-view/issues/23)).

e2e folds only the iPhone Duo, so `.yarn/patches/` adds `device.fold` for foldable Android emulators, through their hinge sensor. Drop it when `@e2e-dev/mobile` folds Android.

## Docs

The documentation site in `apps/docs/` is built with [Rspress](https://rspress.rs) and deployed to GitHub Pages from `main`. The logo and comparison screenshots it shows are served from the repository's `docs/` directory, which the README also uses. The README keeps only installation and a quick start; document everything else on the site.

```sh
yarn docs dev       # http://localhost:3000/react-native-arrangement-view/
yarn docs build
```

The docs are versioned per minor release; patch releases share their minor's docs. Each version has a folder in `apps/docs/docs/`, such as `v0.2/`, with its own `_nav.json` and `_meta.json` for the navbar and sidebar. The version of the released package, read from `package.json`, is the default and is served at the site root; the others are served under their version, such as `/v0.1/`. Document a change in the folder of the version that ships it.

To document a minor version before it ships, copy the latest folder to the new version's name; its pages say they aren't released yet. When the release pull request merges and bumps `package.json`, the docs deploy makes the version the default. Pages that keep the same path in every version let the version menu switch between them directly.

`.yarn/patches/` fixes the version menu's link to the default version from its own pages in `@rspress/core` 2.0.23. Drop it when upgrading to a release that fixes `replaceVersion`.

## iOS

Select Xcode 27.1+ before CocoaPods installation to enable arrangement APIs. Older SDKs compile only the fallback. The CI macOS job checks the fallback build with its installed SDK; native posture validation requires an iOS 27.1 Duo simulator.

## Android

SwiftUI arranges the panes on iOS. Android has no equivalent container, so the native view only reports its size, its window's size, the fold, and the hinge; `src/arrange.ts` is the layout policy, following Material's adaptive layout rules, and `tests/arrange.test.ts` is its contract. Change pane placement there, not in Kotlin.

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
