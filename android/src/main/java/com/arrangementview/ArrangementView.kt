package com.arrangementview

import android.graphics.Rect
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Android has no system arrangement container, so this view only reports what the layout policy
 * in src/arrange.ts needs: its size, its window's size, the fold crossing it, and the hinge. React
 * lays out the panes.
 */
class ArrangementView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {

  private val hinge = HingeTracker(reactContext) { dispatchReactEvent(reactContext, HingeTracker.EVENT, it) }

  var observeHinge by hinge::enabled

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(reactContext))

  private var fold: FoldingFeature? = null

  /**
   * Yoga's padding and border for this view. Fabric does not apply them to the Android view,
   * because Yoga has already positioned the descendants. JS lays the panes out inside a wrapper
   * that fills the content box, so geometry is reported in that box.
   */
  val contentInsets = Rect()

  fun setContentInsets(left: Int, top: Int, right: Int, bottom: Int) {
    contentInsets.set(left, top, right, bottom)
    // Moving padding from one edge to another keeps the size and moves the fold.
    emitGeometry()
  }

  // Geometry is withheld until the first WindowLayoutInfo so JS never arranges without the fold.
  private var hasWindowLayout = false
  private val foldInView = Rect()
  private var lastGeometry: List<Any?>? = null

  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
    hasWindowLayout = true
    emitGeometry()
    hinge.fold = fold
  }

  // Fabric positions views without a layout pass, so ancestors can move this view without any
  // callback reaching it. Checking before each draw is cheap and sees every such change.
  private val onPreDraw = ViewTreeObserver.OnPreDrawListener {
    emitGeometry()
    true
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val activity = reactContext.currentActivity
    hinge.attach(awaitLayout = activity != null)
    if (activity != null) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(reactContext), onWindowLayout)
    } else {
      hasWindowLayout = true
    }
    viewTreeObserver.addOnPreDrawListener(onPreDraw)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
    viewTreeObserver.removeOnPreDrawListener(onPreDraw)
    hinge.detach()
  }

  private fun emitGeometry() {
    if (!hasWindowLayout) return
    val fold = fold
    if (fold != null) {
      // Fold bounds are in window coordinates. Use this view's layout position rather than
      // getLocationInWindow so a screen transition's transform doesn't drag the fold along.
      var x = 0
      var y = 0
      var view: View = this
      while (true) {
        x += view.left
        y += view.top
        val parent = view.parent as? View ?: break
        x -= parent.scrollX
        y -= parent.scrollY
        view = parent
      }
      foldInView.set(fold.bounds)
      foldInView.offset(-x - contentInsets.left, -y - contentInsets.top)
    } else {
      foldInView.setEmpty()
    }
    val width = width - contentInsets.left - contentInsets.right
    val height = height - contentInsets.top - contentInsets.bottom
    // Material sizes panes by the window, as iOS size classes are by the scene.
    val window = rootView
    val geometry =
      listOf(
        width,
        height,
        window.width,
        window.height,
        Rect(foldInView),
        fold?.orientation,
        fold?.isSeparating,
        fold?.state)
    if (geometry == lastGeometry) return
    lastGeometry = geometry
    dispatchReactEvent(
      reactContext,
      GEOMETRY_EVENT,
      Arguments.createMap().apply {
        putDouble("width", dp(width))
        putDouble("height", dp(height))
        putMap(
          "window",
          Arguments.createMap().apply {
            putDouble("width", dp(window.width))
            putDouble("height", dp(window.height))
          })
        if (fold != null) {
          putMap(
            "fold",
            Arguments.createMap().apply {
              putDouble("x", dp(foldInView.left))
              putDouble("y", dp(foldInView.top))
              putDouble("width", dp(foldInView.width()))
              putDouble("height", dp(foldInView.height()))
              putString(
                "orientation",
                if (fold.orientation == FoldingFeature.Orientation.VERTICAL) "vertical"
                else "horizontal")
              putBoolean("separating", fold.isSeparating)
              putBoolean("halfOpened", fold.state == FoldingFeature.State.HALF_OPENED)
            })
        }
      })
  }

  private fun dp(pixels: Int): Double = PixelUtil.toDIPFromPixel(pixels.toFloat()).toDouble()

  companion object {
    const val GEOMETRY_EVENT = "topGeometryChange"
  }
}
