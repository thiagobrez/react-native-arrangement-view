import UIKit

/**
 * The one place the library reads the iOS fold.
 *
 * The name looks unusual. iOS 27.1 marks this API `NS_REFINED_FOR_SWIFT` and ships no
 * refinement for it, so Swift only sees the doubled form below.
 */
@objc(RNFold)
public final class RNFold: NSObject {
  /**
   * The first active division of `view`'s window, margins included, in window
   * points — the space React Native's `measureInWindow` uses. `.null` with no
   * window, below iOS 27.1, or when nothing divides the window.
   *
   * Asks `view.window`, never `view`: a reserved region belongs to the window, and
   * a view with no bounds — this library's observer is 0x0 — reports none at all.
   * A line is kept, so this doesn't filter with `isEmpty`.
   */
  @objc public static func division(in view: UIView) -> CGRect {
#if canImport(UIKit, _version: 9127.0.85)  // the iOS 27.1 SDK
    if #available(iOS 27.1, *), let window = view.window {
      // Asks for the inactive ones and filters on `isActive` here: the header
      // documents what the option adds but not what the query without it filters
      // on, and `isActive` is the documented property that tells a fold dividing
      // the window from one that merely exists.
      let regions = window.__reservedRegions(of: .division(), options: [.includeInactive])
      for region in regions where region.isActive {
        // `frame` is already in the window's own space, margins included, which is
        // React Native's window space: the surface host reports the surface's
        // origin in the window as the viewport offset.
        let visible = window.convert(region.frame, to: nil).intersection(window.bounds)
        // `intersection` is `.null` once the band leaves the window, meaning the
        // window isn't divided.
        if !visible.isNull { return visible }
      }
    }
#endif
    return .null
  }
}
