#import "RNHingeObserver.h"
#import <optional>
#import <react/renderer/components/RNArrangementViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#import <react/renderer/components/RNArrangementViewSpec/Props.h>
using namespace facebook::react;

#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
#define RAV_SDK_HAS_HINGE_INTERACTION 1
#endif

@implementation RNHingeObserver {
  std::optional<RNHingeObserverEventEmitter::OnHingeChange> _sentHinge;
  NSUInteger _updates;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNHingeObserverComponentDescriptor>();
}
+ (BOOL)shouldBeRecycled { return NO; }
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNHingeObserverProps>();
#ifdef RAV_SDK_HAS_HINGE_INTERACTION
    if (@available(iOS 27.1, *)) {
      __weak RNHingeObserver *weakSelf = self;
      [self addInteraction:[[UIHingeInteraction alloc] initWithUpdateHandler:^(
                                UIHingeInteraction *interaction, UIHingeInteractionUpdate *update) {
        RNHingeObserver *strongSelf = weakSelf;
        if (!strongSelf) return;
        UIHinge *hinge = update.hinge;
        NSUInteger current = ++strongSelf->_updates;
        if (!hinge) {
          [strongSelf reportNoHingeUnlessLeavingWindow:current];
          return;
        }
        std::string status = "unknown";
        switch (hinge.status) {
          case UIHingeStatusClosed: status = "closed"; break;
          case UIHingeStatusPartiallyOpen: status = "partiallyOpen"; break;
          case UIHingeStatusFullyOpen: status = "fullyOpen"; break;
          default: break;
        }
        [strongSelf emitIfChanged:{true, hinge.angle, status}];
      }]];
    }
#endif
  }
  return self;
}
- (void)reportNoHingeUnlessLeavingWindow:(NSUInteger)update {
  // The interaction reports no hinge before the view leaves its window, so decide after the move.
  __weak RNHingeObserver *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    RNHingeObserver *view = weakSelf;
    if (view.window && view->_updates == update) [view emitIfChanged:{false, 0, "unknown"}];
  });
}
- (void)emitIfChanged:(RNHingeObserverEventEmitter::OnHingeChange)hinge {
  if (_sentHinge && _sentHinge->available == hinge.available && _sentHinge->angle == hinge.angle &&
      _sentHinge->status == hinge.status)
    return;
  if (!_eventEmitter) return;
  _sentHinge = hinge;
  std::static_pointer_cast<const RNHingeObserverEventEmitter>(_eventEmitter)->onHingeChange(hinge);
}
@end
