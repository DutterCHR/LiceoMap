package com.liceomap.app.model

data class Schedule(val course: String, val lessons: List<Lesson>)

data class Lesson(
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val subject: String,
    val room: String,
)

data class Announcement(val id: String, val title: String, val body: String)

/** Asset reference for a future SVG renderer; no renderer is implemented in M01. */
data class SvgMap(val assetPath: String)

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
