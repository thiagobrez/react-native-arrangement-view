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
      RNArrangementView *strongSelf = weakSelf;
      if (strongSelf && [pane isKindOfClass:RNArrangementPane.class]) {
        // The host occupies our content frame, inset by padding and borders.
        CGRect frame = [strongSelf->_host convertRect:nativeFrame toView:strongSelf];
        [(RNArrangementPane *)pane updateNativeFrame:frame];
      }
    };
  }
  return self;
}
- (void)updateLayoutMetrics:(LayoutMetrics const &)metrics oldLayoutMetrics:(LayoutMetrics const &)oldMetrics {
  [super updateLayoutMetrics:metrics oldLayoutMetrics:oldMetrics];
  if (metrics.contentInsets == oldMetrics.contentInsets) return;
  // Moving padding from one edge to another can move the host without resizing
  // its panes. Refresh their origins even if SwiftUI has no new layout to report.
  for (UIView *pane in _panes) {
    if ([pane isKindOfClass:RNArrangementPane.class] && [pane isDescendantOfView:_host]) {
      [(RNArrangementPane *)pane updateNativeFrame:[pane convertRect:pane.bounds toView:self]];
    }
  }
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
