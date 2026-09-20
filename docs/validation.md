# Simulator validation

Validated locally on September 20, 2026. These are simulator results, not physical-device certification.

## Environment

- Xcode 27.1 beta, build 27A9269; iOS 27.1 SDK.
- Dedicated iPhone Duo simulator: `Arrangement QA Duo`, iOS 27.1.
- Dedicated iPhone 17 Pro simulator: `Arrangement QA iPhone`, iOS 26.5.
- Expo 57.0.24, React Native 0.86.3, React 19.2.3; Fabric enabled.
- agent-device 0.20.10. Apple Device Hub supplied hardware posture controls and inner-display taps.
- Swift fallback typechecked separately with Xcode 26.6 and its iOS 26.5 simulator SDK.

The repository was generated with create-react-native-library 0.63.1. No npm package or remote repository was published.

## Observed behavior

| Check                                | Result                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Closed → open → book → open → closed | Passed. Layout changes without resetting the two React counters.                                                                                                                                                                                                                    |
| Split, both axes                     | Closed portrait produced two 382 × 202 pt panes. Open landscape produced 434 × 432 and 433 × 432 pt panes.                                                                                                                                                                          |
| Split, horizontal restriction        | Closed portrait showed only the primary pane (382 × 405 pt). Opening restored the secondary pane and its counter.                                                                                                                                                                   |
| Split, vertical restriction          | Open landscape showed only the primary pane (867 × 432 pt); the secondary was absent from the visible accessibility snapshot.                                                                                                                                                       |
| Partially folded split               | Book posture produced 456 × 432 and 371 × 432 pt panes separated by the division gap.                                                                                                                                                                                               |
| Overlay                              | Flat: both panes occupied 867 × 432 pt, with the primary floating over the secondary. Book: native SwiftUI separated the panes.                                                                                                                                                     |
| State preservation                   | Primary count 1 and secondary count 3 survived style changes, folding, hiding, and reappearance. The arrangement video shows independent counter increments.                                                                                                                        |
| Touch targets                        | Both counters worked after native resize/reposition. A secondary counter underneath the transparent area of the primary overlay remained tappable.                                                                                                                                  |
| Native size versus React `onLayout`  | Compared agent-device native rectangles with displayed React dimensions. For example, native 433.667 × 432 reported 434 × 432; after rotation, native 334.667 × 632 reported 335 × 632. Displayed values are rounded to whole points.                                               |
| Rotation                             | Open/book checked in portrait and landscape; panes relaid out, counters retained state. Closed portrait and landscape also observed.                                                                                                                                                |
| Scrolling and clipping               | Scrolled Duo primary content with a raw swipe after the higher-level scroll command did not move it. Fallback iPhone scrolled to `END OF PRIMARY`. The example's complete pane content now scrolls so short panes can reach the hinge readout. Content remains clipped to its pane. |
| Safe areas                           | Example uses a single outer SafeAreaView. Inspected header/footer and pane edges in both orientations; no duplicate native padding.                                                                                                                                                 |
| Hinge hook                           | Open: 180° / approximately π radians / `fullyOpen`. Book: approximately 128° / 2.23 radians / `partiallyOpen`. Closed: 0° / 0 radians / `closed`. Intermediate updates also appeared.                                                                                               |
| Older iOS fallback                   | On iOS 26.5, split showed only primary, overlay exposed both panes, both counters survived hide/show, and the hook displayed `Unavailable` / `unknown`.                                                                                                                             |
| Accessibility                        | Visible snapshots included interactive content in displayed panes and excluded the hidden secondary. Full VoiceOver focus traversal was not tested.                                                                                                                                 |

The example conditionally replaces the primary ScrollView with a floating panel in overlay mode, so its scroll position resets on that example-specific change. React component state remains intact. Device-posture changes do not replace the React pane tree.

## Evidence

