package com.arrangementview

import android.content.Context
import android.graphics.Point
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.window.layout.FoldingFeature
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.RootViewUtil
import com.facebook.react.uimanager.ThemedReactContext

class SystemLayoutObserverView(private val reactContext: ThemedReactContext) :
  View(reactContext), WindowFolds.Listener {

  private val hasHingeSensor =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
      (reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager)
        .getDefaultSensor(Sensor.TYPE_HINGE_ANGLE) != null
  private var folds: WindowFolds? = null
  private var sawFold = false
  private var reported: Report? = null

  // Fabric moves views without a layout pass, so an ancestor can move this view without any
  // callback reaching it.
  private val onPreDraw = ViewTreeObserver.OnPreDrawListener {
    report()
    true
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(onPreDraw)
    report()
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(onPreDraw)
    folds?.unsubscribe(this)
    folds = null
    super.onDetachedFromWindow()
  }

  override fun onWindowFoldsChanged() = report()

  private fun report() {
    // The activity can be missing when the view first attaches, so every frame retries.
    if (folds == null) {
      val activity = reactContext.currentActivity
      if (activity == null || !isAttachedToWindow) return
      folds = WindowFolds.of(activity).also { it.subscribe(this) }
    }
    val features = folds?.features ?: return
    if (width == 0 || height == 0) return
    sawFold = sawFold || features.isNotEmpty()
    val report = measure(features)
    if (report == reported) return
    reported = report
    dispatchReactEvent(reactContext, EVENT, report.toEvent())
  }

  /** In dp, each divided by the density once, after the pixel arithmetic. */
  private fun measure(features: List<FoldingFeature>): Report {
    val density = resources.displayMetrics.density
    val location = IntArray(2).also { getLocationInWindow(it) }
    val window = rootView
    val toMeasureInWindow = if (features.isEmpty()) Point() else measureInWindowOffset()
    val insets = ViewCompat.getRootWindowInsets(this)
    val bars =
      insets?.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
    val right = window.width - location[0] - width
    val bottom = window.height - location[1] - height
    return Report(
      width = width / density,
      height = height / density,
      hasHinge = hasHingeSensor || sawFold,
      safeArea =
        Edges(
          top = maxOf(0, (bars?.top ?: 0) - location[1]) / density,
          right = maxOf(0, (bars?.right ?: 0) - right) / density,
          bottom = maxOf(0, (bars?.bottom ?: 0) - bottom) / density,
          left = maxOf(0, (bars?.left ?: 0) - location[0]) / density),
      folds =
        features.map { feature ->
          val bounds = feature.bounds
          Fold(
            inView =
              Box(
                (bounds.left - location[0]) / density,
                (bounds.top - location[1]) / density,
                bounds.width() / density,
                bounds.height() / density),
            inWindow =
              Box(
                (bounds.left + toMeasureInWindow.x) / density,
                (bounds.top + toMeasureInWindow.y) / density,
                bounds.width() / density,
                bounds.height() / density),
            separating = feature.isSeparating,
            state = if (feature.state == FoldingFeature.State.HALF_OPENED) "halfOpen" else "flat")
        },
      occlusions =
        insets?.displayCutout?.boundingRects.orEmpty().map { rect ->
          Box(
            (rect.left - location[0]) / density,
            (rect.top - location[1]) / density,
            rect.width() / density,
            rect.height() / density)
        })
  }

  /** From window pixels to the pixels measureInWindow counts from. */
  private fun measureInWindowOffset(): Point {
    val root = RootViewUtil.getRootView(this) as? View ?: return Point()
    val location = IntArray(2).also { root.getLocationInWindow(it) }
    val viewportOffset = RootViewUtil.getViewportOffset(root)
    return Point(viewportOffset.x - location[0], viewportOffset.y - location[1])
  }

  private data class Box(val x: Float, val y: Float, val width: Float, val height: Float) {
    fun toMap(): WritableMap =
      Arguments.createMap().apply {
        putDouble("x", x.toDouble())
        putDouble("y", y.toDouble())
        putDouble("width", width.toDouble())
        putDouble("height", height.toDouble())
      }
  }

  private data class Edges(val top: Float, val right: Float, val bottom: Float, val left: Float)

  private data class Fold(val inView: Box, val inWindow: Box, val separating: Boolean, val state: String)

  private data class Report(
    val width: Float,
    val height: Float,
    val hasHinge: Boolean,
    val safeArea: Edges,
    val folds: List<Fold>,
    val occlusions: List<Box>,
  ) {
    fun toEvent(): WritableMap =
      Arguments.createMap().apply {
        putDouble("width", width.toDouble())
        putDouble("height", height.toDouble())
        putBoolean("hasHinge", hasHinge)
        putBoolean("keepsLines", true)
        putMap(
          "safeArea",
          Arguments.createMap().apply {
            putDouble("top", safeArea.top.toDouble())
            putDouble("right", safeArea.right.toDouble())
            putDouble("bottom", safeArea.bottom.toDouble())
            putDouble("left", safeArea.left.toDouble())
          })
        putArray(
          "folds",
          Arguments.createArray().apply {
            folds.forEach { fold ->
              pushMap(
                fold.inView.toMap().apply {
                  putMap("window", fold.inWindow.toMap())
                  putBoolean("separating", fold.separating)
                  putString("state", fold.state)
                })
            }
          })
        putArray("occlusions", Arguments.createArray().apply { occlusions.forEach { pushMap(it.toMap()) } })
        putString("horizontalSizeClass", "")
        putString("verticalBarEdge", "")
        putMap(
          "barInsets",
          Arguments.createMap().apply {
            putDouble("top", -1.0)
            putDouble("bottom", -1.0)
            putDouble("leading", -1.0)
            putDouble("trailing", -1.0)
          })
      }
  }

  companion object {
    const val EVENT = "topSystemLayoutChange"
  }
}
