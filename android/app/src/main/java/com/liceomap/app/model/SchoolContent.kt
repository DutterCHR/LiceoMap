package com.liceomap.app.model

data class Schedule(val course: String, val lessons: List<Lesson>) {
    init {
        require(course.isNotBlank())
        lessons.groupBy { it.dayOfWeek }.values.forEach { day ->
            require(day.sortedBy { it.startTime }.zipWithNext().all { (a, b) -> a.endTime <= b.startTime }) {
                "Overlapping lessons"
            }
        }
    }
}

data class Lesson(
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val subject: String,
    val room: String,
    val roomId: RoomId = RoomId(room),
) {
    init {
        val time = Regex("(?:[01][0-9]|2[0-3]):[0-5][0-9]")
        require(dayOfWeek in 1..7 && time.matches(startTime) && time.matches(endTime))
        require(startTime < endTime && subject.isNotBlank() && room.isNotBlank())
    }
}

data class Announcement(
    val id: String, val title: String, val body: String,
    val category: String = "General", val publishedAt: Long = 0L,
) {
    init { require(id.isNotBlank() && title.isNotBlank() && body.isNotBlank() && publishedAt >= 0L) }
}

/** Asset reference for a future SVG renderer; no renderer is implemented in M01. */
data class SvgRoomBinding(val roomId: RoomId, val elementId: String) {
    init { require(elementId.isNotBlank()) }
}

data class SvgMap(val assetPath: String, val rooms: List<SvgRoomBinding> = emptyList()) {
    init { require(assetPath.isNotBlank() && rooms.map { it.roomId }.distinct().size == rooms.size) }
    fun elementFor(room: RoomId): String? = rooms.firstOrNull { it.roomId == room }?.elementId
}

enum class MapRegionKind { COURTYARD, CLASSROOMS, LABORATORIES, GYM }

/** Coordinates and dimensions relative to the canvas, independent of Compose. */
data class MapRegion(
    val kind: MapRegionKind,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
)

data class DemoMap(
    val regions: List<MapRegion>,
    val room: String,
    val pavilion: String,
    val markerX: Float,
    val markerY: Float,
)
