import UIKit

@objc(RNFold)
public final class RNFold: NSObject {
  @objc public static func division(in view: UIView) -> CGRect {
#if canImport(UIKit, _version: 9127.0.85)  // the iOS 27.1 SDK
    if #available(iOS 27.1, *), let window = view.window {
      let regions = window.__reservedRegions(of: .division(), options: [.includeInactive])
      for region in regions where region.isActive {
        let visible = window.convert(region.frame, to: nil).intersection(window.bounds)
        if !visible.isNull { return visible }
      }
    }
#endif
    return .null
  }
}
