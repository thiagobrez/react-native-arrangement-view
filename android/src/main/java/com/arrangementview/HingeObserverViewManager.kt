package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

@ReactModule(name = HingeObserverViewManager.NAME)
class HingeObserverViewManager : SimpleViewManager<HingeObserverView>() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): HingeObserverView =
    HingeObserverView(context)

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
      put(HingeTracker.EVENT, mapOf("registrationName" to "onHingeChange"))
    }

  companion object {
    const val NAME = "RNHingeObserver"
  }
}
