#import "RNArrangementPane.h"
#import "RNArrangementPaneShadowNode.h"
using namespace facebook::react;

@implementation RNArrangementPane {
  ArrangementPaneShadowNode::ConcreteState::Shared _paneState;
  CGRect _nativeFrame;
  BOOL _hasNativeFrame;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<ArrangementPaneComponentDescriptor>();
}
+ (BOOL)shouldBeRecycled { return NO; }
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNArrangementPaneProps>();
    self.clipsToBounds = YES;
  }
  return self;
}
- (void)updateNativeFrame:(CGRect)frame {
  _nativeFrame = frame;
  _hasNativeFrame = YES;
  self.frame = (CGRect){CGPointZero, frame.size};
  [self synchronizeState];
}
- (void)synchronizeState {
  if (!_paneState || !_hasNativeFrame) return;
  const auto &old = _paneState->getData();
  facebook::react::Size size{(Float)_nativeFrame.size.width, (Float)_nativeFrame.size.height};
  facebook::react::Point origin{(Float)_nativeFrame.origin.x, (Float)_nativeFrame.origin.y};
  if (old.measured && old.size == size && old.origin == origin) return;
  _paneState->updateState(ArrangementPaneState{size, origin, true});
}
- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState {
  [super updateState:state oldState:oldState];
  _paneState = std::static_pointer_cast<const ArrangementPaneShadowNode::ConcreteState>(state);
  [self synchronizeState];
}
- (void)updateLayoutMetrics:(LayoutMetrics const &)metrics oldLayoutMetrics:(LayoutMetrics const &)oldMetrics {
  // SwiftUI owns this view's frame. Fabric still receives metrics for descendants,
  // onLayout and measurement; stale commits must not resize the native pane.
  auto nativeMetrics = metrics;
  if (_hasNativeFrame) nativeMetrics.frame = {{0, 0}, {(Float)_nativeFrame.size.width, (Float)_nativeFrame.size.height}};
  [super updateLayoutMetrics:nativeMetrics oldLayoutMetrics:oldMetrics];
}
@end
