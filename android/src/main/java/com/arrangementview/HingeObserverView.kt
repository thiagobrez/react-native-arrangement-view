package com.arrangementview

import android.view.View
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.uimanager.ThemedReactContext

/** An empty view that reports the hinge of the window it is attached to. */
class HingeObserverView(private val reactContext: ThemedReactContext) : View(reactContext) {

  private val hinge = HingeTracker(reactContext) { dispatchReactEvent(reactContext, HingeTracker.EVENT, it) }
  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(reactContext))

  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    hinge.fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val activity = reactContext.currentActivity
    hinge.attach(awaitLayout = activity != null)
    if (activity != null) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(reactContext), onWindowLayout)
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
    hinge.detach()
  }
}
