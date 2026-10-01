#import "RNHingeObserver.h"
#import <optional>
#import <react/renderer/components/RNArrangementViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#import <react/renderer/components/RNArrangementViewSpec/Props.h>
using namespace facebook::react;

// An older SDK has no UIHingeInteraction to compile, so the hinge stays unavailable.
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
#define RAV_HAS_HINGE 1
#endif

@implementation RNHingeObserver {
  std::optional<RNHingeObserverEventEmitter::OnHingeChange> _hinge;
  NSUInteger _updates;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNHingeObserverComponentDescriptor>();
}
+ (BOOL)shouldBeRecycled { return NO; }
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNHingeObserverProps>();
#ifdef RAV_HAS_HINGE
    if (@available(iOS 27.1, *)) {
      __weak RNHingeObserver *weakSelf = self;
      [self addInteraction:[[UIHingeInteraction alloc] initWithUpdateHandler:^(
                                UIHingeInteraction *interaction, UIHingeInteractionUpdate *update) {
        RNHingeObserver *strongSelf = weakSelf;
        if (!strongSelf) return;
        UIHinge *hinge = update.hinge;
        NSUInteger current = ++strongSelf->_updates;
        if (!hinge) {
          // The interaction also reports no hinge just before the view leaves its window, as
          // under a pushed screen, which keeps the last state: it reports the current one when
          // the view returns. Decide once the move is over. A view still in a window, with no
          // newer update, has no hinge.
          dispatch_async(dispatch_get_main_queue(), ^{
            RNHingeObserver *view = weakSelf;
            if (view.window && view->_updates == current) [view emit:{false, 0, "unknown"}];
          });
          return;
        }
        std::string status = "unknown";
        switch (hinge.status) {
          case UIHingeStatusClosed: status = "closed"; break;
          case UIHingeStatusPartiallyOpen: status = "partiallyOpen"; break;
          case UIHingeStatusFullyOpen: status = "fullyOpen"; break;
          default: break;
        }
        [strongSelf emit:{true, hinge.angle, status}];
      }]];
    }
#endif
  }
  return self;
}
- (void)emit:(RNHingeObserverEventEmitter::OnHingeChange)hinge {
  _hinge = hinge;
  if (!_eventEmitter) return;
  std::static_pointer_cast<const RNHingeObserverEventEmitter>(_eventEmitter)->onHingeChange(hinge);
}
- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter {
  BOOL first = !_eventEmitter;
  [super updateEventEmitter:eventEmitter];
  // The interaction can report before Fabric has given this view its emitter.
  if (first && _hinge) [self emit:*_hinge];
}
@end
