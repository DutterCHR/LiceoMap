package com.liceomap.app.domain

import com.liceomap.app.model.*
import java.text.SimpleDateFormat
import java.util.TimeZone
import org.junit.Assert.*
import org.junit.Test

class ScheduleClockTest {
    private val lessons = listOf(
        Lesson(1, "08:00", "09:30", "Matemática", "A"),
        Lesson(1, "09:45", "11:15", "Lengua", "A"),
        Lesson(5, "08:00", "09:30", "Historia", "B"),
    )
    private val schedule = Schedule("A", lessons)
    private fun at(date: String, zone: String = "America/Santiago") =
        SimpleDateFormat("yyyy-MM-dd HH:mm").apply { timeZone = TimeZone.getTimeZone(zone) }.parse(date)!!.time

    @Test fun startIncludedAndEndExcluded() {
        assertEquals(lessons[0], ScheduleClock.summary(schedule, at("2026-10-12 08:00")).current?.lesson)
        val end = ScheduleClock.summary(schedule, at("2026-10-12 09:30"))
        assertNull(end.current)
        assertEquals(lessons[1], end.next?.lesson)
    }
    @Test fun recessAndBeforeSchoolSelectNext() {
        assertNull(ScheduleClock.summary(schedule, at("2026-10-12 07:59")).current)
        assertEquals(lessons[0], ScheduleClock.summary(schedule, at("2026-10-12 07:59")).next?.lesson)
        assertEquals(lessons[1], ScheduleClock.summary(schedule, at("2026-10-12 09:44")).next?.lesson)
    }
    @Test fun weekendAndAfterLastLessonAdvanceToMonday() {
        for (date in listOf("2026-10-16 15:00", "2026-10-17 10:00", "2026-10-18 23:59")) {
            val summary = ScheduleClock.summary(schedule, at(date))
            assertNull(summary.current)
            assertEquals(lessons[0], summary.next?.lesson)
            assertEquals(at("2026-10-19 08:00"), summary.next?.startMillis)
        }
    }
    @Test fun usesSantiagoRegardlessOfDeviceTimezone() {
        val original = TimeZone.getDefault()
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tokyo"))
            assertEquals(lessons[0], ScheduleClock.summary(schedule, at("2026-10-12 11:00", "UTC")).current?.lesson)
            assertEquals(7, ScheduleClock.dayOfWeek(at("2026-10-12 02:00", "UTC")))
        } finally { TimeZone.setDefault(original) }
    }
    @Test fun daylightSavingChangesKeepLocalClassHour() {
        val monday = Schedule("A", listOf(lessons[0]))
        assertEquals(at("2026-09-07 08:00"), ScheduleClock.summary(monday, at("2026-09-05 10:00")).next?.startMillis)
        assertEquals(at("2026-04-06 08:00"), ScheduleClock.summary(monday, at("2026-04-04 10:00")).next?.startMillis)
    }
    @Test fun emptyScheduleHasNoCurrentOrNext() {
        assertEquals(ClassSummary(null, null), ScheduleClock.summary(Schedule("A", emptyList()), at("2026-10-12 08:00")))
    }
    @Test fun unsortedInputStillSelectsEarliestUpcomingClass() {
        assertEquals(lessons[0], ScheduleClock.summary(Schedule("A", lessons.reversed()), at("2026-10-12 07:00")).next?.lesson)
    }
}
