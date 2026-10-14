# How panes are arranged

`ArrangementView` delegates layout to Apple's SwiftUI `ArrangementView`: two React panes can split horizontally or vertically, overlap, or become hidden as the available space and device posture change. SwiftUI determines whether a split is appropriate; an axis restriction does not force two panes to stay visible.

This version is iOS only. On Android and web, rendering the component throws an explicit unsupported-platform error.

## Fallback

When running below iOS 27.1 **or building with an older SDK**:

- `split` displays only the primary pane. The secondary React tree remains mounted but is outside the visible native hierarchy.
- `overlay` layers primary over secondary at full size.
- `axes` has no effect. Hinge state remains unavailable.

The podspec checks the selected SDK at pod-install time and defines a Swift compilation condition only when the APIs are present. Runtime availability is checked separately. Android has no native implementation or fold-awareness claim.

## Implementation and scope

Layout and hinge observation use **SwiftUI APIs only**. The minimal `UIViewRepresentable` / `UIHostingController` boundary embeds existing React Native views and attaches the host to its actual ancestor controller. No `UIArrangementViewController`, `UIHingeInteraction`, global key-window lookup, or dependency on another arrangement/tab library is used.

The native bridge keeps both React pane instances alive across SwiftUI style changes. Custom Fabric pane state supplies native sizes and content origins to React Native. Native hosting views are not recycled. Reserved-region access, Android support, custom split ratios, and a standalone hinge observer outside an arrangement are not included in this initial API.

### References

- [Apple: ArrangementView](https://developer.apple.com/documentation/swiftui/arrangementview)
- [Apple: onHingeChange](<https://developer.apple.com/documentation/swiftui/view/onhingechange(isenabled:_:)>)
- [Apple: adaptive layouts](https://developer.apple.com/videos/play/tech-talks/111463/)
- [React Native: Fabric native components](https://reactnative.dev/docs/fabric-native-components-introduction)