- [Arrangement video](videos/arrangement.mp4): agent-device recording, encoded at 1280 × 900, 2× speed.
- [Hinge video](videos/hinge.mp4): agent-device recording, encoded at 1280 × 900, real time.
- [Open split](screenshots/open-split.png), [flat overlay](screenshots/arrangement-overlay.png), [book hinge](screenshots/hinge-book.png), [rotated hinge](screenshots/hinge-portrait.png).
- [Fallback hinge unavailable](screenshots/fallback-hinge.png), [fallback scroll end](screenshots/fallback-scroll.png).

Videos retain actual simulator output. They were resized/compressed with ffmpeg; no synthetic state or transitions were added. The arrangement capture preceded the example-only change that moved the header inside each pane's ScrollView; the layout and native implementation are the same.

## Checks run

All passed:

```sh
yarn test        # 4 focused hinge contract/subscription tests
yarn typecheck
yarn lint
yarn build
yarn pack --out .artifacts/react-native-arrangement-view.tgz

xcodebuild \
  -workspace apps/example-expo/ios/ArrangementViewExample.xcworkspace \
  -scheme ArrangementViewExample -configuration Debug -sdk iphonesimulator \
  -destination 'id=D6F472BD-B3CC-4B3F-9ACB-91C2B506EED3' \
  -derivedDataPath .artifacts/DerivedData CODE_SIGNING_ALLOWED=NO

DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun swiftc \
  -typecheck \
  -sdk /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator26.5.sdk \
  -target arm64-apple-ios16.4-simulator ios/ArrangementHost.swift
```

Native SwiftUI code was also typechecked with the iOS 27.1 SDK and `-D RAV_HAS_ARRANGEMENT`. The complete example was built with Xcode 27.1 and run on both runtimes. The older-Xcode check covered the Swift host, not a complete second app build. CI configuration was added but has not run on a remote runner.

Hook tests cover unavailable hardware, unknown future statuses, radians without threshold inference, independent observer stores, duplicate suppression, unsubscribe, latest callback, and unmount cleanup. React's test renderer emits its upstream deprecation notice; tests pass.

## Device automation notes

Start with `agent-device --version` and `agent-device help workflow`. Use a dedicated session and serialize actions per device:

```sh
agent-device open arrangementview.example --platform ios \
  --device "Arrangement QA Duo" --metro-port 8088 --session arrangement-qa
agent-device snapshot -i --session arrangement-qa
agent-device get attrs 'id="primary-pane"' --session arrangement-qa
agent-device get text 'id="primary-dimensions"' --session arrangement-qa
agent-device record start /tmp/arrangement.mp4 --hide-touches --session arrangement-qa
# Change posture using Device Hub; act and re-snapshot.
agent-device record stop --session arrangement-qa
agent-device close --session arrangement-qa
```

On this beta, agent-device's snapshots and recordings saw the active inner display, but synthesized taps on an unfolded Duo went to the inactive outer display. Device Hub accessibility clicks supplied inner-display taps; agent-device then verified counter text and native bounds. Closed-device and ordinary-iPhone taps worked through agent-device. Some high-level scroll commands also failed to move content, so a raw swipe was used and its visible result checked.

Closed Duo screenshots from agent-device selected the inactive inner display. The outer display can instead be captured with `xcrun simctl io <udid> screenshot --display=1 <path>`. The README movies therefore demonstrate open/book transitions on one active display. Closed transitions were checked separately.

An existing simulator was leased by another agent-device task. That task and its simulator were left alone; the two QA simulators were created separately.

## Remaining validation

- Physical hardware, arbitrary hinge positions/precision, and release builds.
- Native navigation/tab containers, interactive transitions, sheets, nested arrangements, keyboard interaction, and multi-window/multitasking resizing. The example's arrangement and axis selectors are React controls, not native navigation tabs.
- Full VoiceOver traversal, Dynamic Type extremes, right-to-left layout, and automated touch testing on the inner display once tooling supports it.
- Runtime behavior on iOS 16.4–26.4 and React Native versions other than 0.86.3.
- Disabling/re-enabling hinge observation at runtime is implemented, but not separately exercised in the simulator example.

Android, web, and standalone hinge observation outside an ArrangementView are outside this initial implementation.
