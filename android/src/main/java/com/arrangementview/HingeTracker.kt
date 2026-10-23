package com.arrangementview

import android.content.Context
import android.graphics.Point
import android.graphics.RectF
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.View
import androidx.window.layout.FoldingFeature
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.RootViewUtil

/**
 * The hinge as one view's window sees it. The owner passes in the fold from its window's layout,
 * and reports when it is attached; the angle comes from the hinge angle sensor (Android 11+).
 * Detaching keeps the last state. Reattaching replays the current one, since WindowManager reports
 * the window's layout to a new listener and the sensor reports its value when registered; nothing
 * is reported until both have, so a fresh angle never pairs with a stale fold or the reverse.
 *
 * [fold] is the window's fold as WindowManager reports it. What goes out to JS is that fold only
 * while it separates the window, converted to the coordinates React Native measures in.
 */
internal class HingeTracker(private val view: View, private val emit: (WritableMap) -> Unit) :
  SensorEventListener {

  /** The window's fold, as WindowManager reports it. Owners set it from their window's layout. */
  var fold: FoldingFeature? = null
    set(value) {
      field = value
      awaitingLayout = false
      emitHinge()
    }

  private val sensorManager = view.context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val sensor: Sensor? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      sensorManager.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE)
    } else {
      null
    }
  private var attached = false
  private var awaitingLayout = false
  private var awaitingSensor = false
  private var degrees: Float? = null
  private var last: Sent? = null
  private var root: View? = null

  // React Native's window space moves with the root only when edge-to-edge is off, which is when
  // the insets it subtracts change.
  private val onRootLayout = View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> emitHinge() }

  /** Pass whether the owner will report its window's layout, which it can't without an activity. */
  fun attach(awaitLayout: Boolean) {
    attached = true
    awaitingLayout = awaitLayout
    root = RootViewUtil.getRootView(view) as? View
    root?.addOnLayoutChangeListener(onRootLayout)
    updateSensor()
  }

  fun detach() {
    attached = false
    sensorManager.unregisterListener(this)
    root?.removeOnLayoutChangeListener(onRootLayout)
    root = null
  }

  private fun updateSensor() {
    sensorManager.unregisterListener(this)
    if (attached && sensor != null) {
      // A sensor that has reported reports again when registered.
      awaitingSensor = degrees != null
      sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
    }
  }

  override fun onSensorChanged(event: SensorEvent) {
    degrees = event.values[0]
    awaitingSensor = false
    emitHinge()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  /**
   * The fold while it divides the window, in dp, in the coordinates `measureInWindow` and
   * `getBoundingClientRect()` use. WindowManager reports bounds in the window, and React Native
   * measures from its root's position in that window less the insets it doesn't cover.
   */
  private fun foldInReactWindow(): RectF? {
    val feature = fold?.takeIf { it.isSeparating } ?: return null
    val root = root ?: return null
    val inWindow = IntArray(2).also { root.getLocationInWindow(it) }
    val offset: Point = RootViewUtil.getViewportOffset(root)
    val bounds = feature.bounds
    return RectF(
      (bounds.left - inWindow[0] + offset.x).toFloat(),
      (bounds.top - inWindow[1] + offset.y).toFloat(),
      (bounds.right - inWindow[0] + offset.x).toFloat(),
      (bounds.bottom - inWindow[1] + offset.y).toFloat())
  }

  private fun toDp(rect: RectF): RectF =
    RectF(
      PixelUtil.toDIPFromPixel(rect.left),
      PixelUtil.toDIPFromPixel(rect.top),
      PixelUtil.toDIPFromPixel(rect.right),
      PixelUtil.toDIPFromPixel(rect.bottom))

  private data class Sent(val available: Boolean, val angle: Double, val status: String, val fold: RectF?)

  private fun emitHinge() {
    if (awaitingLayout || awaitingSensor) return
    val degrees = degrees
    val fold = fold
    // WindowManager names the open postures. It reports no fold for a closed device, whose app
    // runs on the cover display, so only there does the angle decide.
    val status =
      when {
        fold?.state == FoldingFeature.State.FLAT -> "fullyOpen"
        fold?.state == FoldingFeature.State.HALF_OPENED -> "partiallyOpen"
        degrees != null && degrees < CLOSED_DEGREES -> "closed"
        else -> "unknown"
      }
    val available = fold != null || sensor != null
    val radians = if (degrees != null) Math.toRadians(degrees.toDouble()) else Double.NaN
    // Codegen has no optional objects, so a fold that divides nothing is flagged and zeroed.
    val windowFold = foldInReactWindow()?.let { toDp(it) }
    val hinge = Sent(available, radians, status, windowFold)
    if (hinge == last) return
    last = hinge
    emit(
      Arguments.createMap().apply {
        putBoolean("available", available)
        putDouble("angle", radians)
        putString("status", status)
        putBoolean("hasFold", windowFold != null)
        putMap(
          "fold",
          Arguments.createMap().apply {
            putDouble("x", windowFold?.left?.toDouble() ?: 0.0)
            putDouble("y", windowFold?.top?.toDouble() ?: 0.0)
            putDouble("width", windowFold?.width()?.toDouble() ?: 0.0)
            putDouble("height", windowFold?.height()?.toDouble() ?: 0.0)
          })
      })
  }

  companion object {
    const val EVENT = "topHingeChange"
    private const val CLOSED_DEGREES = 5f
  }
}
