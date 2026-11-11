import UIKit

@MainActor @objc(RNSystemLayoutReader)
public final class RNSystemLayoutReader: NSObject {
  @objc public var onLayoutChange: ((NSDictionary) -> Void)?
  private weak var view: UIView?
  private var barExtentBottom: CGFloat = -1
  private var lastLayout: NSDictionary?

  @objc public init(view: UIView) {
    self.view = view
    super.init()
    if #available(iOS 17.0, *) {
      view.registerForTraitChanges([UITraitHorizontalSizeClass.self, UITraitVerticalSizeClass.self]) {
        [weak self] (_: UIView, _: UITraitCollection) in
        self?.publish()
      }
    }
    // The reserved region and bar APIs ship in the iOS 27.1 SDK, whose UIKit is 9127.0.85.
    // Xcode 27.0 has Swift 6.4 but the 27.0 SDK (UIKit 9127.0.84), so gate on the SDK.
    #if canImport(UIKit, _version: 9127.0.85)
    if #available(iOS 27.1, *) {
      view.registerForTraitChanges(UITraitCollection.systemTraitsAffectingVerticalBarEdge) {
        [weak self] (_: UIView, _: UITraitCollection) in
        self?.publish()
      }
    }
    #endif
  }

  @objc public func setBarExtentBottom(_ extent: CGFloat) {
    guard extent != barExtentBottom else { return }
    barExtentBottom = extent
    publish()
  }

  @objc public func viewDidMoveToWindow() {
    lastLayout = nil
    publish()
  }

  @objc public func publish() {
    guard let view, view.window != nil, view.bounds.width > 0, view.bounds.height > 0 else { return }
    var verticalBarEdge = ""
    var folds: [[String: Any]] = []
    var occlusions: [[String: Any]] = []
    var barInsetBottom: CGFloat = -1
    #if canImport(UIKit, _version: 9127.0.85)
    if #available(iOS 27.1, *) {
      switch view.traitCollection.verticalBarEdge {
      case .leading: verticalBarEdge = "leading"
      case .trailing: verticalBarEdge = "trailing"
      default: break
      }
      if barExtentBottom >= 0, let window = view.window {
        // A view's own answer keeps what it was when the view joined a pushed
        // screen until the view next moves, so measure the window's bar instead.
        let windowInset = window.edgeInsets(for: .bar(onEdge: UIRectEdge.bottom, extent: barExtentBottom)).bottom
        let below = window.bounds.maxY - view.convert(view.bounds, to: window).maxY
        let scale = max(view.traitCollection.displayScale, 1)
        barInsetBottom = min(max(((windowInset - below) * scale).rounded() / scale, 0), view.bounds.height)
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
      "keepsLines": false,
      "scale": view.traitCollection.displayScale,
      "horizontalSizeClass": view.traitCollection.horizontalSizeClass == .regular ? "regular" : "compact",
      "verticalBarEdge": verticalBarEdge,
      "safeArea": [
        "top": view.safeAreaInsets.top, "right": view.safeAreaInsets.right,
        "bottom": view.safeAreaInsets.bottom, "left": view.safeAreaInsets.left,
      ],
      "folds": folds,
      "occlusions": occlusions,
      "barInsets": ["bottom": barInsetBottom],
    ]
    guard lastLayout?.isEqual(layout) != true else { return }
    lastLayout = layout
    onLayoutChange?(layout)
  }

  private static func rect(_ rect: CGRect) -> [String: Any] {
    ["x": rect.minX, "y": rect.minY, "width": rect.width, "height": rect.height]
  }
}
