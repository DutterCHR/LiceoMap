package com.liceomap.app.model
import org.junit.Assert.assertThrows
import org.junit.Test
class SchoolContentTest {
    @Test fun malformedLessonTimesAndDaysAreRejected() {
        for ((day, start, end) in listOf(Triple(0, "08:00", "09:00"),
            Triple(1, "25:00", "26:00"), Triple(1, "9:00", "10:00"),
            Triple(1, "09:00", "08:00"), Triple(1, "08:60", "09:30"))) {
            assertThrows(IllegalArgumentException::class.java) { Lesson(day, start, end, "A", "A") }
        }
    }
    @Test fun overlappingScheduleAndDuplicateSvgBindingsAreRejected() {
        assertThrows(IllegalArgumentException::class.java) {
            Schedule("A", listOf(Lesson(1, "08:00", "09:30", "A", "A"), Lesson(1, "09:00", "10:00", "B", "B")))
        }
        assertThrows(IllegalArgumentException::class.java) {
            SvgMap("future.svg", listOf(SvgRoomBinding(RoomId("A"), "a"), SvgRoomBinding(RoomId("A"), "b")))
        }
    }
}
