package com.liceomap.app.ui.home

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.unit.sp
import com.liceomap.app.domain.LessonOccurrence
import com.liceomap.app.domain.ScheduleClock
import com.liceomap.app.model.Announcement
import com.liceomap.app.model.DemoSession
import com.liceomap.app.model.LoadState
import com.liceomap.app.ui.components.StatusCard
import com.liceomap.app.ui.components.schoolDate
import com.liceomap.app.ui.content.SchoolContentState
import com.liceomap.app.ui.navigation.AppDestination

private val Petroleum = Color(0xFF285659)
private val Accent = Color(0xFF87ABA6)
private val AccentSoft = Color(0xFFD7E9E6)
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
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { HomeHeader(session) }
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
            Spacer(Modifier.height(6.dp))
            QuickActions(onNavigate)
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SectionTitle("Novedades")
                TextButton(
                    onClick = { onNavigate(AppDestination.ANNOUNCEMENTS) },
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                ) {
                    Text("Ver todos", style = MaterialTheme.typography.labelLarge)
                }
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
    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(
            greeting,
            style = MaterialTheme.typography.headlineSmall.copy(fontSize = 21.sp, lineHeight = 27.sp),
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            "Curso ${session.course} · Demostración · Datos ficticios",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
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
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    if (isCurrent) "Clase actual" else "Próxima clase",
                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 13.sp),
                    color = Accent,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "${occurrence.lesson.startTime} - ${occurrence.lesson.endTime}",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.9f),
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Text(
                occurrence.lesson.subject,
                style = MaterialTheme.typography.headlineSmall.copy(fontSize = 23.sp, lineHeight = 29.sp),
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                Text(
                    schoolDate(occurrence.startMillis),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.88f),
                )
                Text(
                    occurrence.lesson.room,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Button(
                    onClick = onSchedule,
                    modifier = Modifier.weight(1f),
                    shape = HomeShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Petroleum,
                    ),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 10.dp),
                ) {
                    Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Ver horario")
                }
                Button(
                    onClick = onRoom,
                    modifier = Modifier.weight(1f),
                    shape = HomeShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AccentSoft,
                        contentColor = MainText,
                    ),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 10.dp),
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
        style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp),
        color = MaterialTheme.colorScheme.onBackground,
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
private fun QuickActions(onNavigate: (AppDestination) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(9.dp)) {
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
        tonalElevation = 0.dp,
        shadowElevation = 1.dp,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.55f)),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .height(88.dp)
                .padding(horizontal = 8.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Text(
                label,
                style = MaterialTheme.typography.labelLarge.copy(fontSize = 13.sp),
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
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(76.dp)
                    .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(2.dp)),
            )
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(
                    announcement.category,
                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp),
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    announcement.title,
                    style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp, lineHeight = 22.sp),
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
                Text(
                    schoolDate(announcement.publishedAt),
                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
