package com.arrangementview

import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

/** Sends a direct event from this view to its React component. */
// getEventDispatcher(context), its replacement, does not exist in React Native 0.83.
@Suppress("DEPRECATION")
internal fun View.dispatchReactEvent(context: ReactContext, name: String, payload: WritableMap) {
  UIManagerHelper.getEventDispatcherForReactTag(context, id)
    ?.dispatchEvent(ReactEvent(UIManagerHelper.getSurfaceId(this), id, name, payload))
}

private class ReactEvent(
  surfaceId: Int,
  viewId: Int,
  private val name: String,
  private val payload: WritableMap,
) : Event<ReactEvent>(surfaceId, viewId) {
  override fun getEventName(): String = name

  override fun getEventData(): WritableMap = payload
}
