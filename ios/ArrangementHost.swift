import SwiftUI
import Combine

private final class ArrangementModel: ObservableObject {
  @Published var primary: UIView?
  @Published var secondary: UIView?
  @Published var arrangement = "split"
  @Published var axes = "both"
  @Published var primaryEdge = "auto"
  @Published var primaryVerticalEdge = "auto"
  var hingeChanged: ((Bool, Double, String) -> Void)?
  var paneLayout: ((UIView, CGRect) -> Void)?
  var panesChanged: ((CGRect, CGRect?) -> Void)?
  weak var host: UIView?
  private var reported: (primary: CGRect, secondary: CGRect?)?
  private var reportScheduled = false
  private var sentHinge: (Bool, Double, String)?

  /// SwiftUI repeats `onHingeChange` with equal contexts while a fold
  /// relayouts, so only a hinge that differs from the last one sent goes out.
  func sendHinge(_ available: Bool, _ angle: Double, _ status: String) {
    if let sentHinge, sentHinge == (available, angle, status) { return }
    sentHinge = (available, angle, status)
    hingeChanged?(available, angle, status)
  }

  /// Reports where the panes are once the current layout pass is over, and
  /// only if that changed. A hidden pane is not in the window.
  func schedulePanesReport() {
    guard !reportScheduled else { return }
    reportScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      reportScheduled = false
      guard let host, let primary = frame(of: primary, in: host) else { return }
      let secondary = frame(of: secondary, in: host)
      if let reported, reported.primary == primary, reported.secondary == secondary { return }
      reported = (primary, secondary)
      panesChanged?(primary, secondary)
    }
  }

  private func frame(of pane: UIView?, in host: UIView) -> CGRect? {
    guard let container = pane?.superview as? PaneContainer,
          container.window != nil, !container.isHidden,
          container.isDescendant(of: host) else { return nil }
    let frame = container.convert(container.bounds, to: host)
    return frame.isEmpty ? nil : frame
  }

  var supportedAxes: Axis.Set {
    switch axes {
    case "horizontal": return .horizontal
    case "vertical": return .vertical
    default: return [.horizontal, .vertical]
    }
  }
}

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
    model.schedulePanesReport()
  }
  override func didMoveToWindow() {
    super.didMoveToWindow()
    model?.schedulePanesReport()
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
    view.model?.schedulePanesReport()
  }
}

private struct ArrangementContent: View {
  @ObservedObject var model: ArrangementModel
  @Environment(\.layoutDirection) private var layoutDirection

  // The panes keep the inherited direction if the split overrides it.
  @ViewBuilder private var primary: some View {
    if let pane = model.primary {
      ReactPane(pane: pane, model: model).environment(\.layoutDirection, layoutDirection)
    }
  }
  @ViewBuilder private var secondary: some View {
    if let pane = model.secondary {
      ReactPane(pane: pane, model: model).environment(\.layoutDirection, layoutDirection)
    }
  }

  // SwiftUI puts a split's primary pane on the leading side and cannot choose
  // the side, so the split reverses the direction when `primaryEdge` is trailing.
  private var splitDirection: LayoutDirection {
    guard model.primaryEdge == "trailing" else { return layoutDirection }
    return layoutDirection == .rightToLeft ? .leftToRight : .rightToLeft
  }

  @ViewBuilder var body: some View {
// Inspired from Expo: https://github.com/expo/expo/blob/1ef42ab2fc01d6cc8bb7d94c1c3e60be42a3731d/packages/expo-ui/ios/ArrangementViewView.swift#L16-L18
// ArrangementView first ships in the iOS 27.1 SDK, whose SwiftUICore is 8.0.85.
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, *) {
      nativeArrangement
        .onHingeChange { _, context in
          guard let hinge = context.hinge else {
            model.sendHinge(false, 0, "unknown")
            return
          }
          let status: String
          switch hinge.status {
          case .closed: status = "closed"
          case .partiallyOpen: status = "partiallyOpen"
          case .fullyOpen: status = "fullyOpen"
          default: status = "unknown"
          }
          model.sendHinge(true, hinge.angle.radians, status)
        }
    } else {
      fallback
    }
#else
    fallback
#endif
  }

#if canImport(SwiftUICore, _version: 8.0.85)
  @available(iOS 27.1, *)
  @ViewBuilder private var nativeArrangement: some View {
    if model.arrangement == "overlay" {
      ArrangementView {
        primary.overlayArrangementEdge(horizontalEdge(primary: true)).overlayArrangementEdge(verticalEdge(primary: true))
      } secondary: {
        secondary.overlayArrangementEdge(horizontalEdge(primary: false)).overlayArrangementEdge(verticalEdge(primary: false))
      }
      .arrangementViewStyle(.overlay.axes(model.supportedAxes))
    } else {
      ArrangementView { primary } secondary: { secondary }
        .arrangementViewStyle(.split.axes(model.supportedAxes))
        .environment(\.layoutDirection, splitDirection)
    }
  }

  // An overlay puts its primary pane after the hinge: on the trailing side, or
  // below it. A pane given an edge takes it even when the other pane has it by
  // default, so the secondary pane is given the opposite edge.
  private func horizontalEdge(primary: Bool) -> HorizontalEdge? {
    switch model.primaryEdge {
    case "leading": primary ? .leading : .trailing
    case "trailing": primary ? .trailing : .leading
    default: nil
    }
  }
  private func verticalEdge(primary: Bool) -> VerticalEdge? {
    switch model.primaryVerticalEdge {
    case "top": primary ? .top : .bottom
    case "bottom": primary ? .bottom : .top
    default: nil
    }
  }
#endif

  @ViewBuilder private var fallback: some View {
    if model.arrangement == "overlay" {
      ZStack { secondary; primary }
    } else {
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
  /// The panes' frames in this view, and whether the secondary is shown.
  @objc public var onPanesChange: ((CGRect, CGRect, Bool) -> Void)? {
    didSet {
      model.panesChanged = onPanesChange.map { report in
        { primary, secondary in report(primary, secondary ?? .zero, secondary != nil) }
      }
    }
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
  @objc public func configure(_ arrangement: String, axes: String, primaryEdge: String, primaryVerticalEdge: String) {
    if model.arrangement != arrangement { model.arrangement = arrangement }
    if model.axes != axes { model.axes = axes }
    if model.primaryEdge != primaryEdge { model.primaryEdge = primaryEdge }
    if model.primaryVerticalEdge != primaryVerticalEdge { model.primaryVerticalEdge = primaryVerticalEdge }
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
