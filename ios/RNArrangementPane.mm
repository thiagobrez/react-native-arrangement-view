#import "RNArrangementPane.h"
#import "RNArrangementPaneShadowNode.h"
#import <optional>
using namespace facebook::react;

@implementation RNArrangementPane {
  ArrangementPaneShadowNode::ConcreteState::Shared _paneState;
  std::optional<CGRect> _swiftUIFrame;
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
- (void)applySwiftUIFrameOutsideMount:(CGRect)frame {
  _swiftUIFrame = frame;
  self.frame = (CGRect){CGPointZero, frame.size};
  // An asynchronous update would show the content laid out for the old size
  // until the next commit mounts, a visible reflow when the device unfolds.
  if (auto next = [self stateIfSwiftUIFrameChanged]) {
    _paneState->updateState(std::move(*next), EventQueue::UpdateMode::unstable_Immediate);
  }
}
- (void)applySwiftUIFrameDuringMount:(CGRect)frame {
  _swiftUIFrame = frame;
  self.frame = (CGRect){CGPointZero, frame.size};
  [self synchronizeStateDuringMount];
}
- (void)synchronizeStateDuringMount {
  if (auto next = [self stateIfSwiftUIFrameChanged]) {
    _paneState->updateState(std::move(*next), EventQueue::UpdateMode::Asynchronous);
  }
}
- (std::optional<ArrangementPaneState>)stateIfSwiftUIFrameChanged {
  if (!_paneState || !_swiftUIFrame) return std::nullopt;
  const auto &old = _paneState->getData();
  facebook::react::Size size{(Float)_swiftUIFrame->size.width, (Float)_swiftUIFrame->size.height};
  facebook::react::Point physicalOrigin{(Float)_swiftUIFrame->origin.x, (Float)_swiftUIFrame->origin.y};
  if (old.measured && old.size == size && old.physicalOrigin == physicalOrigin) return std::nullopt;
  return ArrangementPaneState{size, physicalOrigin, true};
}
- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState {
  [super updateState:state oldState:oldState];
  _paneState = std::static_pointer_cast<const ArrangementPaneShadowNode::ConcreteState>(state);
  [self synchronizeStateDuringMount];
}
- (void)updateLayoutMetrics:(LayoutMetrics const &)metrics oldLayoutMetrics:(LayoutMetrics const &)oldMetrics {
  [super updateLayoutMetrics:[self metricsPinnedToSwiftUIFrame:metrics] oldLayoutMetrics:oldMetrics];
}
- (LayoutMetrics)metricsPinnedToSwiftUIFrame:(LayoutMetrics)metrics {
  if (_swiftUIFrame) metrics.frame = {{0, 0}, {(Float)_swiftUIFrame->size.width, (Float)_swiftUIFrame->size.height}};
  return metrics;
}
@end
