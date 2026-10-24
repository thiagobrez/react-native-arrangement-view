package com.arrangementview

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import com.facebook.react.uimanager.util.ReactFindViewUtil
import java.lang.ref.WeakReference
import kotlin.math.roundToInt

internal object HingeBenchProbe {
  private val emitted = HashMap<Int, Long>()
  private val latencies = ArrayList<Double>()
  private var attached = false
  private var bar: WeakReference<View>? = null
  private var lastWidth = -1
  private var unmatched = 0
  private val main = Handler(Looper.getMainLooper())
  private val dump = Runnable {
    val sorted = latencies.sorted()
    fun pct(p: Int) = if (sorted.isEmpty()) null else sorted[minOf(sorted.size - 1, p * sorted.size / 100)]
    Log.i(
      "RAVE2E",
      "{\"count\":${sorted.size},\"unmatched\":$unmatched,\"p50\":${pct(50)},\"p90\":${pct(90)}," +
        "\"p99\":${pct(99)},\"max\":${sorted.lastOrNull()}}")
    latencies.clear()
    unmatched = 0
  }

  fun emitted(degrees: Float?, t: Long) {
    if (degrees != null) emitted[degrees.roundToInt()] = t
  }

  fun attach(activity: Activity?) {
    if (attached || activity == null) return
    attached = true
    val root = activity.window.decorView
    val density = root.resources.displayMetrics.density
    root.viewTreeObserver.addOnDrawListener {
      val now = System.nanoTime()
      val view =
        bar?.get()?.takeIf { it.isAttachedToWindow }
          ?: ReactFindViewUtil.findView(root, "bench-bar")?.also { bar = WeakReference(it) }
          ?: return@addOnDrawListener
      val width = view.width
      if (width == lastWidth || width == 0) return@addOnDrawListener
      lastWidth = width
      val t = emitted[(width / (2 * density)).roundToInt()]
      if (t == null) unmatched++ else latencies.add((now - t) / 1e6)
      main.removeCallbacks(dump)
      main.postDelayed(dump, 1000)
    }
  }
}
