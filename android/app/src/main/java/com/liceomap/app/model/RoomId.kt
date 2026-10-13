package com.liceomap.app.model

/** Shared identifier for Schedule -> Map -> future SVG element lookup; never coordinates. */
data class RoomId(val value: String) {
    init { require(value.isNotBlank()) }
}

data class RoomReference(val id: RoomId, val label: String)

/** Demonstration identities only. The SVG team will supply the official catalog and bindings. */
object DemoRooms {
    val rooms = listOf(
        RoomReference(RoomId("demo-a101"), "Sala A-101"),
        RoomReference(RoomId("demo-a102"), "Sala A-102"),
    )
    fun find(id: RoomId): RoomReference? = rooms.firstOrNull { it.id == id }
}
