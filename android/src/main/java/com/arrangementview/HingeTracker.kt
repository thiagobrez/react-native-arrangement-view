package com.arrangementview

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import androidx.window.layout.FoldingFeature
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

/**
 * The hinge as one view's window sees it. The owner passes in the fold from its window's layout,
 * and reports when it is attached; the angle comes from the hinge angle sensor (Android 11+).
 * Detaching keeps the last state. Reattaching replays the current one, since WindowManager reports
 * the window's layout to a new listener and the sensor reports its value when registered; nothing
 * is reported until both have, so a fresh angle never pairs with a stale fold or the reverse.
 */
internal class HingeTracker(context: Context, private val emit: (WritableMap) -> Unit) :
  SensorEventListener {

  var enabled = true
    set(value) {
      if (field == value) return
      field = value
      updateSensor()
      // JS resets to unavailable when disabled; re-enabling must replay the current state.
      last = null
      emitHinge()
    }

  var fold: FoldingFeature? = null
    set(value) {
      field = value
      awaitingLayout = false
      emitHinge()
    }

  private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
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
  private var last: Triple<Boolean, Double, String>? = null

  /** Pass whether the owner will report its window's layout, which it can't without an activity. */
  fun attach(awaitLayout: Boolean) {
    attached = true
    awaitingLayout = awaitLayout
    updateSensor()
  }

  fun detach() {
    attached = false
    sensorManager.unregisterListener(this)
  }

  private fun updateSensor() {
    sensorManager.unregisterListener(this)
    if (enabled && attached && sensor != null) {
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

  /** Reports the current state when it differs from the last one reported. */
  private fun emitHinge() {
    if (!enabled || awaitingLayout || awaitingSensor) return
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
    val hinge = Triple(available, radians, status)
    if (hinge == last) return
    last = hinge
    emit(
      Arguments.createMap().apply {
        putBoolean("available", available)
        putDouble("angle", radians)
        putString("status", status)
      })
  }

  companion object {
    const val EVENT = "topHingeChange"
    private const val CLOSED_DEGREES = 5f
  }
}
