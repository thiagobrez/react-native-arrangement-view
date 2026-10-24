import UIKit

@objc(RNFold)
public final class RNFold: NSObject {
  @objc public static func division(in window: UIWindow) -> CGRect {
#if canImport(UIKit, _version: 9127.0.85)  // the iOS 27.1 SDK
    if #available(iOS 27.1, *) {
      for region in window.reservedRegions(kind: .division) {
        let visible = region.frame.intersection(window.bounds)
        if !visible.isNull { return visible }
      }
    }
#endif
    return .null
  }
}
