package com.arrangementview

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.View
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext

internal class HingeTracker(
  private val view: View,
  private val reactContext: ReactContext,
  private val onWindowLayout: (FoldingFeature?) -> Unit = {},
) : SensorEventListener {

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(reactContext))
  private val sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val sensor: Sensor? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      sensorManager.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE)
    } else {
      null
    }
  private var fold: FoldingFeature? = null
  private var awaitingLayout = false
  private var awaitingSensor = false
  private var degrees: Float? = null
  private var last: Triple<Boolean, Double, String>? = null

  private val windowLayoutListener = Consumer<WindowLayoutInfo> { info ->
    fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
    awaitingLayout = false
    onWindowLayout(fold)
    emitHinge()
  }

  fun attach() {
    val activity = reactContext.currentActivity
    awaitingLayout = activity != null
    if (sensor != null) {
      // A sensor that has reported reports again when registered.
      awaitingSensor = degrees != null
      sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
    }
    if (activity != null) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(reactContext), windowLayoutListener)
    }
  }

  fun detach() {
    windowInfo.removeWindowLayoutInfoListener(windowLayoutListener)
    sensorManager.unregisterListener(this)
  }

  override fun onSensorChanged(event: SensorEvent) {
    degrees = event.values[0]
    awaitingSensor = false
    emitHinge()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  private fun emitHinge() {
    // When attach() adds the window layout listener, nothing goes out until the first layout
    // arrives, so a fresh angle never pairs with a stale fold. When the sensor has reported before,
    // nothing goes out until it reports again, so a fresh fold never pairs with a stale angle.
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
    val hinge = Triple(available, radians, status)
    if (hinge == last) return
    last = hinge
    view.dispatchReactEvent(
      reactContext,
      EVENT,
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
