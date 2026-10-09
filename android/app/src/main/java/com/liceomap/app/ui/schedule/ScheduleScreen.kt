package com.liceomap.app.ui.schedule

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

@Composable
fun ScheduleScreen(course: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("📅 Horario de Clases", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Mostrando información para: $course", color = Color.Gray)
    }
}
