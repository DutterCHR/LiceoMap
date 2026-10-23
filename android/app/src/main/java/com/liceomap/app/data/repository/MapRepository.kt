package com.liceomap.app.data.repository

import com.liceomap.app.model.SvgMap

/** Future SVG source; implementations may report loading failures with exceptions. */
interface MapRepository {
    suspend fun loadMap(): SvgMap
}
