package com.liceomap.app.model
import org.junit.Assert.*
import org.junit.Test
class SvgMapTest {
    @Test fun onlyExplicitBindingsResolveRoomWithoutInventingCoordinates() {
        val map = SvgMap("future.svg", listOf(SvgRoomBinding(RoomId("demo-a101"), "room-a101")))
        assertEquals("room-a101", map.elementFor(RoomId("demo-a101")))
        assertNull(map.elementFor(RoomId("missing")))
        assertNull(SvgMap("future.svg").elementFor(RoomId("demo-a101")))
    }
}
