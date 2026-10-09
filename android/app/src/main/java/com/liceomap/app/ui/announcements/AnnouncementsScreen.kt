package com.liceomap.app.ui.announcements

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

@Composable
fun AnnouncementsScreen() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("🔔 Avisos y Notificaciones", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Comunicados oficiales del Liceo en tiempo real.", color = Color.Gray)
    }
}
