---
pageType: home

hero:
  name: react-native-arrangement-view
  tagline: SwiftUI adaptive arrangements and hinge observation for React Native. iOS only, using the New Architecture (Fabric).
  image:
    src: /logo/logo.svg
    alt: react-native-arrangement-view logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/installation
    - theme: alt
      text: API
      link: /api/arrangement-view

features:
  - title: SwiftUI arrangements
    details: ArrangementView delegates layout to Apple's SwiftUI ArrangementView. Two React panes can split, overlap, or become hidden as space and posture change.
    icon: 🗂️
    link: /api/arrangement-view
  - title: React owns the content
    details: Hiding a pane does not unmount its React tree, so pane state survives folding, rotation, and style changes.
    icon: ⚛️
    link: /guide/demos
  - title: Hinge observation
    details: useHingeChange reports the hinge angle and posture of the arrangement it is rendered in.
    icon: 📐
    link: /api/use-hinge-change
  - title: Fallback
    details: Below iOS 27.1, or with an older SDK, a deterministic SwiftUI fallback keeps the primary pane on screen.
    icon: 🛟
    link: /guide/how-panes-are-arranged#fallback
---
