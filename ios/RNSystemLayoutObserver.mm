#import "RNSystemLayoutObserver.h"
#import "ArrangementView-Swift.h"
#import <react/renderer/components/RNArrangementViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#import <react/renderer/components/RNArrangementViewSpec/Props.h>
using namespace facebook::react;

using Emitter = RNSystemLayoutObserverEventEmitter;

template <typename Rect> static Rect RNRect(NSDictionary *rect) {
  return {[rect[@"x"] doubleValue], [rect[@"y"] doubleValue], [rect[@"width"] doubleValue],
          [rect[@"height"] doubleValue]};
}

static Emitter::OnSystemLayoutChange RNSystemLayoutEvent(NSDictionary *layout) {
  Emitter::OnSystemLayoutChange event{};
  event.width = [layout[@"width"] doubleValue];
  event.height = [layout[@"height"] doubleValue];
  event.hasHinge = [layout[@"hasHinge"] boolValue];
  event.keepsLines = [layout[@"keepsLines"] boolValue];
  NSDictionary *safeArea = layout[@"safeArea"];
  event.safeArea = {[safeArea[@"top"] doubleValue], [safeArea[@"right"] doubleValue],
                    [safeArea[@"bottom"] doubleValue], [safeArea[@"left"] doubleValue]};
  for (NSDictionary *fold in layout[@"folds"]) {
    event.folds.push_back({[fold[@"x"] doubleValue], [fold[@"y"] doubleValue], [fold[@"width"] doubleValue],
                           [fold[@"height"] doubleValue], RNRect<Emitter::OnSystemLayoutChangeFoldsWindow>(fold[@"window"]),
                           (bool)[fold[@"separating"] boolValue], std::string([fold[@"state"] UTF8String])});
  }
  for (NSDictionary *occlusion in layout[@"occlusions"]) {
    event.occlusions.push_back(RNRect<Emitter::OnSystemLayoutChangeOcclusions>(occlusion));
  }
  event.horizontalSizeClass = std::string([layout[@"horizontalSizeClass"] UTF8String]);
  event.verticalBarEdge = std::string([layout[@"verticalBarEdge"] UTF8String]);
  NSDictionary *barInsets = layout[@"barInsets"];
  event.barInsets = {[barInsets[@"top"] doubleValue], [barInsets[@"bottom"] doubleValue],
                     [barInsets[@"leading"] doubleValue], [barInsets[@"trailing"] doubleValue]};
  return event;
}

@implementation RNSystemLayoutObserver {
  RNSystemLayoutReader *_reader;
}
+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNSystemLayoutObserverComponentDescriptor>();
}
+ (BOOL)shouldBeRecycled { return NO; }
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNSystemLayoutObserverProps>();
    _reader = [[RNSystemLayoutReader alloc] initWithView:self];
    __weak RNSystemLayoutObserver *weakSelf = self;
    _reader.onLayoutChange = ^(NSDictionary *layout) {
      RNSystemLayoutObserver *strongSelf = weakSelf;
      if (!strongSelf || !strongSelf->_eventEmitter) return;
      std::static_pointer_cast<const Emitter>(strongSelf->_eventEmitter)->onSystemLayoutChange(RNSystemLayoutEvent(layout));
    };
  }
  return self;
}
- (void)didMoveToWindow {
  [super didMoveToWindow];
  [_reader viewDidMoveToWindow];
}
- (void)layoutSubviews {
  [super layoutSubviews];
  [_reader publish];
}
- (void)safeAreaInsetsDidChange {
  [super safeAreaInsetsDidChange];
  [_reader publish];
}
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  const auto &next = *std::static_pointer_cast<const RNSystemLayoutObserverProps>(props);
  [_reader setBarExtentsWithTop:next.barExtentTop
                         bottom:next.barExtentBottom
                        leading:next.barExtentLeading
                       trailing:next.barExtentTrailing];
  [super updateProps:props oldProps:oldProps];
}
@end
