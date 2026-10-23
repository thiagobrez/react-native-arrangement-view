package com.arrangementview

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.margelo.nitro.arrangementview.NitroArrangementViewOnLoad
import com.margelo.nitro.arrangementview.views.HybridNitroPaneHostManager

class ArrangementViewPackage : BaseReactPackage() {
  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = listOf(
    ArrangementViewManager(),
    ArrangementPaneManager(),
    HingeObserverViewManager(),
    HybridNitroPaneHostManager(),
  )

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider { emptyMap() }

  companion object {
    init {
      NitroArrangementViewOnLoad.initializeNative()
    }
  }
}
