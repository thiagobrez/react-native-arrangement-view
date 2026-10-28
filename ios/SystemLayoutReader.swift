import UIKit

/// Reads what the system reserves in a view, in the view's coordinates, and
/// reports it when it changes. The view calls `viewDidMoveToWindow()` and
/// `publish()` from its own UIKit callbacks.
@MainActor @objc(RNSystemLayoutReader)
public final class RNSystemLayoutReader: NSObject {
  @objc public var onLayoutChange: ((NSDictionary) -> Void)?
  private weak var view: UIView?
  private var barExtents: [String: CGFloat] = [:]
  private var lastLayout: NSDictionary?
  private var hasHinge: Bool? = false

  @objc public init(view: UIView) {
    self.view = view
    super.init()
    if #available(iOS 17.0, *) {
      view.registerForTraitChanges([UITraitHorizontalSizeClass.self, UITraitVerticalSizeClass.self]) {
        [weak self] (_: UIView, _: UITraitCollection) in
        self?.publish()
      }
    }
    // The hinge and vertical-bar APIs ship in the iOS 27.1 SDK, whose UIKit is 9127.0.85.
    // Xcode 27.0 has Swift 6.4 but the 27.0 SDK (UIKit 9127.0.84), so gate on the SDK.
    #if canImport(UIKit, _version: 9127.0.85)
    if #available(iOS 27.1, *) {
      hasHinge = nil
      view.addInteraction(UIHingeInteraction { [weak self] _, update in
        guard let self, self.view?.window != nil else { return }
        // Capability survives temporary detachment and does not follow the hinge angle.
        let hasHinge = self.hasHinge == true || update.hinge != nil
        guard self.hasHinge != hasHinge else { return }
        self.hasHinge = hasHinge
        self.publish()
        // UIKit lays a view out for a fold only if its last layoutSubviews read reservedRegions, and publish() skipped them until now.
        self.view?.setNeedsLayout()
      })
      view.registerForTraitChanges(UITraitCollection.systemTraitsAffectingVerticalBarEdge) {
        [weak self] (_: UIView, _: UITraitCollection) in
        self?.publish()
      }
    }
    #endif
  }

  /// Extents in points. A negative one asks for no bar on that edge.
  @objc public func setBarExtents(top: CGFloat, bottom: CGFloat, leading: CGFloat, trailing: CGFloat) {
    let next = ["top": top, "bottom": bottom, "leading": leading, "trailing": trailing].filter { $0.value >= 0 }
    guard next != barExtents else { return }
    barExtents = next
    publish()
  }

  @objc public func viewDidMoveToWindow() {
    lastLayout = nil
    assumeNoHingeIfSilent()
    publish()
  }

  /// UIKit only sends hinge updates on devices that have a hinge. Without this,
  /// an ordinary iPhone would never report.
  private func assumeNoHingeIfSilent() {
    guard view?.window != nil, hasHinge == nil else { return }
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
      guard let self, self.view?.window != nil, self.hasHinge == nil else { return }
      self.hasHinge = false
      self.publish()
    }
  }

  @objc public func publish() {
    guard let view, let window = view.window, view.bounds.width > 0, view.bounds.height > 0, let hasHinge
    else { return }
    if hasHinge {
      HingeWindows.register(window)
    }
    var verticalBarEdge = ""
    var folds: [[String: Any]] = []
    var occlusions: [[String: Any]] = []
    var barInsets: [String: CGFloat] = ["top": -1, "bottom": -1, "leading": -1, "trailing": -1]
    #if canImport(UIKit, _version: 9127.0.85)
    if #available(iOS 27.1, *) {
      switch view.traitCollection.verticalBarEdge {
      case .leading: verticalBarEdge = "leading"
      case .trailing: verticalBarEdge = "trailing"
      default: break
      }
      if let extent = barExtents["top"] {
        barInsets["top"] = view.edgeInsets(for: .bar(onEdge: UIRectEdge.top, extent: extent)).top
      }
      if let extent = barExtents["bottom"] {
        barInsets["bottom"] = view.edgeInsets(for: .bar(onEdge: UIRectEdge.bottom, extent: extent)).bottom
      }
      if let extent = barExtents["leading"] {
        barInsets["leading"] =
          view.directionalEdgeInsets(for: .bar(onEdge: NSDirectionalRectEdge.leading, extent: extent)).leading
      }
      if let extent = barExtents["trailing"] {
        barInsets["trailing"] =
          view.directionalEdgeInsets(for: .bar(onEdge: NSDirectionalRectEdge.trailing, extent: extent)).trailing
      }
      for region in view.reservedRegions(kind: .division, options: .includeInactive) {
        var fold = Self.rect(region.frame)
        fold["window"] = Self.rect(view.convert(region.frame, to: nil))
        fold["separating"] = region.isActive
        fold["state"] = ""
        folds.append(fold)
      }
      for region in view.reservedRegions(kind: .occlusion) where region.isActive {
        occlusions.append(Self.rect(region.frame))
      }
    }
    #endif
    let layout: NSDictionary = [
      "width": view.bounds.width, "height": view.bounds.height,
      "hasHinge": hasHinge,
      "keepsLines": false,
      "horizontalSizeClass": view.traitCollection.horizontalSizeClass == .regular ? "regular" : "compact",
      "verticalBarEdge": verticalBarEdge,
      "safeArea": [
        "top": view.safeAreaInsets.top, "right": view.safeAreaInsets.right,
        "bottom": view.safeAreaInsets.bottom, "left": view.safeAreaInsets.left,
      ],
      "folds": folds,
      "occlusions": occlusions,
      "barInsets": barInsets,
    ]
    guard lastLayout?.isEqual(layout) != true else { return }
    lastLayout = layout
    onLayoutChange?(layout)
  }

  private static func rect(_ rect: CGRect) -> [String: Any] {
    ["x": rect.minX, "y": rect.minY, "width": rect.width, "height": rect.height]
  }
}
