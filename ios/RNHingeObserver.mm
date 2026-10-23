#import "RNHingeObserver.h"
#import "ArrangementView-Swift.h"
#import <optional>
#import <react/renderer/components/RNArrangementViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#import <react/renderer/components/RNArrangementViewSpec/Props.h>
using namespace facebook::react;

// An older SDK has no UIHingeInteraction to compile, so the hinge stays unavailable.
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
#define RAV_HAS_HINGE 1
#endif

static RNHingeObserverEventEmitter::OnHingeChange RNHingeEvent(BOOL available, CGFloat angle, std::string status,
                                                              CGRect fold) {
  if (CGRectIsNull(fold)) return {available, angle, status, false, {0, 0, 0, 0}};
  return {available, angle, status, true,
          {CGRectGetMinX(fold), CGRectGetMinY(fold), CGRectGetWidth(fold), CGRectGetHeight(fold)}};
}

static char RAVSceneGeometryContext;

static BOOL RNHingesEqual(const RNHingeObserverEventEmitter::OnHingeChange &one,
                          const RNHingeObserverEventEmitter::OnHingeChange &other) {
  return one.available == other.available && one.angle == other.angle && one.status == other.status &&
         one.hasFold == other.hasFold && one.fold.x == other.fold.x && one.fold.y == other.fold.y &&
         one.fold.width == other.fold.width && one.fold.height == other.fold.height;
}

@implementation RNHingeObserver {
  std::optional<RNHingeObserverEventEmitter::OnHingeChange> _hinge;
  NSUInteger _updates;
#ifdef RAV_HAS_HINGE
  __weak UIWindowScene *_observedScene;
#endif
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNHingeObserverComponentDescriptor>();
}
+ (BOOL)shouldBeRecycled { return NO; }
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNHingeObserverProps>();
#ifdef RAV_HAS_HINGE
    __weak RNHingeObserver *weakSelf = self;
    if (@available(iOS 27.1, *)) {
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
            if (view.window && view->_updates == current) [view emit:RNHingeEvent(false, 0, "unknown", CGRectNull)];
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
        BOOL crossed = !strongSelf->_hinge || !strongSelf->_hinge->available ||
                       strongSelf->_hinge->status != status;
        [strongSelf emit:RNHingeEvent(true, hinge.angle, status, [RNFold divisionIn:strongSelf])];
        if (crossed) [strongSelf setNeedsLayout];
      }]];
    }
#endif
  }
  return self;
}
- (void)emit:(RNHingeObserverEventEmitter::OnHingeChange)hinge {
  // The interaction repeats equal updates as a fold settles. One held for the emitter isn't sent yet.
  if (_eventEmitter && _hinge && RNHingesEqual(*_hinge, hinge))
    return;
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
- (void)didMoveToWindow {
  [super didMoveToWindow];
#ifdef RAV_HAS_HINGE
  if (@available(iOS 27.1, *)) {
    [self observeScene:nil];
    [self observeScene:self.window.windowScene];
    [self refreshFold];
  }
#endif
}
- (void)layoutSubviews {
  [super layoutSubviews];
  [self refreshFold];
}
#ifdef RAV_HAS_HINGE
- (void)observeScene:(UIWindowScene *)scene {
  if (_observedScene == scene) return;
  if (_observedScene) [_observedScene removeObserver:self forKeyPath:@"effectiveGeometry"];
  _observedScene = scene;
  if (scene)
    [scene addObserver:self forKeyPath:@"effectiveGeometry" options:0 context:&RAVSceneGeometryContext];
}
- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey, id> *)change
                       context:(void *)context {
  if (context == &RAVSceneGeometryContext) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self refreshFold];
    });
    return;
  }
  [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
}
- (void)dealloc {
  if (_observedScene) [_observedScene removeObserver:self forKeyPath:@"effectiveGeometry"];
}
#endif
- (void)refreshFold {
#ifdef RAV_HAS_HINGE
  if (!_hinge || !_hinge->available) return;
  [self emit:RNHingeEvent(_hinge->available, _hinge->angle, _hinge->status, [RNFold divisionIn:self])];
#endif
}
@end
