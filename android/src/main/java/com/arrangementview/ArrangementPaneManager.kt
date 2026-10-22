package com.arrangementview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.views.view.ReactViewManager

// A plain View on Android: the ArrangementView's shadow node gives each pane its frame.
@ReactModule(name = ArrangementPaneManager.NAME)
class ArrangementPaneManager : ReactViewManager() {
  override fun getName(): String = NAME

  companion object {
    const val NAME = "RNArrangementPane"
  }
}
