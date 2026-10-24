package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = ArrangementPaneManager.NAME)
class ArrangementPaneManager : ReactViewManager() {
  override fun getName(): String = NAME

  companion object {
    const val NAME = "RNArrangementPane"
  }
}
