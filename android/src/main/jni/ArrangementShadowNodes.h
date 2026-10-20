#pragma once

#include <arrange.h>

#include <folly/dynamic.h>
#include <react/renderer/components/RNArrangementViewSpec/EventEmitters.h>
#include <react/renderer/components/RNArrangementViewSpec/Props.h>
#include <react/renderer/components/RNArrangementViewSpec/ShadowNodes.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutContext.h>

#include <mutex>
#include <optional>

namespace facebook::react {

/** How a physical left reaches Yoga. It comes from I18nUtil, which changes only with a reload. */
enum class ArrangementDirection : uint8_t {
  LeftToRight,
  /** doLeftAndRightSwapInRTL is off, so Yoga's `left` stays physical. */
  RightToLeft,
  /** Fabric turns `left` into `start` and `right` into `end`, so a physical left goes on `end`. */
  RightToLeftSwapped,
};

struct ArrangementEnvironment {
  /** The content box, its window, and the fold relative to the content box, in dp. */
  arrangementview::Geometry geometry;
  ArrangementDirection direction{ArrangementDirection::LeftToRight};
  bool operator==(const ArrangementEnvironment &) const = default;
};

/** The ArrangementView's state. ArrangementStateBridge.cpp is its only writer. */
struct ArrangementViewState {
  /** Empty until the native view knows its window's layout, so no frames ever ignore the fold. */
  std::optional<ArrangementEnvironment> environment;

  ArrangementViewState() = default;
  explicit ArrangementViewState(ArrangementEnvironment environment) : environment(std::move(environment)) {}
  /** Required on Android. The environment arrives only through the bridge, so this keeps `previous`. */
  ArrangementViewState(const ArrangementViewState &previous, const folly::dynamic &data);
  folly::dynamic getDynamic() const;
};

/** Where the ArrangementView puts one pane in its content box. No frame hides it. */
struct PanePlacement {
  std::optional<arrangementview::Frame> frame;
  ArrangementDirection direction{ArrangementDirection::LeftToRight};
  bool operator==(const PanePlacement &) const = default;
};

inline constexpr char ArrangementPaneComponentName[] = "RNArrangementPane";

/**
 * A pane, positioned by the ArrangementView that holds it. The placement is a member, not state:
 * the ArrangementView derives it in every commit and is its only writer.
 */
class ArrangementPaneShadowNode final
    : public ConcreteViewShadowNode<ArrangementPaneComponentName, RNArrangementPaneProps, RNArrangementPaneEventEmitter> {
 public:
  ArrangementPaneShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits);
  ArrangementPaneShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

  const PanePlacement &placement() const {
    return placement_;
  }

  /** Moves a clone that is not sealed yet. */
  void place(const PanePlacement &placement);

 private:
  void applyPlacement();

  PanePlacement placement_;
};

/** Reports where the panes went, as iOS does. Every clone of an ArrangementView shares one emitter. */
class ArrangementViewEventEmitter final : public RNArrangementViewEventEmitter {
 public:
  using RNArrangementViewEventEmitter::RNArrangementViewEventEmitter;

  /** Sends onPanesChange once per distinct frames. */
  void reportPanes(const arrangementview::PaneFrames &frames) const;

 private:
  mutable std::mutex mutex_;
  mutable std::optional<arrangementview::PaneFrames> reported_;
};

/**
 * Places its panes with cpp/arrange.h, from its props and the environment in its state, whenever
 * it is built: in React's commits and in the ones the native view makes with a new environment.
 * ArrangementView.android.tsx renders one content View that fills the content box and holds the
 * secondary pane, then the primary pane.
 */
class ArrangementViewShadowNode final : public ConcreteViewShadowNode<
                                            RNArrangementViewComponentName,
                                            RNArrangementViewProps,
                                            ArrangementViewEventEmitter,
                                            ArrangementViewState> {
 public:
  ArrangementViewShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits);
  ArrangementViewShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

  void appendChild(const std::shared_ptr<const ShadowNode> &child) override;
  void layout(LayoutContext layoutContext) override;

 private:
  std::optional<arrangementview::PaneFrames> frames() const;
  void placePanes();
};

using ArrangementViewComponentDescriptor = ConcreteComponentDescriptor<ArrangementViewShadowNode>;
using ArrangementPaneComponentDescriptor = ConcreteComponentDescriptor<ArrangementPaneShadowNode>;

} // namespace facebook::react
