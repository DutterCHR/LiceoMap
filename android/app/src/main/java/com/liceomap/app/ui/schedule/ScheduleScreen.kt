package com.liceomap.app.ui.schedule

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.liceomap.app.domain.ScheduleClock
import com.liceomap.app.model.*
import com.liceomap.app.ui.components.*

@Composable
fun ScheduleScreen(
    course: String,
    schedule: LoadState<Schedule>,
    selectedDay: Int,
    nowMillis: Long,
    onDaySelected: (Int) -> Unit,
    onRoomSelected: (RoomId) -> Unit,
    onRetry: () -> Unit,
) {
    LazyColumn(modifier = Modifier.testTag("schedule-list"), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text("Tu semana", style = MaterialTheme.typography.headlineLarge)
            Text(course, style = MaterialTheme.typography.titleMedium)
        }
        item { DemoNotice() }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items((1..7).toList()) { day ->
                    FilterChip(selected = day == selectedDay, onClick = { onDaySelected(day) },
                        label = { Text(SchoolDays[day - 1]) }, modifier = Modifier.testTag("day-$day"))
                }
            }
        }
        when (schedule) {
            LoadState.Loading -> item { StatusCard("Cargando horario", "Preparando tus clases…", loading = true) }
            is LoadState.Error -> item { StatusCard("Horario no disponible", schedule.message, onRetry = onRetry) }
            is LoadState.Ready -> {
                val lessons = schedule.data.lessons.filter { it.dayOfWeek == selectedDay }.sortedBy { it.startTime }
                val current = ScheduleClock.summary(schedule.data, nowMillis).current?.lesson
                if (lessons.isEmpty()) item { StatusCard("Sin clases este día", "Disfruta tu tiempo libre. Revisa otro día de la semana.") }
                items(lessons, key = { "${it.dayOfWeek}-${it.startTime}-${it.subject}" }) { lesson ->
                    SchoolCard {
                        if (lesson == current) Text("Clase actual", color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelLarge)
                        Text("${lesson.startTime} – ${lesson.endTime}", style = MaterialTheme.typography.labelLarge)
                        Text(lesson.subject, style = MaterialTheme.typography.titleLarge)
                        Text(lesson.room)
                        OutlinedButton(onClick = { onRoomSelected(lesson.roomId) },
                            modifier = Modifier.testTag("room-${lesson.roomId.value}-${lesson.startTime}")) {
                            Text("Ver sala en mapa")
                        }
                    }
                }
            }
        }
    }
}
