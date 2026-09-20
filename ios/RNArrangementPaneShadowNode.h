#pragma once
#include <react/renderer/components/RNArrangementViewSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

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
  static ShadowNodeTraits BaseTraits() {
    auto traits = ArrangementPaneShadowBase::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }
  Point getContentOriginOffset(bool) const override { return getStateData().origin; }
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
