package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

@ReactModule(name = SystemLayoutObserverViewManager.NAME)
class SystemLayoutObserverViewManager : SimpleViewManager<SystemLayoutObserverView>() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): SystemLayoutObserverView =
    SystemLayoutObserverView(context)

  @ReactProp(name = "halfOpenAtDegrees", defaultDouble = -1.0)
  fun setHalfOpenAtDegrees(view: SystemLayoutObserverView, degrees: Double) {
    view.halfOpenAtDegrees = degrees
  }

  @ReactProp(name = "flatAtDegrees", defaultDouble = -1.0)
  fun setFlatAtDegrees(view: SystemLayoutObserverView, degrees: Double) {
    view.flatAtDegrees = degrees
  }

  override fun onAfterUpdateTransaction(view: SystemLayoutObserverView) {
    super.onAfterUpdateTransaction(view)
    view.updateThreshold()
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
      put(SystemLayoutObserverView.EVENT, mapOf("registrationName" to "onSystemLayoutChange"))
    }

  companion object {
    const val NAME = "RNSystemLayoutObserver"
  }
}
