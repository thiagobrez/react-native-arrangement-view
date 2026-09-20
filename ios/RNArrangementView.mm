#import "RNArrangementView.h"
#import "RNArrangementPane.h"
#import "ArrangementView-Swift.h"
#import <react/renderer/components/RNArrangementViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#import <react/renderer/components/RNArrangementViewSpec/Props.h>
using namespace facebook::react;

@implementation RNArrangementView {
  RNArrangementHost *_host;
  NSMutableArray<UIView *> *_panes;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNArrangementViewComponentDescriptor>();
}
+ (BOOL)shouldBeRecycled { return NO; }
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNArrangementViewProps>();
    _panes = [NSMutableArray new];
    _host = [[RNArrangementHost alloc] initWithFrame:self.bounds];
    self.contentView = _host;
    __weak RNArrangementView *weakSelf = self;
    _host.onHingeChange = ^(BOOL available, double angle, NSString *status) {
      RNArrangementView *strongSelf = weakSelf;
      if (!strongSelf || !strongSelf->_eventEmitter) return;
      auto emitter = std::static_pointer_cast<const RNArrangementViewEventEmitter>(strongSelf->_eventEmitter);
      emitter->onHingeChange({(bool)available, angle, std::string(status.UTF8String)});
    };
    _host.onPaneLayout = ^(UIView *pane, CGRect nativeFrame) {
      if ([pane isKindOfClass:RNArrangementPane.class]) {
        [(RNArrangementPane *)pane updateNativeFrame:nativeFrame];
      }
    };
  }
  return self;
}
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)child index:(NSInteger)index {
  [_panes insertObject:child atIndex:index];
  [self updatePanes];
}
- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)child index:(NSInteger)index {
  [child removeFromSuperview];
  [_panes removeObjectIdenticalTo:child];
  [self updatePanes];
}
- (void)updatePanes {
  [_host setPanes:_panes.count > 0 ? _panes[0] : nil secondary:_panes.count > 1 ? _panes[1] : nil];
}
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  const auto &next = *std::static_pointer_cast<const RNArrangementViewProps>(props);
  NSString *arrangement = next.arrangement == RNArrangementViewArrangement::Overlay ? @"overlay" : @"split";
  NSString *axes = @"both";
  if (next.axes == RNArrangementViewAxes::Horizontal) axes = @"horizontal";
  if (next.axes == RNArrangementViewAxes::Vertical) axes = @"vertical";
  [_host configure:arrangement axes:axes observeHinge:next.observeHinge];
  [super updateProps:props oldProps:oldProps];
}
@end
