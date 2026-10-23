package com.arrangementview

import android.util.Log
import android.view.View
import android.view.ViewTreeObserver
import com.facebook.react.uimanager.util.ReactFindViewUtil

internal object BenchProbe {
  private const val TAG = "RAVBENCH"

  fun fold(view: View, state: Any?) {
    Log.i(TAG, "fold t=${System.nanoTime()} id=${view.id} state=$state")
  }

  fun attach(view: View) {
    Log.i(TAG, "attach t=${System.nanoTime()} id=${view.id}")
    var last = ""
    val onDraw = ViewTreeObserver.OnDrawListener {
      val root = view.rootView
      val primary = ReactFindViewUtil.findView(view, "bench-primary")
      val secondary = ReactFindViewUtil.findView(view, "bench-secondary")
      val signature =
        "win=${root.width}x${root.height} av=${view.width}x${view.height} " +
          "p=${rect(view, primary)} s=${rect(view, secondary)}"
      if (signature != last) {
        last = signature
        Log.i(TAG, "draw t=${System.nanoTime()} id=${view.id} $signature")
      }
    }
    view.viewTreeObserver.addOnDrawListener(onDraw)
    view.addOnAttachStateChangeListener(
      object : View.OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) = Unit

        override fun onViewDetachedFromWindow(v: View) {
          v.viewTreeObserver.removeOnDrawListener(onDraw)
          v.removeOnAttachStateChangeListener(this)
          Log.i(TAG, "detach t=${System.nanoTime()} id=${v.id}")
        }
      })
  }

  private fun rect(host: View, target: View?): String {
    if (target == null || !target.isShown || target.width == 0 || target.height == 0) return "none"
    val a = IntArray(2)
    val b = IntArray(2)
    host.getLocationInWindow(a)
    target.getLocationInWindow(b)
    return "${b[0] - a[0]},${b[1] - a[1]},${target.width},${target.height}"
  }
}
