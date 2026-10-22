#include <fbjni/fbjni.h>
#include <react/fabric/StateWrapperImpl.h>

#include "ArrangementShadowNodes.h"

using namespace facebook;
using namespace facebook::react;

// StateWrapper.updateState would commit on the JS thread a frame or more later; an immediate update
// from the UI thread commits, lays out and mounts the new pane frames before this returns, so the
// next frame drawn shows them.
extern "C" JNIEXPORT void JNICALL Java_com_arrangementview_ArrangementStateBridge_update(
    JNIEnv *,
    jclass,
    jobject stateWrapper,
    jdouble width,
    jdouble height,
    jdouble windowWidth,
    jdouble windowHeight,
    jboolean hasFold,
    jdouble foldX,
    jdouble foldY,
    jdouble foldWidth,
    jdouble foldHeight,
    jboolean foldVertical,
    jboolean foldSeparating,
    jboolean foldHalfOpened,
    jboolean rtl,
    jboolean swapLeftAndRight) {
  auto wrapper =
      jni::alias_ref<StateWrapperImpl::javaobject>(static_cast<StateWrapperImpl::javaobject>(stateWrapper));
  auto state = std::static_pointer_cast<const ArrangementViewShadowNode::ConcreteState>(wrapper->cthis()->getState());
  if (!state) {
    return;
  }
  ArrangementEnvironment environment{
      .geometry = {.width = width, .height = height, .window = {.width = windowWidth, .height = windowHeight}},
      .direction = rtl != JNI_TRUE  ? ArrangementDirection::LeftToRight
          : swapLeftAndRight == JNI_TRUE ? ArrangementDirection::RightToLeftSwapped
                                         : ArrangementDirection::RightToLeft,
  };
  if (hasFold == JNI_TRUE) {
    environment.geometry.fold = arrangementview::Fold{
        .x = foldX,
        .y = foldY,
        .width = foldWidth,
        .height = foldHeight,
        .orientation = foldVertical == JNI_TRUE ? arrangementview::FoldOrientation::Vertical
                                                : arrangementview::FoldOrientation::Horizontal,
        .separating = foldSeparating == JNI_TRUE,
        .halfOpened = foldHalfOpened == JNI_TRUE,
    };
  }
  state->updateState(
      [environment](const ArrangementViewState &previous) -> StateData::Shared {
        if (previous.environment == environment) {
          return nullptr;
        }
        return std::make_shared<const ArrangementViewState>(environment);
      },
      EventQueue::UpdateMode::unstable_Immediate);
}
