#pragma once

#include <cmath>
#include <cstdint>
#include <optional>

namespace arrangementview {

enum class Arrangement : uint8_t { Split, Overlay };
enum class Axes : uint8_t { Both, Horizontal, Vertical };
using Axis = Axes;
enum class HingePolicy : uint8_t { AvoidSeparating, AlwaysAvoid, NeverAvoid };
enum class HorizontalEdge : uint8_t { Auto, Leading, Trailing };
enum class VerticalEdge : uint8_t { Auto, Top, Bottom };
enum class FoldOrientation : uint8_t { Vertical, Horizontal };

struct Size {
  double width{};
  double height{};
  bool operator==(const Size &) const = default;
};

struct Frame {
  double left{};
  double top{};
  double width{};
  double height{};
  bool operator==(const Frame &) const = default;
};

struct Fold {
  double x{};
  double y{};
  double width{};
  double height{};
  FoldOrientation orientation{};
  /** Half-open, or a hinge that hides content. */
  bool separating{};
  bool halfOpened{};
  bool operator==(const Fold &) const = default;
};

/** All in dp; the fold is relative to the arrangement. */
struct Geometry {
  double width{};
  double height{};
  Size window;
  std::optional<Fold> fold;
  bool operator==(const Geometry &) const = default;
};

struct ArrangeOptions {
  Arrangement arrangement{Arrangement::Split};
  Axes axes{Axes::Both};
  HingePolicy hingePolicy{HingePolicy::AvoidSeparating};
  double hingeGap{24};
  HorizontalEdge primaryEdge{HorizontalEdge::Auto};
  VerticalEdge primaryVerticalEdge{VerticalEdge::Auto};
  bool rtl{false};
};

struct PaneFrames {
  Frame primary;
  std::optional<Frame> secondary;
  bool operator==(const PaneFrames &) const = default;
};

namespace detail {
inline double jsMax(double a, double b) noexcept {
  if (std::isnan(a) || std::isnan(b)) return NAN;
  if (a == b) return std::signbit(a) ? b : a;
  return a > b ? a : b;
}

inline constexpr double HEIGHT_DP_MEDIUM_LOWER_BOUND = 480;
inline constexpr double WIDTH_DP_EXPANDED_LOWER_BOUND = 840;
inline constexpr double HEIGHT_DP_EXPANDED_LOWER_BOUND = 900;
} // namespace detail

/**
 * Android's layout policy; iOS delegates the same decisions to SwiftUI.
 *
 * It follows Material's pane scaffold (calculatePaneScaffoldDirective). The
 * window, not the arrangement, decides how many panes fit: two side by side
 * from an expanded width, and two stacked in tabletop or in a single-column
 * window with expanded height. A compact-height window, such as a phone in
 * landscape, gets no columns: Android's window size class guidance calls two
 * panes impractical there, though Material's scaffold checks only the width.
 *
 * A hinge the policy avoids decides the axis and separates the panes by
 * `hingeGap` around it, if that gap fits inside the arrangement, as on iOS.
 * A separating hinge always splits, whatever the window size, as it does on
 * iOS.
 *
 * Compile with -ffp-contract=off, so the frames are the same bits on every
 * compiler and device.
 */
inline PaneFrames arrange(const Geometry &geometry, const ArrangeOptions &options) noexcept {
  using detail::jsMax;
  const double width = geometry.width;
  const double height = geometry.height;
  const Size &window = geometry.window;
  const std::optional<Fold> &fold = geometry.fold;
  const Arrangement arrangement = options.arrangement;
  const Axes axes = options.axes;
  const HingePolicy hingePolicy = options.hingePolicy;
  const double hingeGap = options.hingeGap;
  const HorizontalEdge primaryEdge = options.primaryEdge;
  const VerticalEdge primaryVerticalEdge = options.primaryVerticalEdge;
  const bool rtl = options.rtl;

  const Frame full{0, 0, width, height};
  const bool tabletop = fold && fold->halfOpened && fold->orientation == FoldOrientation::Horizontal;
  const bool twoColumns = window.height >= detail::HEIGHT_DP_MEDIUM_LOWER_BOUND &&
      window.width >= detail::WIDTH_DP_EXPANDED_LOWER_BOUND;
  const bool twoRows = tabletop || (!twoColumns && window.height >= detail::HEIGHT_DP_EXPANDED_LOWER_BOUND);
  const auto allows = [&](Axis axis) { return axes == Axes::Both || axes == axis; };
  const auto fits = [&](Axis axis) {
    return allows(axis) && (axis == Axis::Horizontal ? twoColumns : twoRows);
  };

  const bool overlay = arrangement == Arrangement::Overlay;
  // An overlay's primary pane defaults to after the hinge, as in SwiftUI.
  const HorizontalEdge horizontalEdge = primaryEdge != HorizontalEdge::Auto ? primaryEdge
      : overlay ? HorizontalEdge::Trailing : HorizontalEdge::Leading;
  const bool primaryAfterSideBySide = (horizontalEdge == HorizontalEdge::Trailing) != rtl;
  const bool primaryAfterStacked = overlay && primaryVerticalEdge != VerticalEdge::Top;
  const auto split = [&](Axis axis, double start, double end) -> PaneFrames {
    const Frame before = axis == Axis::Horizontal ? Frame{0, 0, start, height} : Frame{0, 0, width, start};
    const Frame after = axis == Axis::Horizontal ? Frame{end, 0, width - end, height}
                                                 : Frame{0, end, width, height - end};
    const bool primaryIsAfter = axis == Axis::Horizontal ? primaryAfterSideBySide : primaryAfterStacked;
    return primaryIsAfter ? PaneFrames{after, before} : PaneFrames{before, after};
  };

  const bool avoided = hingePolicy == HingePolicy::AlwaysAvoid ||
      (hingePolicy == HingePolicy::AvoidSeparating && fold && fold->separating);
  if (fold && avoided) {
    // A vertical fold, running top to bottom, puts the panes side by side.
    const Axis axis = fold->orientation == FoldOrientation::Vertical ? Axis::Horizontal : Axis::Vertical;
    const double start = axis == Axis::Horizontal ? fold->x : fold->y;
    const double end = axis == Axis::Horizontal ? fold->x + fold->width : fold->y + fold->height;
    const double extent = axis == Axis::Horizontal ? width : height;
    const double middle = (start + end) / 2;
    const double half = jsMax(end - start, hingeGap) / 2;
    const double before = middle - half;
    const double after = middle + half;
    if (before > 0 && after < extent) {
      if (fold->separating ? allows(axis) : fits(axis)) return split(axis, before, after);
      if (!overlay) return {split(axis, before, after).primary, std::nullopt};
    }
  }

  if (overlay) return {full, full};
  if (!fits(Axis::Horizontal) && !fits(Axis::Vertical)) return {full, std::nullopt};
  const Axis axis = fits(Axis::Horizontal) ? Axis::Horizontal : Axis::Vertical;
  const double middle = (axis == Axis::Horizontal ? width : height) / 2;
  return split(axis, middle, middle);
}

} // namespace arrangementview
