import SwiftUI
import Combine

private final class ArrangementModel: ObservableObject {
  @Published var primary: UIView?
  @Published var secondary: UIView?
  @Published var arrangement = "split"
  @Published var axes = "both"
  @Published var observeHinge = true
  var hingeChanged: ((Bool, Double, String) -> Void)?
  var paneLayout: ((UIView, CGRect) -> Void)?
  weak var host: UIView?

  var supportedAxes: Axis.Set {
    switch axes {
    case "horizontal": return .horizontal
    case "vertical": return .vertical
    default: return [.horizontal, .vertical]
    }
  }
}

// UIKit is only the React Native / SwiftUI hosting boundary. All arrangement
// decisions and hinge observation below use SwiftUI, including the fallback.
private final class PaneContainer: UIView {
  weak var model: ArrangementModel?
  let pane: UIView

  init(pane: UIView, model: ArrangementModel) {
    self.pane = pane
    self.model = model
    super.init(frame: .zero)
    clipsToBounds = true
    addSubview(pane)
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) is unavailable") }
  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let target = super.hitTest(point, with: event)
    return target === self ? nil : target
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    guard let model, let host = model.host else { return }
    model.paneLayout?(pane, convert(bounds, to: host))
  }
}

private struct ReactPane: UIViewRepresentable {
  let pane: UIView
  let model: ArrangementModel
  func makeUIView(context: Context) -> PaneContainer { PaneContainer(pane: pane, model: model) }
  func updateUIView(_ view: PaneContainer, context: Context) { view.setNeedsLayout() }
  func sizeThatFits(_ proposal: ProposedViewSize, uiView: PaneContainer, context: Context) -> CGSize? {
    CGSize(width: proposal.width ?? 0, height: proposal.height ?? 0)
  }
  static func dismantleUIView(_ view: PaneContainer, coordinator: ()) {
    // A style change may already have moved the same React view to its new slot.
    if view.pane.superview === view { view.pane.removeFromSuperview() }
  }
}

private struct ArrangementContent: View {
  @ObservedObject var model: ArrangementModel

  @ViewBuilder private var primary: some View {
    if let pane = model.primary { ReactPane(pane: pane, model: model) }
  }
  @ViewBuilder private var secondary: some View {
    if let pane = model.secondary { ReactPane(pane: pane, model: model) }
  }

  @ViewBuilder var body: some View {
#if RAV_HAS_ARRANGEMENT
    if #available(iOS 27.1, *) {
      nativeArrangement
        .onHingeChange(isEnabled: model.observeHinge) { _, context in
          guard let hinge = context.hinge else {
            model.hingeChanged?(false, 0, "unknown")
            return
          }
          let status: String
          switch hinge.status {
          case .closed: status = "closed"
          case .partiallyOpen: status = "partiallyOpen"
          case .fullyOpen: status = "fullyOpen"
          default: status = "unknown"
          }
          model.hingeChanged?(true, hinge.angle.radians, status)
        }
    } else {
      fallback
    }
#else
    fallback
#endif
  }

#if RAV_HAS_ARRANGEMENT
  @available(iOS 27.1, *)
  @ViewBuilder private var nativeArrangement: some View {
    if model.arrangement == "overlay" {
      ArrangementView { primary } secondary: { secondary }
        .arrangementViewStyle(.overlay.axes(model.supportedAxes))
    } else {
      ArrangementView { primary } secondary: { secondary }
        .arrangementViewStyle(.split.axes(model.supportedAxes))
    }
  }
#endif

  @ViewBuilder private var fallback: some View {
    if model.arrangement == "overlay" {
      ZStack { secondary; primary }
    } else {
      // Deterministic compact fallback. The secondary React tree stays mounted.
      primary
    }
  }
}

@objc(RNArrangementHost)
public final class RNArrangementHost: UIView {
  private let model = ArrangementModel()
  private var controller: UIHostingController<ArrangementContent>!

  @objc public var onHingeChange: ((Bool, Double, String) -> Void)? {
    didSet { model.hingeChanged = onHingeChange }
  }
  @objc public var onPaneLayout: ((UIView, CGRect) -> Void)? {
    didSet { model.paneLayout = onPaneLayout }
  }

  @objc public override init(frame: CGRect) {
    super.init(frame: frame)
    model.host = self
    controller = UIHostingController(rootView: ArrangementContent(model: model))
    controller.safeAreaRegions = []
    controller.view.backgroundColor = .clear
    addSubview(controller.view)
    clipsToBounds = true
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) is unavailable") }

  @objc public func setPanes(_ primary: UIView?, secondary: UIView?) {
    if model.primary !== primary { model.primary = primary }
    if model.secondary !== secondary { model.secondary = secondary }
  }
  @objc public func configure(_ arrangement: String, axes: String, observeHinge: Bool) {
    if model.arrangement != arrangement { model.arrangement = arrangement }
    if model.axes != axes { model.axes = axes }
    if model.observeHinge != observeHinge {
      model.observeHinge = observeHinge
      if !observeHinge { model.hingeChanged?(false, 0, "unknown") }
    }
  }
  public override func layoutSubviews() {
    super.layoutSubviews()
    attachController()
    controller.view.frame = bounds
  }
  public override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil { detachController() } else { attachController() }
  }
  private func attachController() {
    guard window != nil else { return }
    var responder: UIResponder? = superview
    while let next = responder {
      if let parent = next as? UIViewController {
        guard controller.parent !== parent else { return }
        detachController()
        parent.addChild(controller)
        controller.didMove(toParent: parent)
        return
      }
      responder = next.next
    }
  }
  private func detachController() {
    guard controller.parent != nil else { return }
    controller.willMove(toParent: nil)
    controller.removeFromParent()
  }
}
