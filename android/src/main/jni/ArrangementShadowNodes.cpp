#include "ArrangementShadowNodes.h"

#include <react/debug/react_native_assert.h>

namespace facebook::react {

using arrangementview::PaneFrames;

#pragma mark - ArrangementViewState

ArrangementViewState::ArrangementViewState(const ArrangementViewState &previous, const folly::dynamic &)
    : ArrangementViewState(previous) {}

folly::dynamic ArrangementViewState::getDynamic() const {
  return folly::dynamic::object("measured", environment.has_value());
}

#pragma mark - ArrangementPaneShadowNode

ArrangementPaneShadowNode::ArrangementPaneShadowNode(
    const ShadowNodeFragment &fragment,
    const ShadowNodeFamily::Shared &family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  applyPlacement();
}

ArrangementPaneShadowNode::ArrangementPaneShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment),
      placement_(static_cast<const ArrangementPaneShadowNode &>(sourceShadowNode).placement_) {
  // New props rebuilt the Yoga style from scratch.
  if (fragment.props) {
    applyPlacement();
  }
}

void ArrangementPaneShadowNode::place(const PanePlacement &placement) {
  ensureUnsealed();
  placement_ = placement;
  applyPlacement();
}

void ArrangementPaneShadowNode::applyPlacement() {
  auto style = yogaNode_.style();
  const auto previous = style;
  style.setPositionType(yoga::PositionType::Absolute);
  if (placement_.frame) {
    const auto &frame = *placement_.frame;
    style.setDisplay(yoga::Display::Flex);
    for (auto edge : {yoga::Edge::Left, yoga::Edge::Right, yoga::Edge::Start, yoga::Edge::End}) {
      style.setPosition(edge, yoga::StyleLength::undefined());
    }
    // Writing the edge Fabric's swap would have produced makes the style the same whether or
    // not this node has been through configureYogaTree yet.
    const auto left =
        placement_.direction == ArrangementDirection::RightToLeftSwapped ? yoga::Edge::End : yoga::Edge::Left;
    style.setPosition(left, yoga::StyleLength::points(static_cast<float>(frame.left)));
    style.setPosition(yoga::Edge::Top, yoga::StyleLength::points(static_cast<float>(frame.top)));
    style.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(static_cast<float>(frame.width)));
    style.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(static_cast<float>(frame.height)));
  } else {
    style.setDisplay(yoga::Display::None);
  }
  if (style != previous) {
    yogaNode_.setStyle(style);
    yogaNode_.setDirty(true);
  }
}

#pragma mark - ArrangementViewEventEmitter

void ArrangementViewEventEmitter::reportPanes(const PaneFrames &frames) const {
  {
    std::lock_guard<std::mutex> lock(mutex_);
    if (reported_ == frames) {
      return;
    }
    reported_ = frames;
  }
  const auto &primary = frames.primary;
  const auto secondary = frames.secondary.value_or(arrangementview::Frame{});
  onPanesChange({
      .primary = {.x = primary.left, .y = primary.top, .width = primary.width, .height = primary.height},
      .secondary = {.x = secondary.left, .y = secondary.top, .width = secondary.width, .height = secondary.height},
      .secondaryVisible = frames.secondary.has_value(),
  });
}

#pragma mark - ArrangementViewShadowNode

namespace {

arrangementview::ArrangeOptions optionsFrom(const RNArrangementViewProps &props, ArrangementDirection direction) {
  using namespace arrangementview;
  return {
      .arrangement =
          props.arrangement == RNArrangementViewArrangement::Overlay ? Arrangement::Overlay : Arrangement::Split,
      .axes = props.axes == RNArrangementViewAxes::Horizontal ? Axes::Horizontal
          : props.axes == RNArrangementViewAxes::Vertical     ? Axes::Vertical
                                                              : Axes::Both,
      .hingePolicy = props.hingePolicy == RNArrangementViewHingePolicy::AlwaysAvoid ? HingePolicy::AlwaysAvoid
          : props.hingePolicy == RNArrangementViewHingePolicy::NeverAvoid           ? HingePolicy::NeverAvoid
                                                                                    : HingePolicy::AvoidSeparating,
      .hingeGap = props.hingeGap,
      .primaryEdge = props.primaryEdge == RNArrangementViewPrimaryEdge::Leading ? HorizontalEdge::Leading
          : props.primaryEdge == RNArrangementViewPrimaryEdge::Trailing         ? HorizontalEdge::Trailing
                                                                                : HorizontalEdge::Auto,
      .primaryVerticalEdge = props.primaryVerticalEdge == RNArrangementViewPrimaryVerticalEdge::Top
          ? VerticalEdge::Top
          : props.primaryVerticalEdge == RNArrangementViewPrimaryVerticalEdge::Bottom ? VerticalEdge::Bottom
                                                                                      : VerticalEdge::Auto,
      .rtl = direction != ArrangementDirection::LeftToRight,
  };
}

} // namespace

ArrangementViewShadowNode::ArrangementViewShadowNode(
    const ShadowNodeFragment &fragment,
    const ShadowNodeFamily::Shared &family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  placePanes();
}

ArrangementViewShadowNode::ArrangementViewShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  placePanes();
}

void ArrangementViewShadowNode::appendChild(const std::shared_ptr<const ShadowNode> &child) {
  ConcreteViewShadowNode::appendChild(child);
  placePanes();
}

void ArrangementViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  if (const auto frames = this->frames()) {
    getConcreteEventEmitter().reportPanes(*frames);
  }
}

std::optional<PaneFrames> ArrangementViewShadowNode::frames() const {
  const auto &environment = getStateData().environment;
  if (!environment) {
    return std::nullopt;
  }
  return arrangementview::arrange(environment->geometry, optionsFrom(getConcreteProps(), environment->direction));
}

void ArrangementViewShadowNode::placePanes() {
  const auto &children = getChildren();
  if (children.empty()) {
    return;
  }
  // A strong reference: replacing the content View below may drop the last other one.
  const auto content = children.front();
  const auto &panes = content->getChildren();
  react_native_assert(
      children.size() == 1 && panes.size() == 2 &&
      dynamic_cast<const ArrangementPaneShadowNode *>(panes[0].get()) &&
      dynamic_cast<const ArrangementPaneShadowNode *>(panes[1].get()) &&
      "ArrangementView.android.tsx renders one View holding the secondary pane, then the primary pane");
  if (panes.size() != 2) {
    return;
  }

  const auto frames = this->frames();
  const auto direction = frames ? getStateData().environment->direction : ArrangementDirection::LeftToRight;
  const PanePlacement wanted[2] = {
      {frames ? frames->secondary : std::nullopt, direction},
      {frames ? std::optional(frames->primary) : std::nullopt, direction},
  };
  std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> placed;
  for (size_t index = 0; index < 2; index++) {
    const auto pane = std::dynamic_pointer_cast<const ArrangementPaneShadowNode>(panes[index]);
    if (!pane || pane->placement() == wanted[index]) {
      continue;
    }
    if (!placed) {
      placed = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(panes);
    }
    auto clone = std::static_pointer_cast<ArrangementPaneShadowNode>(pane->clone({}));
    clone->place(wanted[index]);
    (*placed)[index] = std::move(clone);
  }
  if (!placed) {
    return;
  }
  const std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> contentChildren = std::move(placed);
  replaceChild(*content, content->clone({.children = contentChildren}), 0);
  // replaceChild leaves this node clean, and Yoga reaches the moved panes only through dirty ancestors.
  dirtyLayout();
}

} // namespace facebook::react
