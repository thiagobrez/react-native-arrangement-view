package com.arrangementview

import android.graphics.Rect
import androidx.window.layout.FoldingFeature
import androidx.window.layout.FoldingFeature.Orientation
import androidx.window.layout.FoldingFeature.State
import kotlin.math.nextDown
import kotlin.math.nextUp
import org.junit.Assert.assertEquals
import org.junit.Test

class FoldStatesTest {
  private val book = FoldThreshold(halfOpenAtDegrees = 170f, flatAtDegrees = 175f)
  private val vertical = Fold(Orientation.VERTICAL)
  private val horizontal = Fold(Orientation.HORIZONTAL)

  private class Fold(
    override val orientation: Orientation,
    override val state: State = State.FLAT,
  ) : FoldingFeature {
    override val bounds: Rect
      get() = throw UnsupportedOperationException()

    override val isSeparating = state == State.HALF_OPENED
    override val occlusionType = FoldingFeature.OcclusionType.NONE
  }

  private fun FoldStates.sweep(vararg degrees: Float, fold: Fold = vertical): List<String> =
    degrees.map { angle ->
      read(angle, setOf(book), listOf(fold))
      state(fold, book)
    }

  @Test
  fun `a fold turns half-open at 170 and flat again at 175`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(
      listOf("flat", "flat", "flat", "halfOpen", "halfOpen", "flat"),
      states.sweep(180f, 175f, 172f, 170f, 172f, 175f))
  }

  @Test
  fun `exactly 170 bends and exactly 175 releases`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(
      listOf("flat", "flat", "halfOpen", "halfOpen", "flat"),
      states.sweep(175f, 170f.nextUp(), 170f, 175f.nextDown(), 175f))
  }

  @Test
  fun `a rotation at 172 starts over`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(listOf("flat", "halfOpen", "halfOpen"), states.sweep(180f, 170f, 172f))

    states.update(setOf(book), listOf(horizontal))
    assertEquals("flat", states.state(horizontal, book))
    states.update(setOf(book), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))

    assertEquals(listOf("flat", "halfOpen"), states.sweep(172f, 170f))
  }

  @Test
  fun `a fold that turns takes the latest angle at once`() {
    val states = FoldStates(hasHingeSensor = true)
    states.sweep(180f, 160f)

    assertEquals(true, states.update(setOf(book), listOf(horizontal)))
    assertEquals("halfOpen", states.state(horizontal, book))
  }

  @Test
  fun `a reattach at 172 starts over`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(listOf("flat", "halfOpen", "halfOpen"), states.sweep(180f, 170f, 172f))

    states.reset()
    states.update(emptySet(), listOf(vertical))
    states.update(setOf(book), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))

    assertEquals(listOf("flat", "halfOpen"), states.sweep(172f, 170f))
  }

  @Test
  fun `a threshold that leaves and comes back starts over, though another kept the sensor on`() {
    val states = FoldStates(hasHingeSensor = true)
    val tight = FoldThreshold(halfOpenAtDegrees = 150f, flatAtDegrees = 160f)
    states.read(180f, setOf(book, tight), listOf(vertical))
    states.read(170f, setOf(book, tight), listOf(vertical))
    states.read(172f, setOf(book, tight), listOf(vertical))
    assertEquals("halfOpen", states.state(vertical, book))

    states.update(setOf(tight), listOf(vertical))
    states.update(setOf(book, tight), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))
  }

  @Test
  fun `a fold reads flat after the sensor stops, until its next reading`() {
    val states = FoldStates(hasHingeSensor = true)
    states.sweep(180f, 165f)

    states.reset()
    states.update(setOf(book), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))

    assertEquals(listOf("halfOpen"), states.sweep(165f))
  }

  @Test
  fun `without a hinge angle sensor a fold reads WindowManager's state`() {
    val states = FoldStates(hasHingeSensor = false)
    val halfOpened = Fold(Orientation.VERTICAL, State.HALF_OPENED)
    states.update(setOf(book), listOf(halfOpened))

    assertEquals("halfOpen", states.state(halfOpened, book))
    assertEquals("flat", states.state(vertical, book))
  }

  @Test
  fun `without a threshold a fold reads WindowManager's state`() {
    val states = FoldStates(hasHingeSensor = true)
    val halfOpened = Fold(Orientation.VERTICAL, State.HALF_OPENED)
    states.read(100f, emptySet(), listOf(halfOpened))

    assertEquals("halfOpen", states.state(halfOpened, null))
    states.read(160f, emptySet(), listOf(vertical))
    assertEquals("flat", states.state(vertical, null))
  }

  @Test
  fun `each threshold keeps its own history, and says when it turns`() {
    val states = FoldStates(hasHingeSensor = true)
    val tight = FoldThreshold(halfOpenAtDegrees = 150f, flatAtDegrees = 160f)
    val both = setOf(book, tight)

    assertEquals(false, states.read(180f, both, listOf(vertical)))
    assertEquals(true, states.read(165f, both, listOf(vertical)))
    assertEquals("halfOpen", states.state(vertical, book))
    assertEquals("flat", states.state(vertical, tight))

    assertEquals(true, states.read(150f, both, listOf(vertical)))
    assertEquals(false, states.read(155f, both, listOf(vertical)))
    assertEquals(listOf("halfOpen", "halfOpen"), both.map { states.state(vertical, it) })
  }
}
