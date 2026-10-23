package com.arrangementview

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
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

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == HingeModule.NAME) HingeModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      HingeModule.NAME to
        ReactModuleInfo(HingeModule.NAME, HingeModule::class.java.name, false, false, false, true))
  }

  companion object {
    init {
      NitroArrangementViewOnLoad.initializeNative()
    }
  }
}
