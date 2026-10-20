#import <React/RCTViewComponentView.h>

@interface RNArrangementPane : RCTViewComponentView
- (void)applySwiftUIFrameOutsideMount:(CGRect)frame;
- (void)applySwiftUIFrameDuringMount:(CGRect)frame;
@end
