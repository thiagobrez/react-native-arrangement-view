import UIKit

/// The windows a `SystemLayoutObserver` has found a hinge in, for an app
/// delegate that lets only those windows rotate.
@objc(RNHingeWindows)
public final class HingeWindows: NSObject {
  /// Posted on the main thread the first time an observer finds a hinge in a
  /// window, before it reports to JavaScript. The object is the `UIWindow`.
  @objc public static let didFindHingeNotification = Notification.Name("RNHingeWindowsDidFindHinge")
  private static let windows = NSHashTable<UIWindow>.weakObjects()

  /// Whether an observer has found a hinge in `window`. Once true, it stays true.
  @objc public static func hasHinge(_ window: UIWindow) -> Bool {
    windows.contains(window)
  }

  static func register(_ window: UIWindow) {
    guard !windows.contains(window) else { return }
    windows.add(window)
    NotificationCenter.default.post(name: didFindHingeNotification, object: window)
  }
}
