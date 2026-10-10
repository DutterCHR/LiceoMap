package com.liceomap.app.ui.announcements

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.liceomap.app.domain.*
import com.liceomap.app.model.*
import com.liceomap.app.ui.components.*

@Composable
fun AnnouncementCard(announcement: Announcement, onOpen: () -> Unit) {
    SchoolCard {
        Text("${announcement.category} · ${schoolDate(announcement.publishedAt)}",
            style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        Text(announcement.title, style = MaterialTheme.typography.titleLarge)
        Text(announcement.body, maxLines = 2, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
        TextButton(onClick = onOpen, modifier = Modifier.testTag("announcement-${announcement.id}")) { Text("Leer anuncio") }
    }
}

@Composable
fun AnnouncementsScreen(
    announcements: LoadState<List<Announcement>>,
    category: String?,
    order: AnnouncementOrder,
    onCategoryChanged: (String?) -> Unit,
    onOrderChanged: (AnnouncementOrder) -> Unit,
    onOpen: (String) -> Unit,
    onRetry: () -> Unit,
) {
    LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { Text("Comunidad al día", style = MaterialTheme.typography.headlineLarge) }
        item { DemoNotice() }
        when (announcements) {
            LoadState.Loading -> item { StatusCard("Cargando anuncios", "Buscando novedades…", loading = true) }
            is LoadState.Error -> item { StatusCard("No pudimos cargar los anuncios", announcements.message, onRetry = onRetry) }
            is LoadState.Ready -> {
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item { FilterChip(category == null, { onCategoryChanged(null) }, label = { Text("Todos") }) }
                        items(announcements.data.map { it.category }.distinct().sorted()) { label ->
                            FilterChip(category == label, { onCategoryChanged(label) }, label = { Text(label) })
                        }
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AnnouncementOrder.entries.forEach { sort ->
                            FilterChip(order == sort, { onOrderChanged(sort) }, label = { Text(sort.label) })
                        }
                    }
                }
                val visible = AnnouncementQuery.select(announcements.data, category, order)
                if (visible.isEmpty()) item { StatusCard("Sin anuncios", "No hay publicaciones para esta selección.") }
                items(visible, key = { it.id }) { item -> AnnouncementCard(item) { onOpen(item.id) } }
            }
        }
    }
}

@Composable
fun AnnouncementDetailScreen(id: String, announcements: LoadState<List<Announcement>>, onRetry: () -> Unit) {
    LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { DemoNotice() }
        item {
            when (announcements) {
                LoadState.Loading -> StatusCard("Cargando anuncio", "Un momento…", loading = true)
                is LoadState.Error -> StatusCard("Anuncio no disponible", announcements.message, onRetry = onRetry)
                is LoadState.Ready -> {
                    val announcement = announcements.data.firstOrNull { it.id == id }
                    if (announcement == null) StatusCard("Anuncio no encontrado", "Puede haber sido retirado. Vuelve a la lista para ver otras publicaciones.")
                    else SchoolCard {
                        Text(announcement.category, style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary)
                        Text(announcement.title, style = MaterialTheme.typography.headlineSmall)
                        Text(schoolDate(announcement.publishedAt))
                        HorizontalDivider()
                        Text(announcement.body, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }
    }
}
