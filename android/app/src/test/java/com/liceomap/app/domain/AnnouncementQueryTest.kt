package com.liceomap.app.domain
import com.liceomap.app.model.Announcement
import org.junit.Assert.*
import org.junit.Test
class AnnouncementQueryTest {
    private val items = listOf(
        Announcement("b", "B", "B", "General", 200),
        Announcement("c", "C", "C", "Académico", 100),
        Announcement("a", "A", "A", "General", 200),
    )
    @Test fun newestAndOldestHaveStableTieBreakers() {
        assertEquals(listOf("a", "b", "c"), AnnouncementQuery.select(items, null, AnnouncementOrder.NEWEST).map { it.id })
        assertEquals(listOf("c", "a", "b"), AnnouncementQuery.select(items, null, AnnouncementOrder.OLDEST).map { it.id })
    }
    @Test fun filtersCategoriesAndHandlesEmptyResults() {
        assertEquals(listOf("c"), AnnouncementQuery.select(items, "Académico", AnnouncementOrder.NEWEST).map { it.id })
        assertTrue(AnnouncementQuery.select(items, "Inexistente", AnnouncementOrder.NEWEST).isEmpty())
        assertTrue(AnnouncementQuery.select(emptyList(), null, AnnouncementOrder.NEWEST).isEmpty())
    }
}
