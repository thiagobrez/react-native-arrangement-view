#import <React/RCTViewComponentView.h>

@interface RNArrangementPane : RCTViewComponentView
/// Sizes the pane to the frame SwiftUI gave it. `immediate` lays its React
/// content out for that size before returning, in the same layout pass; use it
/// only outside a mounting transaction.
- (void)updateNativeFrame:(CGRect)frame immediate:(BOOL)immediate;
@end
