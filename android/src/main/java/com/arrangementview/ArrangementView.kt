package com.arrangementview

import android.content.Context
import android.graphics.Rect
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.view.ReactViewGroup

/**
 * Android has no system arrangement container, so this view only reports what the layout policy
 * in src/arrange.ts needs: its size, the fold separating it, and the hinge. Jetpack WindowManager
 * decides what counts as a separating fold; React lays out the panes.
 */
class ArrangementView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext), SensorEventListener {

  var observeHinge = true
    set(value) {
      if (field == value) return
      field = value
      updateHingeSensor()
      // JS resets to unavailable when disabled; re-enabling must replay the current state.
      lastHinge = null
      emitHinge()
    }

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(reactContext))
  private val sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val hingeSensor: Sensor? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      sensorManager.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE)
    } else {
      null
    }

  private var fold: FoldingFeature? = null
  private var hingeDegrees: Float? = null
  private var lastHinge: Triple<Boolean, Double, String>? = null

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
  private var separatingFold: Rect? = null
  private val foldInView = Rect()
  private val lastFoldInView = Rect()
  private var lastHasFold = false
  private var lastWidth = -1
  private var lastHeight = -1

  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
    separatingFold = fold?.takeIf { it.isSeparating }?.bounds
    hasWindowLayout = true
    emitGeometry()
    emitHinge()
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
    if (activity != null) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(reactContext), onWindowLayout)
    } else {
      hasWindowLayout = true
    }
    viewTreeObserver.addOnPreDrawListener(onPreDraw)
    updateHingeSensor()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
    viewTreeObserver.removeOnPreDrawListener(onPreDraw)
    sensorManager.unregisterListener(this)
  }

  private fun updateHingeSensor() {
    sensorManager.unregisterListener(this)
    if (observeHinge && isAttachedToWindow && hingeSensor != null) {
      sensorManager.registerListener(this, hingeSensor, SensorManager.SENSOR_DELAY_NORMAL)
    }
  }

  override fun onSensorChanged(event: SensorEvent) {
    hingeDegrees = event.values[0]
    emitHinge()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  private fun emitHinge() {
    if (!observeHinge) return
    val degrees = hingeDegrees
    // WindowManager names the open postures. It reports no fold for a closed device, whose app
    // runs on the cover display, so only there does the angle decide.
    val status =
      when {
        fold?.state == FoldingFeature.State.FLAT -> "fullyOpen"
        fold?.state == FoldingFeature.State.HALF_OPENED -> "partiallyOpen"
        degrees != null && degrees < CLOSED_DEGREES -> "closed"
        else -> "unknown"
      }
    val available = fold != null || hingeSensor != null
    val radians = if (degrees != null) Math.toRadians(degrees.toDouble()) else Double.NaN
    val hinge = Triple(available, radians, status)
    if (hinge == lastHinge) return
    lastHinge = hinge
    dispatch(
      HINGE_EVENT,
      Arguments.createMap().apply {
        putBoolean("available", available)
        putDouble("angle", radians)
        putString("status", status)
      })
  }

  private fun emitGeometry() {
    if (!hasWindowLayout) return
    val fold = separatingFold
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
      foldInView.set(fold)
      foldInView.offset(-x - contentInsets.left, -y - contentInsets.top)
    } else {
      foldInView.setEmpty()
    }
    val hasFold = fold != null
    val width = width - contentInsets.left - contentInsets.right
    val height = height - contentInsets.top - contentInsets.bottom
    if (
      width == lastWidth &&
        height == lastHeight &&
        hasFold == lastHasFold &&
        foldInView == lastFoldInView
    ) {
      return
    }
    lastWidth = width
    lastHeight = height
    lastHasFold = hasFold
    lastFoldInView.set(foldInView)
    dispatch(
      GEOMETRY_EVENT,
      Arguments.createMap().apply {
        putDouble("width", dp(width))
        putDouble("height", dp(height))
        if (fold != null) {
          putMap(
            "fold",
            Arguments.createMap().apply {
              putDouble("x", dp(foldInView.left))
              putDouble("y", dp(foldInView.top))
              putDouble("width", dp(foldInView.width()))
              putDouble("height", dp(foldInView.height()))
            })
        }
      })
  }

  private fun dp(pixels: Int): Double = PixelUtil.toDIPFromPixel(pixels.toFloat()).toDouble()

  // getEventDispatcher(context), its replacement, does not exist in React Native 0.83.
  @Suppress("DEPRECATION")
  private fun dispatch(name: String, payload: WritableMap) {
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
      ?.dispatchEvent(ArrangementEvent(UIManagerHelper.getSurfaceId(this), id, name, payload))
  }

  private class ArrangementEvent(
    surfaceId: Int,
    viewId: Int,
    private val name: String,
    private val payload: WritableMap,
  ) : Event<ArrangementEvent>(surfaceId, viewId) {
    override fun getEventName(): String = name

    override fun getEventData(): WritableMap = payload
  }

  companion object {
    const val HINGE_EVENT = "topHingeChange"
    const val GEOMETRY_EVENT = "topGeometryChange"
    private const val CLOSED_DEGREES = 5f
  }
}
