package com.margelo.nitro.arrangementview

import android.os.Handler
import android.os.Looper
import androidx.annotation.Keep
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.arrangementview.HingeReading
import com.arrangementview.HingeTracker
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import java.util.concurrent.CopyOnWriteArrayList

/** The hinge of the current activity's window, through Nitro instead of a Fabric view event. */
@Keep
@DoNotStrip
class HybridHinge : HybridHingeSpec() {
  private val context = NitroModules.applicationContext ?: throw Error("No React context yet")
  private val main = Handler(Looper.getMainLooper())
  private val listeners = CopyOnWriteArrayList<(HingeSample) -> Unit>()
  private val tracker = HingeTracker(context) { reading ->
    val sample = reading.toSample()
    latest = sample
    listeners.forEach { it(sample) }
  }
  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(context))
  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    tracker.fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
  }

  @Volatile private var latest = HingeSample(false, -1.0, "unknown", 0.0)

  override val current: HingeSample
    get() = latest

  override fun nanoTime(): Double = System.nanoTime().toDouble()

  override fun addListener(listener: (sample: HingeSample) -> Unit): () -> Unit {
    listeners.add(listener)
    if (listeners.size == 1) main.post(::start)
    return {
      if (listeners.remove(listener) && listeners.isEmpty()) main.post(::stop)
    }
  }

  private fun start() {
    if (listeners.isEmpty()) return
    val activity = context.currentActivity
    tracker.attach(awaitLayout = activity != null)
    if (activity != null) {
      windowInfo.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(context), onWindowLayout)
    }
  }

  private fun stop() {
    if (listeners.isNotEmpty()) return
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
    tracker.detach()
  }
}

private fun HingeReading.toSample() = HingeSample(available, radians ?: -1.0, status, t.toDouble())
