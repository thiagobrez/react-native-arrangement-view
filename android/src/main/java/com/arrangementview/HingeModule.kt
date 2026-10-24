package com.arrangementview

import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = HingeModule.NAME)
class HingeModule(private val context: ReactApplicationContext) : NativeHingeModuleSpec(context) {
  private val tracker = HingeTracker(context) { emitOnHinge(it.toWritableMap()) }
  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(context))
  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    tracker.fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
  }

  override fun start() {
    UiThreadUtil.runOnUiThread {
      val activity = context.currentActivity
      tracker.attach(awaitLayout = activity != null)
      if (activity != null) {
        windowInfo.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(context), onWindowLayout)
      }
    }
  }

  override fun stop() {
    UiThreadUtil.runOnUiThread {
      windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
      tracker.detach()
    }
  }

  companion object {
    const val NAME = NativeHingeModuleSpec.NAME
  }
}
