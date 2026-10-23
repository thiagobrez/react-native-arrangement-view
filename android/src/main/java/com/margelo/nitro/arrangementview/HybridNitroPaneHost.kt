package com.margelo.nitro.arrangementview

import android.graphics.Color
import android.widget.FrameLayout
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.uimanager.ThemedReactContext

@Keep
@DoNotStrip
class HybridNitroPaneHost(context: ThemedReactContext) : HybridNitroPaneHostSpec() {
  override val view = FrameLayout(context)

  override var color: String = ""
    set(value) {
      field = value
      view.setBackgroundColor(Color.parseColor(value))
    }
}
