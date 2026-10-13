package com.liceomap.app.data.demo

import com.liceomap.app.model.DemoMap
import com.liceomap.app.model.DemoSession
import com.liceomap.app.model.MapRegion
import com.liceomap.app.model.MapRegionKind

/** The original prototype content. No remote service or real school data is queried. */
object DemoData {
    val session = DemoSession(course = "3° Medio A")
    val map = DemoMap(
        regions = listOf(
            MapRegion(MapRegionKind.COURTYARD, 0.15f, 0.20f, 0.70f, 0.55f),
            MapRegion(MapRegionKind.CLASSROOMS, 0.15f, 0.15f, 0.70f, 0.08f),
            MapRegion(MapRegionKind.LABORATORIES, 0.15f, 0.75f, 0.70f, 0.08f),
            MapRegion(MapRegionKind.GYM, 0.70f, 0.30f, 0.15f, 0.35f),
        ),
        room = session.course,
        pavilion = "Pabellón A",
        markerX = 0.35f,
        markerY = 0.19f,
    )
}
