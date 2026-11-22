#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RNArrangementHosting <NSObject>
@property (nonatomic, copy, nullable) void (^onHingeChange)(BOOL available, double angle, NSString *status);
@property (nonatomic, copy, nullable) void (^onPaneLayout)(UIView *pane, CGRect frameInHost);
@property (nonatomic, copy, nullable) void (^onPanesChange)(CGRect primaryInHost, CGRect secondaryInHost, BOOL secondaryVisible);
- (void)setPanes:(nullable UIView *)primary secondary:(nullable UIView *)secondary;
- (void)configure:(NSString *)arrangement axes:(NSString *)axes primaryEdge:(NSString *)primaryEdge primaryVerticalEdge:(NSString *)primaryVerticalEdge;
@end

NS_ASSUME_NONNULL_END
