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
