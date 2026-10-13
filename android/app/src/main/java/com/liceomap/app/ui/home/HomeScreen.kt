package com.liceomap.app.ui.home

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.liceomap.app.domain.LessonOccurrence
import com.liceomap.app.domain.ScheduleClock
import com.liceomap.app.model.Announcement
import com.liceomap.app.model.DemoSession
import com.liceomap.app.model.LoadState
import com.liceomap.app.ui.components.DemoNotice
import com.liceomap.app.ui.components.StatusCard
import com.liceomap.app.ui.components.schoolDate
import com.liceomap.app.ui.content.SchoolContentState
import com.liceomap.app.ui.navigation.AppDestination

private val Petroleum = Color(0xFF285659)
private val Accent = Color(0xFF87ABA6)
private val LightBackground = Color(0xFFF4F7F6)
private val MainText = Color(0xFF1D3032)
private val HomeShape = RoundedCornerShape(8.dp)

@Composable
fun HomeScreen(
    session: DemoSession,
    content: SchoolContentState,
    nowMillis: Long,
    onNavigate: (AppDestination) -> Unit,
    onAnnouncement: (String) -> Unit,
    onRetry: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { HomeHeader(session) }
        item { DemoNotice() }
        item {
            when (val schedule = content.schedule) {
                LoadState.Loading -> StatusCard("Preparando tu día", "Cargando el horario...", loading = true)
                is LoadState.Error -> StatusCard("Horario no disponible", schedule.message, onRetry = onRetry)
                is LoadState.Ready -> {
                    val summary = ScheduleClock.summary(schedule.data, nowMillis)
                    val occurrence = summary.current ?: summary.next
                    if (occurrence == null) {
                        StatusCard("Sin clases programadas", "Aquí aparecerá tu próxima clase.")
                    } else {
                        HeroClassCard(
                            occurrence = occurrence,
                            isCurrent = summary.current != null,
                            onSchedule = { onNavigate(AppDestination.SCHEDULE) },
                            onRoom = { onNavigate(AppDestination.MAP) },
                        )
                    }
                }
            }
        }
        item {
            SectionTitle("Accesos rápidos")
            Spacer(Modifier.height(8.dp))
            QuickActions(onNavigate)
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SectionTitle("Novedades")
                TextButton(onClick = { onNavigate(AppDestination.ANNOUNCEMENTS) }) { Text("Ver todos") }
            }
        }
        when (val announcements = content.announcements) {
            LoadState.Loading -> item { StatusCard("Buscando novedades", "Cargando anuncios...", loading = true) }
            is LoadState.Error -> item { StatusCard("Anuncios no disponibles", announcements.message, onRetry = onRetry) }
            is LoadState.Ready -> {
                if (announcements.data.isEmpty()) {
                    item { StatusCard("Todo al día", "No hay anuncios publicados.") }
                }
                announcements.data.take(2).forEach { announcement ->
                    item(key = announcement.id) {
                        CompactAnnouncementCard(announcement) { onAnnouncement(announcement.id) }
                    }
                }
            }
        }
        item {
            OutlinedButton(
                onClick = { onNavigate(AppDestination.PROFILE) },
                modifier = Modifier.fillMaxWidth(),
                shape = HomeShape,
            ) {
                Text("Mi perfil")
            }
        }
    }
}

@Composable
private fun HomeHeader(session: DemoSession) {
    val greeting = session.studentName?.let { "Hola, $it" } ?: "Tu día en LiceoMap"
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            "LiceoMap",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            greeting,
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            "Curso ${session.course}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun HeroClassCard(
    occurrence: LessonOccurrence,
    isCurrent: Boolean,
    onSchedule: () -> Unit,
    onRoom: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize(),
        shape = HomeShape,
        colors = CardDefaults.cardColors(containerColor = Petroleum, contentColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    if (isCurrent) "Clase actual" else "Próxima clase",
                    style = MaterialTheme.typography.labelLarge,
                    color = Accent,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "${occurrence.lesson.startTime} - ${occurrence.lesson.endTime}",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White.copy(alpha = 0.86f),
                )
            }
            Text(
                occurrence.lesson.subject,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    schoolDate(occurrence.startMillis),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.86f),
                )
                Text(
                    occurrence.lesson.room,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onSchedule,
                    shape = HomeShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Petroleum,
                    ),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                ) {
                    Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Ver horario")
                }
                FilledTonalButton(
                    onClick = onRoom,
                    shape = HomeShape,
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = Accent,
                        contentColor = MainText,
                    ),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Ver sala")
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onBackground,
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
private fun QuickActions(onNavigate: (AppDestination) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        QuickAction(
            label = "Horarios",
            icon = Icons.Default.Schedule,
            modifier = Modifier.weight(1f),
            onClick = { onNavigate(AppDestination.SCHEDULE) },
        )
        QuickAction(
            label = "Mapa",
            icon = Icons.Default.Map,
            modifier = Modifier.weight(1f),
            onClick = { onNavigate(AppDestination.MAP) },
        )
        QuickAction(
            label = "Anuncios",
            icon = Icons.Default.Campaign,
            modifier = Modifier.weight(1f),
            onClick = { onNavigate(AppDestination.ANNOUNCEMENTS) },
        )
    }
}

@Composable
private fun QuickAction(
    label: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val background by animateColorAsState(
        targetValue = if (MaterialTheme.colorScheme.background == LightBackground) {
            Color.White
        } else {
            MaterialTheme.colorScheme.surfaceContainerHigh
        },
        label = "quickActionBackground",
    )
    Surface(
        modifier = modifier
            .clip(HomeShape)
            .clickable(onClick = onClick),
        shape = HomeShape,
        color = background,
        tonalElevation = 1.dp,
        shadowElevation = 0.dp,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.size(19.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Text(
                label,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun CompactAnnouncementCard(announcement: Announcement, onOpen: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen)
            .animateContentSize(),
        shape = HomeShape,
        colors = CardDefaults.cardColors(
            containerColor = if (MaterialTheme.colorScheme.background == LightBackground) {
                Color.White
            } else {
                MaterialTheme.colorScheme.surfaceContainerHigh
            },
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                "${announcement.category} - ${schoolDate(announcement.publishedAt)}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                announcement.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                announcement.body,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}
