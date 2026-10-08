package expo.modules.gestureexclusion

import android.content.Context
import android.graphics.Rect
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView

class GestureExclusionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GestureExclusion")
    View(GestureExclusionView::class) {}
  }
}

/**
 * Keeps the system's edge gestures, such as back, off this view, so drags
 * that start near the screen edge reach it. Android applies it only within
 * 200 dp of each edge's height.
 */
class GestureExclusionView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      systemGestureExclusionRects = listOf(Rect(0, 0, right - left, bottom - top))
    }
  }
}
