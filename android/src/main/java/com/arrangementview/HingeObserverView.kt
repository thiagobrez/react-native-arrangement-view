package com.arrangementview

import android.view.View
import com.facebook.react.uimanager.ThemedReactContext

class HingeObserverView(reactContext: ThemedReactContext) : View(reactContext) {

  private val hinge = HingeTracker(this, reactContext)

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    hinge.attach()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    hinge.detach()
  }
}
