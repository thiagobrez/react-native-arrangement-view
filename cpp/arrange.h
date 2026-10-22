#pragma once

#include <cmath>
#include <cstdint>
#include <optional>

namespace arrangementview {

enum class Arrangement : uint8_t { Split, Overlay };
enum class Axes : uint8_t { Both, Horizontal, Vertical };
using Axis = Axes;
/** Which hinges the panes keep clear of, after Material's `HingePolicy`. */
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

/**
 * The arrangement's size, the size of the window it is in, and the fold, if
 * any. All in dp; the fold is relative to the arrangement.
 */
struct Geometry {
  double width{};
  double height{};
  Size window;
  std::optional<Fold> fold;
  bool operator==(const Geometry &) const = default;
};

/** The props, with `primaryEdge` already split into a side per axis. */
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

// Material's window size class breakpoints.
inline constexpr double COMPACT_HEIGHT = 480;
inline constexpr double EXPANDED_WIDTH = 840;
inline constexpr double EXPANDED_HEIGHT = 900;
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
 * iOS. A split that doesn't fit, or that `axes` excludes, shows only the
 * primary pane. `primaryEdge` puts the primary pane on the leading or
 * trailing side of panes placed side by side, and an overlay's above or below
 * panes that are stacked.
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
  const bool twoColumns = window.height >= detail::COMPACT_HEIGHT && window.width >= detail::EXPANDED_WIDTH;
  const bool twoRows = tabletop || (!twoColumns && window.height >= detail::EXPANDED_HEIGHT);
  const auto allows = [&](Axis axis) { return axes == Axes::Both || axes == axis; };
  const auto fits = [&](Axis axis) {
    return allows(axis) && (axis == Axis::Horizontal ? twoColumns : twoRows);
  };

  // Stacked, a split's primary pane goes first whatever primaryVerticalEdge says, as on iOS.
  const auto split = [&](Axis axis, double start, double end, bool primaryAfter = false) -> PaneFrames {
    const Frame before = axis == Axis::Horizontal ? Frame{0, 0, start, height} : Frame{0, 0, width, start};
    const Frame after = axis == Axis::Horizontal ? Frame{end, 0, width - end, height}
                                                 : Frame{0, end, width, height - end};
    const bool primaryIsAfter = axis == Axis::Horizontal
        ? (primaryEdge != HorizontalEdge::Auto ? (primaryEdge == HorizontalEdge::Trailing) != rtl
                                               : rtl != primaryAfter)
        : (arrangement == Arrangement::Overlay && primaryVerticalEdge != VerticalEdge::Auto
               ? primaryVerticalEdge == VerticalEdge::Bottom
               : primaryAfter);
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
      // Overlay's primary pane goes after the hinge, as SwiftUI puts it.
      if (fold->separating ? allows(axis) : fits(axis))
        return split(axis, before, after, arrangement == Arrangement::Overlay);
      if (arrangement == Arrangement::Overlay) return {full, full};
      return {split(axis, before, after).primary, std::nullopt};
    }
  }

  if (arrangement == Arrangement::Overlay) return {full, full};
  if (!fits(Axis::Horizontal) && !fits(Axis::Vertical)) return {full, std::nullopt};
  const Axis axis = fits(Axis::Horizontal) ? Axis::Horizontal : Axis::Vertical;
  const double middle = (axis == Axis::Horizontal ? width : height) / 2;
  return split(axis, middle, middle);
}

} // namespace arrangementview
