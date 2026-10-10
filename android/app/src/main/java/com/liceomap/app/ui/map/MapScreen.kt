package com.liceomap.app.ui.map

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liceomap.app.model.DemoMap
import com.liceomap.app.model.MapRegionKind
import com.liceomap.app.model.RoomId
import com.liceomap.app.model.DemoRooms
import androidx.compose.material3.MaterialTheme

private val MapViewportSaver = listSaver<MapViewport, Float>(
    save = { listOf(it.scale, it.x, it.y) },
    restore = { MapViewport(scale = it[0], x = it[1], y = it[2]) },
)

@Composable
fun MapScreen(map: DemoMap, selectedRoom: RoomId? = null) {
    var viewport by rememberSaveable(stateSaver = MapViewportSaver) {
        mutableStateOf(MapViewport())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .clipToBounds()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    viewport = viewport.transform(pan.x, pan.y, zoom)
                }
            }
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    scaleX = viewport.scale,
                    scaleY = viewport.scale,
                    translationX = viewport.x,
                    translationY = viewport.y
                )
        ) {
            for (region in map.regions) {
                drawRect(
                    color = when (region.kind) {
                        MapRegionKind.COURTYARD -> Color(0xFFE2E8F0)
                        MapRegionKind.CLASSROOMS -> Color(0xFF0A2540)
                        MapRegionKind.LABORATORIES -> Color(0xFF1E3A8A)
                        MapRegionKind.GYM -> Color(0xFF059669)
                    },
                    topLeft = Offset(size.width * region.x, size.height * region.y),
                    size = Size(size.width * region.width, size.height * region.height)
                )
            }
            drawCircle(
                color = Color(0xFFDC2626),
                radius = 18f,
                center = Offset(size.width * map.markerX, size.height * map.markerY)
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.95f), RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Text(selectedRoom?.let { DemoRooms.find(it)?.label ?: "Sala no registrada: ${it.value}" }
                ?: "Mapa de demostración", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text("Esquema ficticio · Ubicación exacta pendiente del SVG", fontSize = 12.sp)
            Text("Pellizca para zoom o arrastra para mover", fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
