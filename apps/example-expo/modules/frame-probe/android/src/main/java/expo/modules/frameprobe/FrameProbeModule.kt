package expo.modules.frameprobe

import android.app.Activity
import android.util.Log
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.uimanager.util.ReactFindViewUtil
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// e2e/frames.ts parses these lines and throws on any it doesn't know.
private const val TAG = "RAVFRAMES"

class FrameProbeModule : Module() {
  private var probe: Probe? = null

  override fun definition() = ModuleDefinition {
    Name("FrameProbe")

    AsyncFunction("start") { arrangement: String, primary: String, secondary: String ->
      val activity = appContext.currentActivity ?: throw IllegalStateException("FrameProbe.start needs an activity")
      probe?.stop()
      probe = Probe(activity, arrangement, primary, secondary).also { it.start() }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stop") {
      probe?.stop()
      probe = null
    }.runOnQueue(Queues.MAIN)

    // A synchronous function runs on the JavaScript thread, so this times the moment it blocks or
    // comes back on the clock the draws use.
    Function("mark") { label: String -> Log.i(TAG, "mark ns=${System.nanoTime()} label=$label") }
  }
}

private class Probe(
  private val activity: Activity,
  private val arrangementId: String,
  private val primaryId: String,
  private val secondaryId: String,
) {
  private val root: View = activity.window.decorView
  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(activity))
  private var posture: String? = null
  private val arrangementAt = IntArray(2)
  private val paneAt = IntArray(2)

  private val onDraw = ViewTreeObserver.OnDrawListener {
    val arrangement = ReactFindViewUtil.findView(root, arrangementId)
    val described =
      if (arrangement == null) {
        "none primary=none secondary=none"
      } else {
        "${arrangement.id}:${arrangement.width}x${arrangement.height} " +
          "primary=${pane(arrangement, primaryId)} secondary=${pane(arrangement, secondaryId)}"
      }
    Log.i(TAG, "draw ns=${System.nanoTime()} window=${root.width}x${root.height} arrangement=$described")
  }

  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    val next =
      when (info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()?.state) {
        FoldingFeature.State.FLAT -> "flat"
        FoldingFeature.State.HALF_OPENED -> "halfOpened"
        else -> "none"
      }
    val previous = posture
    posture = next
    if (previous != null && previous != next) {
      Log.i(TAG, "posture ns=${System.nanoTime()} from=$previous to=$next")
    }
  }

  fun start() {
    root.viewTreeObserver.addOnDrawListener(onDraw)
    windowInfo.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(activity), onWindowLayout)
    // A still screen draws nothing more, and the frames judged later need one to compare against.
    root.invalidate()
  }

  fun stop() {
    root.viewTreeObserver.removeOnDrawListener(onDraw)
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
  }

  private fun pane(arrangement: View, nativeId: String): String {
    val pane = ReactFindViewUtil.findView(arrangement, nativeId)
    if (pane == null || !pane.isShown || pane.width == 0 || pane.height == 0) return "none"
    arrangement.getLocationInWindow(arrangementAt)
    pane.getLocationInWindow(paneAt)
    return "${paneAt[0] - arrangementAt[0]},${paneAt[1] - arrangementAt[1]},${pane.width},${pane.height}"
  }
}
