package com.arrangementview

import android.graphics.Point
import android.graphics.Rect
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.WindowSdkExtensions
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Android has no system arrangement container, so this view measures what the pane policy in
 * cpp/arrange.h needs: its content box, its window's size, the fold crossing it, and the writing
 * direction. Its shadow node places the panes from that, without a React render. It also reports
 * the hinge.
 */
class ArrangementView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {

  private val hinge = HingeTracker(reactContext) { dispatchReactEvent(reactContext, HingeTracker.EVENT, it) }

  private val windowInfo = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(reactContext))

  private var fold: FoldingFeature? = null

  private val rtl = I18nUtil.instance.isRTL(reactContext)
  private val swapLeftAndRight = I18nUtil.instance.doLeftAndRightSwapInRTL(reactContext)

  private val paddingAndBorder = Rect()

  internal var stateWrapper: StateWrapper? = null

  // Called during a mount, so it only records; the next pre-draw pushes what moved.
  fun setPaddingAndBorder(left: Int, top: Int, right: Int, bottom: Int) {
    paddingAndBorder.set(left, top, right, bottom)
    invalidate()
  }

  private var hasWindowLayout = false
  private var pushedGeometry: List<Any?>? = null

  private val onWindowLayout = Consumer<WindowLayoutInfo> { info ->
    fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
    hasWindowLayout = true
    pushGeometry()
    hinge.fold = fold
  }

  // Fabric positions views without a layout pass, so ancestors can move this view without any
  // callback reaching it.
  private val onPreDraw = ViewTreeObserver.OnPreDrawListener {
    pushGeometry()
    true
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val activity = reactContext.currentActivity
    hinge.attach(awaitLayout = activity != null)
    if (activity != null) {
      windowInfo.addWindowLayoutInfoListener(
        activity, ContextCompat.getMainExecutor(reactContext), onWindowLayout)
      // The listener first hears from WindowManager after the first frame, which would draw the
      // panes hidden.
      if (WindowSdkExtensions.getInstance().extensionVersion >= 9) {
        fold =
          WindowInfoTracker.getOrCreate(activity)
            .getCurrentWindowLayoutInfo(activity)
            .displayFeatures
            .filterIsInstance<FoldingFeature>()
            .firstOrNull()
        hasWindowLayout = true
      }
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

  private fun pushGeometry() {
    if (!hasWindowLayout) return
    val stateWrapper = stateWrapper ?: return
    val fold = fold
    val contentBox =
      Rect(
        paddingAndBorder.left,
        paddingAndBorder.top,
        width - paddingAndBorder.right,
        height - paddingAndBorder.bottom)
    val foldInContent =
      if (fold != null) {
        val position = untransformedPositionInWindow()
        Rect(fold.bounds).apply {
          offset(-position.x - contentBox.left, -position.y - contentBox.top)
        }
      } else {
        Rect()
      }
    val window = rootView
    val geometry =
      listOf(
        contentBox.width(),
        contentBox.height(),
        window.width,
        window.height,
        foldInContent,
        fold?.orientation,
        fold?.isSeparating,
        fold?.state)
    if (geometry == pushedGeometry) return
    pushedGeometry = geometry
    ArrangementStateBridge.update(
      stateWrapper,
      dp(contentBox.width()),
      dp(contentBox.height()),
      dp(window.width),
      dp(window.height),
      hasFold = fold != null,
      foldX = dp(foldInContent.left),
      foldY = dp(foldInContent.top),
      foldWidth = dp(foldInContent.width()),
      foldHeight = dp(foldInContent.height()),
      foldVertical = fold?.orientation == FoldingFeature.Orientation.VERTICAL,
      foldSeparating = fold?.isSeparating == true,
      foldHalfOpened = fold?.state == FoldingFeature.State.HALF_OPENED,
      rtl = rtl,
      swapLeftAndRight = swapLeftAndRight)
  }

  private fun dp(pixels: Int): Double = PixelUtil.toDIPFromPixel(pixels.toFloat()).toDouble()
}

private fun View.untransformedPositionInWindow(): Point {
  val position = Point(left, top)
  var ancestor = parent as? View
  while (ancestor != null) {
    position.offset(ancestor.left - ancestor.scrollX, ancestor.top - ancestor.scrollY)
    ancestor = ancestor.parent as? View
  }
  return position
}
