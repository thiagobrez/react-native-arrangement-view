package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

@ReactModule(name = SystemLayoutObserverViewManager.NAME)
class SystemLayoutObserverViewManager : SimpleViewManager<SystemLayoutObserverView>() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): SystemLayoutObserverView =
    SystemLayoutObserverView(context)

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
      put(SystemLayoutObserverView.EVENT, mapOf("registrationName" to "onSystemLayoutChange"))
    }

  companion object {
    const val NAME = "RNSystemLayoutObserver"
  }
}
