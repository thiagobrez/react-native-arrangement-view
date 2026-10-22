package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

// Extends the plain View manager so every View style (borders, overflow, ...) keeps working.
@ReactModule(name = ArrangementViewManager.NAME)
class ArrangementViewManager : ReactViewManager() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): ReactViewGroup =
    ArrangementView(context)

  override fun setPadding(view: ReactViewGroup, left: Int, top: Int, right: Int, bottom: Int) {
    (view as ArrangementView).setContentInsets(left, top, right, bottom)
  }

  override fun updateState(
    view: ReactViewGroup,
    props: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?
  ): Any? {
    (view as ArrangementView).stateWrapper = stateWrapper
    return null
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
      put(HingeTracker.EVENT, mapOf("registrationName" to "onHingeChange"))
      put(PANES_EVENT, mapOf("registrationName" to "onPanesChange"))
    }

  companion object {
    const val NAME = "RNArrangementView"
    private const val PANES_EVENT = "topPanesChange"
  }
}
