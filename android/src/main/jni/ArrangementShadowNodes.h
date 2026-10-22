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

enum class ArrangementDirection : uint8_t {
  LeftToRight,
  RightToLeft,
  /** Fabric turns `left` into `start` and `right` into `end`, so a physical left goes on `end`. */
  RightToLeftSwapped,
};

struct ArrangementEnvironment {
  arrangementview::Geometry geometry;
  ArrangementDirection direction{ArrangementDirection::LeftToRight};
  bool operator==(const ArrangementEnvironment &) const = default;
};

struct ArrangementViewState {
  std::optional<ArrangementEnvironment> environment;

  ArrangementViewState() = default;
  explicit ArrangementViewState(ArrangementEnvironment environment) : environment(std::move(environment)) {}
  /** Required on Android. */
  ArrangementViewState(const ArrangementViewState &previous, const folly::dynamic &data);
  folly::dynamic getDynamic() const;
};

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

  void place(const PanePlacement &placement);

 private:
  void applyPlacement();

  PanePlacement placement_;
};

/** Every clone of an ArrangementView shares one emitter. */
class ArrangementViewEventEmitter final : public RNArrangementViewEventEmitter {
 public:
  using RNArrangementViewEventEmitter::RNArrangementViewEventEmitter;

  void reportPanes(const arrangementview::PaneFrames &frames) const;

 private:
  mutable std::mutex mutex_;
  mutable std::optional<arrangementview::PaneFrames> reported_;
};

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
