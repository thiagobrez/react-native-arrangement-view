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

/**
 * An activity window's folds, from one WindowManager listener that every observer in it shares,
 * and their states, from the hinge angle sensor while an observer there has a fold threshold.
 */
internal class WindowFolds private constructor(private val activity: Activity) :
  SensorEventListener {

  fun interface Listener {
    fun onWindowFoldsChanged()
  }

  /** In WindowManager's order and the window's pixels. Null until WindowManager reports the window's layout. */
  var features: List<FoldingFeature>? = null
    private set

  private val sensorManager = activity.getSystemService(SensorManager::class.java)
  private val hingeSensor =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      sensorManager?.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE)
    } else {
      null
    }
  val hasHingeSensor = hingeSensor != null
  private val states = FoldStates(hasHingeSensor)
  private var listening = false

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(activity))
  private val listeners = LinkedHashMap<Listener, FoldThreshold?>()
  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    features = info.displayFeatures.filterIsInstance<FoldingFeature>()
    update()
    notifyListeners()
  }

  /** Adds the listener, or changes the threshold it reads its folds' states with. */
  fun subscribe(listener: Listener, threshold: FoldThreshold?) {
    if (listeners.isEmpty()) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(activity), onWindowLayout)
    }
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
    if (states.read(event.values[0], thresholds(), features.orEmpty())) notifyListeners()
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

internal data class FoldThreshold(val halfOpenAtDegrees: Float, val flatAtDegrees: Float) {
  fun isHalfOpen(wasHalfOpen: Boolean, degrees: Float): Boolean =
    if (wasHalfOpen) degrees < flatAtDegrees else degrees <= halfOpenAtDegrees
}

/**
 * The states of one window's folds. A fold reads WindowManager's state, or under a threshold on a
 * device with a hinge angle sensor, a history of the angle. There is one history per threshold and
 * fold orientation, so a fold that turns starts over.
 */
internal class FoldStates(private val hasHingeSensor: Boolean) {
  private var degrees: Float? = null
  private val halfOpen = HashSet<Pair<FoldThreshold, FoldingFeature.Orientation>>()

  /** Takes a reading from the hinge angle sensor. Returns whether a history turned. */
  fun read(degrees: Float, thresholds: Set<FoldThreshold>, features: List<FoldingFeature>): Boolean {
    this.degrees = degrees
    return update(thresholds, features)
  }

  /**
   * Drops the histories that no threshold and fold orientation need any more, so one that comes back
   * starts flat. Returns whether a history turned.
   */
  fun update(thresholds: Set<FoldThreshold>, features: List<FoldingFeature>): Boolean {
    val histories = thresholds.flatMap { threshold -> features.map { threshold to it.orientation } }
    halfOpen.retainAll(histories.toSet())
    val degrees = degrees ?: return false
    var turned = false
    for (history in histories) {
      val was = history in halfOpen
      val now = history.first.isHalfOpen(was, degrees)
      if (now == was) continue
      turned = true
      if (now) halfOpen.add(history) else halfOpen.remove(history)
    }
    return turned
  }

  /** Forgets the angle and every history, since the hinge can move while nothing listens. */
  fun reset() {
    degrees = null
    halfOpen.clear()
  }

  fun state(feature: FoldingFeature, threshold: FoldThreshold?): String {
    val isHalfOpen =
      if (threshold == null || !hasHingeSensor) {
        feature.state == FoldingFeature.State.HALF_OPENED
      } else {
        (threshold to feature.orientation) in halfOpen
      }
    return if (isHalfOpen) "halfOpen" else "flat"
  }
}
