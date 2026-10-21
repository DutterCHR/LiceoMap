package com.liceomap.app.domain

import com.liceomap.app.model.Announcement

enum class AnnouncementOrder(val label: String) { NEWEST("Más recientes"), OLDEST("Más antiguos") }
object AnnouncementQuery {
    fun select(items: List<Announcement>, category: String?, order: AnnouncementOrder): List<Announcement> {
        val filtered = items.filter { category == null || it.category == category }
        return filtered.sortedWith(
            (if (order == AnnouncementOrder.NEWEST) compareByDescending<Announcement> { it.publishedAt }
             else compareBy<Announcement> { it.publishedAt }).thenBy { it.id }
        )
    }
}
