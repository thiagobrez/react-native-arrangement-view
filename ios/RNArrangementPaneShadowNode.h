#pragma once
#include <react/renderer/components/RNArrangementViewSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {
struct ArrangementPaneState {
  Size size{};
  Point origin{};
  bool measured{false};
};
inline constexpr char ArrangementPaneName[] = "RNArrangementPane";
using ArrangementPaneShadowBase = ConcreteViewShadowNode<
    ArrangementPaneName, RNArrangementPaneProps, ViewEventEmitter, ArrangementPaneState>;
class ArrangementPaneShadowNode final : public ArrangementPaneShadowBase {
 public:
  using ArrangementPaneShadowBase::ArrangementPaneShadowBase;

  void layout(LayoutContext layoutContext) override {
    const auto &data = getStateData();
    if (data.measured) {
      // SwiftUI supplies a physical origin in the ArrangementView's coordinates.
      // Apply it after Yoga's directional layout: putting it in left/start would
      // mirror it in RTL. Descendants still inherit the normal layout direction.
      auto metrics = getLayoutMetrics();
      metrics.frame.origin = data.origin;
      setLayoutMetrics(metrics);
    }
    ArrangementPaneShadowBase::layout(layoutContext);
  }
};
class ArrangementPaneComponentDescriptor final
    : public ConcreteComponentDescriptor<ArrangementPaneShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode &node) const override {
    auto &pane = static_cast<ArrangementPaneShadowNode &>(node);
    const auto &data = pane.getStateData();
    if (data.measured) pane.setSize(data.size);
    ConcreteComponentDescriptor::adopt(node);
  }
};
}
