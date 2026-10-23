package com.arrangementview

import com.facebook.react.uimanager.StateWrapper

/**
 * Hands what [ArrangementView] measured, in dp, to its shadow node (android/src/main/jni), which
 * places the panes. The update commits, lays out and mounts before it returns: call it on the UI
 * thread, outside a mount. The library's C++ is linked into the app's libappmodules.so, which React
 * Native loads at startup.
 */
internal object ArrangementStateBridge {
  @JvmStatic
  external fun update(
    stateWrapper: StateWrapper,
    width: Double,
    height: Double,
    windowWidth: Double,
    windowHeight: Double,
    hasFold: Boolean,
    foldX: Double,
    foldY: Double,
    foldWidth: Double,
    foldHeight: Double,
    foldVertical: Boolean,
    foldSeparating: Boolean,
    foldHalfOpened: Boolean,
    rtl: Boolean,
    swapLeftAndRight: Boolean,
  )
}
