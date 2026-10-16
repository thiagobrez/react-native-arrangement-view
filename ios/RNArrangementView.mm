#import "RNArrangementView.h"
#import "RNArrangementPane.h"
#import "ArrangementView-Swift.h"
#import <optional>
#import <react/renderer/components/RNArrangementViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#import <react/renderer/components/RNArrangementViewSpec/Props.h>
using namespace facebook::react;

@implementation RNArrangementView {
  RNArrangementHost *_host;
  NSMutableArray<UIView *> *_panes;
  std::optional<RNArrangementViewEventEmitter::OnHingeChange> _hinge;
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
      if (!strongSelf) return;
      strongSelf->_hinge = RNArrangementViewEventEmitter::OnHingeChange{
          (bool)available, angle, std::string(status.UTF8String)};
      [strongSelf emitHinge];
    };
    _host.onPanesChange = ^(CGRect primary, CGRect secondary, BOOL secondaryVisible) {
      RNArrangementView *strongSelf = weakSelf;
      if (!strongSelf || !strongSelf->_eventEmitter) return;
      auto emitter = std::static_pointer_cast<const RNArrangementViewEventEmitter>(strongSelf->_eventEmitter);
      RNArrangementViewEventEmitter::OnPanesChange event;
      event.primary = {primary.origin.x, primary.origin.y, primary.size.width, primary.size.height};
      event.secondary = {secondary.origin.x, secondary.origin.y, secondary.size.width, secondary.size.height};
      event.secondaryVisible = secondaryVisible;
      emitter->onPanesChange(event);
    };
    _host.onPaneLayout = ^(UIView *pane, CGRect nativeFrame) {
      RNArrangementView *strongSelf = weakSelf;
      if (strongSelf && [pane isKindOfClass:RNArrangementPane.class]) {
        // The host occupies our content frame, inset by padding and borders.
        CGRect frame = [strongSelf->_host convertRect:nativeFrame toView:strongSelf];
        // SwiftUI's layout pass, outside any mount: lay the content out now.
        [(RNArrangementPane *)pane updateNativeFrame:frame immediate:YES];
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
      [(RNArrangementPane *)pane updateNativeFrame:[pane convertRect:pane.bounds toView:self] immediate:NO];
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
- (void)emitHinge {
  if (!_eventEmitter || !_hinge) return;
  std::static_pointer_cast<const RNArrangementViewEventEmitter>(_eventEmitter)->onHingeChange(*_hinge);
}
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  const auto &next = *std::static_pointer_cast<const RNArrangementViewProps>(props);
  const auto &previous = *std::static_pointer_cast<const RNArrangementViewProps>(_props);
  // A worklet is counted after it registers, and starts from the current state.
  if (next.hingeWorklets > previous.hingeWorklets) [self emitHinge];
  NSString *arrangement = next.arrangement == RNArrangementViewArrangement::Overlay ? @"overlay" : @"split";
  NSString *axes = @"both";
  if (next.axes == RNArrangementViewAxes::Horizontal) axes = @"horizontal";
  if (next.axes == RNArrangementViewAxes::Vertical) axes = @"vertical";
  NSString *primaryEdge = @"auto";
  if (next.primaryEdge == RNArrangementViewPrimaryEdge::Leading) primaryEdge = @"leading";
  if (next.primaryEdge == RNArrangementViewPrimaryEdge::Trailing) primaryEdge = @"trailing";
  [_host configure:arrangement axes:axes primaryEdge:primaryEdge observeHinge:next.observeHinge];
  [super updateProps:props oldProps:oldProps];
}
@end
