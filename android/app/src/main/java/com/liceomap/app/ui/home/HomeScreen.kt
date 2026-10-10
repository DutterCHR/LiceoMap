package com.liceomap.app.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.liceomap.app.domain.ScheduleClock
import com.liceomap.app.model.*
import com.liceomap.app.ui.components.*
import com.liceomap.app.ui.content.SchoolContentState
import com.liceomap.app.ui.navigation.AppDestination
import com.liceomap.app.ui.announcements.AnnouncementCard

@Composable
fun HomeScreen(
    session: DemoSession,
    content: SchoolContentState,
    nowMillis: Long,
    onNavigate: (AppDestination) -> Unit,
    onAnnouncement: (String) -> Unit,
    onRetry: () -> Unit,
) {
    LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text(session.studentName?.let { "Hola, $it" } ?: "Tu día en LiceoMap",
                style = MaterialTheme.typography.headlineLarge)
            Text(session.course, style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { DemoNotice() }
        item {
            when (val schedule = content.schedule) {
                LoadState.Loading -> StatusCard("Preparando tu día", "Cargando el horario…", loading = true)
                is LoadState.Error -> StatusCard("Horario no disponible", schedule.message, onRetry = onRetry)
                is LoadState.Ready -> {
                    val summary = ScheduleClock.summary(schedule.data, nowMillis)
                    val occurrence = summary.current ?: summary.next
                    if (occurrence == null) StatusCard("Sin clases programadas", "Aquí aparecerá tu próxima clase.")
                    else SchoolCard {
                        Text(if (summary.current != null) "En este momento" else "Próxima clase",
                            color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
                        Text(occurrence.lesson.subject, style = MaterialTheme.typography.headlineSmall)
                        Text(schoolDate(occurrence.startMillis) + " · " + occurrence.lesson.startTime + " – " + occurrence.lesson.endTime)
                        Text(occurrence.lesson.room)
                        FilledTonalButton(onClick = { onNavigate(AppDestination.SCHEDULE) }) { Text("Ver horario") }
                    }
                }
            }
        }
        item {
            Text("A un toque", style = MaterialTheme.typography.titleLarge)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(AppDestination.SCHEDULE to "Horarios", AppDestination.MAP to "Mapa",
                    AppDestination.ANNOUNCEMENTS to "Anuncios").forEach { (destination, label) ->
                    FilledTonalButton(onClick = { onNavigate(destination) }, modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 12.dp)) { Text(label) }
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Lo último", style = MaterialTheme.typography.titleLarge)
                TextButton(onClick = { onNavigate(AppDestination.ANNOUNCEMENTS) }) { Text("Ver todos") }
            }
        }
        when (val announcements = content.announcements) {
            LoadState.Loading -> item { StatusCard("Buscando novedades", "Cargando anuncios…", loading = true) }
            is LoadState.Error -> item { StatusCard("Anuncios no disponibles", announcements.message, onRetry = onRetry) }
            is LoadState.Ready -> {
                if (announcements.data.isEmpty()) item { StatusCard("Todo al día", "No hay anuncios publicados.") }
                announcements.data.take(2).forEach { announcement ->
                    item(key = announcement.id) {
                        AnnouncementCard(announcement) { onAnnouncement(announcement.id) }
                    }
                }
            }
        }
        item { OutlinedButton(onClick = { onNavigate(AppDestination.PROFILE) }, modifier = Modifier.fillMaxWidth()) { Text("Mi perfil") } }
    }
}
