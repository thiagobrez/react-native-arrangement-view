#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_UI_ACTOR
@protocol RNSystemLayoutReading <NSObject>
@property (nonatomic, copy, nullable) void (^onLayoutChange)(NSDictionary *layout);
- (instancetype)initWithView:(UIView *)view;
- (void)setBarExtentBottom:(CGFloat)extent;
- (void)viewDidMoveToWindow;
- (void)publish;
@end

NS_ASSUME_NONNULL_END
