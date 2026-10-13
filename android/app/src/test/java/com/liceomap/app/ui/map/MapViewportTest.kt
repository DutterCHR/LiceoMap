package com.liceomap.app.ui.map

import org.junit.Assert.assertEquals
import org.junit.Test

class MapViewportTest {
    @Test
    fun zoomAccumulatesAndPanAddsBothCoordinates() {
        val result = MapViewport().transform(12f, -8f, 1.5f).transform(-2f, 3f, 1.2f)
        assertEquals(1.8f, result.scale, 0.0001f)
        assertEquals(10f, result.x, 0.0001f)
        assertEquals(-5f, result.y, 0.0001f)
    }

    @Test
    fun zoomCannotExceedOriginalMaximumButPanStillApplies() {
        val result = MapViewport(scale = 2f).transform(5f, 7f, 10f)
        assertEquals(3f, result.scale, 0f)
        assertEquals(5f, result.x, 0f)
        assertEquals(7f, result.y, 0f)
    }

    @Test
    fun zoomCannotDropBelowOriginalMinimum() {
        assertEquals(0.8f, MapViewport().transform(0f, 0f, 0.1f).scale, 0f)
    }

    @Test
    fun transformDoesNotChangePreviousState() {
        val original = MapViewport(scale = 2f, x = 4f, y = 6f)
        original.transform(10f, 20f, 1.1f)
        assertEquals(MapViewport(scale = 2f, x = 4f, y = 6f), original)
    }
}
