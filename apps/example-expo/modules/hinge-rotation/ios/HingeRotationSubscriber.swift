import ArrangementView
import ExpoModulesCore
import UIKit

public final class HingeRotationSubscriber: ExpoAppDelegateSubscriber {
  public func subscriberDidRegister() {
    NotificationCenter.default.addObserver(
      forName: HingeWindows.didFindHingeNotification, object: nil, queue: nil
    ) { notification in
      (notification.object as? UIWindow)?.rootViewController?
        .setNeedsUpdateOfSupportedInterfaceOrientations()
    }
  }

  public func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    guard UIDevice.current.userInterfaceIdiom == .phone else { return .all }
    return window.map(HingeWindows.hasHinge) == true ? .allButUpsideDown : .portrait
  }
}
