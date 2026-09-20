# Contributing

Use Node 24 and Yarn 4 (the repository includes its Yarn release).

```sh
yarn install
yarn example expo prebuild --platform ios
yarn example ios --device "iPhone Duo" --port 8088
```

Native code is in `ios/`, the TypeScript API in `src/`, and the Expo app in `apps/example-expo/`. Generated app-native directories are ignored; change Expo configuration and regenerate them instead. Rebuild the app after changing native code. JavaScript changes use Metro Fast Refresh.

```sh
yarn test
yarn typecheck
yarn lint
yarn build
```

Select Xcode 27.1+ before CocoaPods installation to enable arrangement APIs. Older SDKs compile only the fallback. The CI macOS job checks the fallback build with its installed SDK; native posture validation requires an iOS 27.1 Duo simulator.

Keep app interactions serial within an agent-device session. Follow `agent-device help workflow`, use a dedicated device/session, and do not terminate another task's simulator lease. Use Device Hub for hardware postures and agent-device for app actions, assertions, and evidence. Record exact SDK, runtime, commands, and observed behavior in `docs/validation.md`.
