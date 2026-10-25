package com.arrangementview

import android.app.Activity
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import java.util.WeakHashMap

/** An activity window's folds, from one WindowManager listener that every observer in it shares. */
internal class WindowFolds private constructor(private val activity: Activity) {

  fun interface Listener {
    fun onWindowFoldsChanged()
  }

  /** In WindowManager's order and the window's pixels. Null until WindowManager reports the window's layout. */
  var features: List<FoldingFeature>? = null
    private set

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(activity))
  private val listeners = LinkedHashSet<Listener>()
  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    features = info.displayFeatures.filterIsInstance<FoldingFeature>()
    listeners.toList().forEach { it.onWindowFoldsChanged() }
  }

  fun subscribe(listener: Listener) {
    if (listeners.isEmpty()) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(activity), onWindowLayout)
    }
    listeners.add(listener)
  }

  fun unsubscribe(listener: Listener) {
    if (!listeners.remove(listener) || listeners.isNotEmpty()) return
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
    windows.remove(activity)
  }

  companion object {
    private val windows = WeakHashMap<Activity, WindowFolds>()

    fun of(activity: Activity): WindowFolds = windows.getOrPut(activity) { WindowFolds(activity) }
  }
}
