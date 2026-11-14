package com.arrangementview

import android.app.Activity
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import java.util.WeakHashMap

internal class WindowFolds private constructor(private val activity: Activity) :
  SensorEventListener {

  fun interface Listener {
    fun onWindowFoldsChanged()
  }

  var features: List<FoldingFeature>? = null
    private set

  private val sensorManager = activity.getSystemService(SensorManager::class.java)
  private val hingeSensor =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      sensorManager?.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE)
    } else {
      null
    }
  private val hasHingeSensor = hingeSensor != null
  private val states = FoldStates(hasHingeSensor)
  private var listening = false

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(activity))
  private val listeners = LinkedHashMap<Listener, FoldThreshold?>()
  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    features = info.displayFeatures.filterIsInstance<FoldingFeature>()
    update()
    notifyListeners()
  }

  fun subscribe(listener: Listener, threshold: FoldThreshold?) {
    if (listeners.isEmpty()) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(activity), onWindowLayout)
    }
    listeners[listener] = threshold
    update()
  }

  fun setThreshold(listener: Listener, threshold: FoldThreshold?) {
    if (!listeners.containsKey(listener)) return
    listeners[listener] = threshold
    update()
  }

  fun unsubscribe(listener: Listener) {
    if (!listeners.containsKey(listener)) return
    listeners.remove(listener)
    update()
    if (listeners.isNotEmpty()) return
    windowInfo.removeWindowLayoutInfoListener(onWindowLayout)
    windows.remove(activity)
  }

  fun state(feature: FoldingFeature, threshold: FoldThreshold?): String =
    states.state(feature, threshold)

  override fun onSensorChanged(event: SensorEvent) {
    val anyTurned = states.readAngle(event.values[0].toDouble(), thresholds(), features.orEmpty())
    if (anyTurned) notifyListeners()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  private fun update() {
    val thresholds = thresholds()
    val features = features.orEmpty()
    val listen = hingeSensor != null && thresholds.isNotEmpty() && features.isNotEmpty()
    if (listen != listening) {
      listening = listen
      if (listen) {
        sensorManager?.registerListener(this, hingeSensor, SensorManager.SENSOR_DELAY_UI)
      } else {
        sensorManager?.unregisterListener(this)
        states.reset()
      }
    }
    states.update(thresholds, features)
  }

  private fun thresholds(): Set<FoldThreshold> = listeners.values.filterNotNullTo(HashSet())

  private fun notifyListeners() = listeners.keys.toList().forEach { it.onWindowFoldsChanged() }

  companion object {
    private val windows = WeakHashMap<Activity, WindowFolds>()

    fun of(activity: Activity): WindowFolds = windows.getOrPut(activity) { WindowFolds(activity) }
  }
}

internal data class FoldThreshold(val halfOpenAtDegrees: Double, val flatAtDegrees: Double) {
  fun isHalfOpen(wasHalfOpen: Boolean, degrees: Double): Boolean =
    if (wasHalfOpen) degrees < flatAtDegrees else degrees <= halfOpenAtDegrees
}

internal data class FoldHistory(
  val threshold: FoldThreshold,
  val orientation: FoldingFeature.Orientation
)

internal class FoldStates(private val hasHingeSensor: Boolean) {
  private var degrees: Double? = null
  private val halfOpenHistories = HashSet<FoldHistory>()

  fun readAngle(
    degrees: Double,
    thresholds: Set<FoldThreshold>,
    features: List<FoldingFeature>
  ): Boolean {
    this.degrees = degrees
    return update(thresholds, features)
  }

  fun update(thresholds: Set<FoldThreshold>, features: List<FoldingFeature>): Boolean {
    val histories =
      thresholds.flatMapTo(HashSet()) { threshold ->
        features.map { FoldHistory(threshold, it.orientation) }
      }
    halfOpenHistories.retainAll(histories)
    return turnHistories(histories)
  }

  private fun turnHistories(histories: Set<FoldHistory>): Boolean {
    val degrees = degrees ?: return false
    var anyTurned = false
    for (history in histories) {
      val was = history in halfOpenHistories
      val now = history.threshold.isHalfOpen(was, degrees)
      if (now == was) continue
      anyTurned = true
      if (now) halfOpenHistories.add(history) else halfOpenHistories.remove(history)
    }
    return anyTurned
  }

  fun reset() {
    degrees = null
    halfOpenHistories.clear()
  }

  fun state(feature: FoldingFeature, threshold: FoldThreshold?): String {
    val isHalfOpen =
      if (threshold == null || !hasHingeSensor) {
        feature.state == FoldingFeature.State.HALF_OPENED
      } else {
        FoldHistory(threshold, feature.orientation) in halfOpenHistories
      }
    return if (isHalfOpen) "halfOpen" else "flat"
  }
}
