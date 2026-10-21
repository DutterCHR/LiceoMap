package com.liceomap.app.ui.map

/** Presentation state and gesture calculation, independent of Compose and Android. */
data class MapViewport(val scale: Float = 1f, val x: Float = 0f, val y: Float = 0f) {
    fun transform(panX: Float, panY: Float, zoom: Float) = copy(
        scale = (scale * zoom).coerceIn(0.8f, 3f),
        x = x + panX,
        y = y + panY,
    )
}
