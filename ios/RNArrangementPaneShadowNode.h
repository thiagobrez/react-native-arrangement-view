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

  // Lays the pane out at the frame SwiftUI assigned it within the arrangement,
  // so measure(), hit testing, clipping and culling see the real geometry and
  // keep walking up through the ArrangementView to the surface root.
  void applyNativeFrame() const {
    const auto &data = getStateData();
    if (!data.measured) return;
    setSize(data.size);
    auto style = yogaNode_.style();
    style.setPosition(yoga::Edge::Left, yoga::StyleLength::points(data.origin.x));
    style.setPosition(yoga::Edge::Top, yoga::StyleLength::points(data.origin.y));
    yogaNode_.setStyle(style);
    yogaNode_.setDirty(true);
  }
};
class ArrangementPaneComponentDescriptor final
    : public ConcreteComponentDescriptor<ArrangementPaneShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode &node) const override {
    static_cast<ArrangementPaneShadowNode &>(node).applyNativeFrame();
    ConcreteComponentDescriptor::adopt(node);
  }
};
}
