package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
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

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
      put(HingeTracker.EVENT, mapOf("registrationName" to "onHingeChange"))
      put(ArrangementView.GEOMETRY_EVENT, mapOf("registrationName" to "onGeometryChange"))
    }

  companion object {
    const val NAME = "RNArrangementView"
  }
}
