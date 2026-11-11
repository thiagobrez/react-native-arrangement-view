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
  private val book = FoldThreshold(halfOpenAtDegrees = 170.0, flatAtDegrees = 175.0)
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

  private fun FoldStates.sweep(vararg degrees: Double, fold: Fold = vertical): List<String> =
    degrees.map { angle ->
      readAngle(angle, setOf(book), listOf(fold))
      state(fold, book)
    }

  @Test
  fun `a fold turns half-open at 170 and flat again at 175`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(
      listOf("flat", "flat", "flat", "halfOpen", "halfOpen", "flat"),
      states.sweep(180.0, 175.0, 172.0, 170.0, 172.0, 175.0))
  }

  @Test
  fun `exactly 170 bends and exactly 175 releases`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(
      listOf("flat", "flat", "halfOpen", "halfOpen", "flat"),
      states.sweep(175.0, 170.0.nextUp(), 170.0, 175.0.nextDown(), 175.0))
  }

  @Test
  fun `a rotation at 172 starts over`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(listOf("flat", "halfOpen", "halfOpen"), states.sweep(180.0, 170.0, 172.0))

    states.update(setOf(book), listOf(horizontal))
    assertEquals("flat", states.state(horizontal, book))
    states.update(setOf(book), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))

    assertEquals(listOf("flat", "halfOpen"), states.sweep(172.0, 170.0))
  }

  @Test
  fun `a fold that turns takes the latest angle at once`() {
    val states = FoldStates(hasHingeSensor = true)
    states.sweep(180.0, 160.0)

    assertEquals(true, states.update(setOf(book), listOf(horizontal)))
    assertEquals("halfOpen", states.state(horizontal, book))
  }

  @Test
  fun `a reattach at 172 starts over`() {
    val states = FoldStates(hasHingeSensor = true)
    assertEquals(listOf("flat", "halfOpen", "halfOpen"), states.sweep(180.0, 170.0, 172.0))

    states.reset()
    states.update(emptySet(), listOf(vertical))
    states.update(setOf(book), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))

    assertEquals(listOf("flat", "halfOpen"), states.sweep(172.0, 170.0))
  }

  @Test
  fun `a threshold that leaves and comes back starts over, though another kept the sensor on`() {
    val states = FoldStates(hasHingeSensor = true)
    val tight = FoldThreshold(halfOpenAtDegrees = 150.0, flatAtDegrees = 160.0)
    states.readAngle(180.0, setOf(book, tight), listOf(vertical))
    states.readAngle(170.0, setOf(book, tight), listOf(vertical))
    states.readAngle(172.0, setOf(book, tight), listOf(vertical))
    assertEquals("halfOpen", states.state(vertical, book))

    states.update(setOf(tight), listOf(vertical))
    states.update(setOf(book, tight), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))
  }

  @Test
  fun `a fold reads flat after the sensor stops, until its next reading`() {
    val states = FoldStates(hasHingeSensor = true)
    states.sweep(180.0, 165.0)

    states.reset()
    states.update(setOf(book), listOf(vertical))
    assertEquals("flat", states.state(vertical, book))

    assertEquals(listOf("halfOpen"), states.sweep(165.0))
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
    states.readAngle(100.0, emptySet(), listOf(halfOpened))

    assertEquals("halfOpen", states.state(halfOpened, null))
    states.readAngle(160.0, emptySet(), listOf(vertical))
    assertEquals("flat", states.state(vertical, null))
  }

  @Test
  fun `each threshold keeps its own history, and says when it turns`() {
    val states = FoldStates(hasHingeSensor = true)
    val tight = FoldThreshold(halfOpenAtDegrees = 150.0, flatAtDegrees = 160.0)
    val both = setOf(book, tight)

    assertEquals(false, states.readAngle(180.0, both, listOf(vertical)))
    assertEquals(true, states.readAngle(165.0, both, listOf(vertical)))
    assertEquals("halfOpen", states.state(vertical, book))
    assertEquals("flat", states.state(vertical, tight))

    assertEquals(true, states.readAngle(150.0, both, listOf(vertical)))
    assertEquals(false, states.readAngle(155.0, both, listOf(vertical)))
    assertEquals(listOf("halfOpen", "halfOpen"), both.map { states.state(vertical, it) })
  }
}
