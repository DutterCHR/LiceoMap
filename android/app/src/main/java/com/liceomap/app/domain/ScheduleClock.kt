package com.liceomap.app.domain

import com.liceomap.app.model.Lesson
import com.liceomap.app.model.Schedule
import java.util.Calendar
import java.util.TimeZone

data class LessonOccurrence(val lesson: Lesson, val startMillis: Long, val endMillis: Long)
data class ClassSummary(val current: LessonOccurrence?, val next: LessonOccurrence?)

/** ISO weekdays 1=Monday..7=Sunday. End is exclusive; the clock is always Santiago. */
object ScheduleClock {
    private fun calendar(millis: Long) = Calendar.getInstance(TimeZone.getTimeZone("America/Santiago"))
        .apply { timeInMillis = millis }

    fun dayOfWeek(nowMillis: Long): Int = (calendar(nowMillis).get(Calendar.DAY_OF_WEEK) + 5) % 7 + 1

    fun summary(schedule: Schedule, nowMillis: Long): ClassSummary {
        val occurrences = (0..7).flatMap { offset ->
            val date = calendar(nowMillis).apply { add(Calendar.DAY_OF_MONTH, offset) }
            val day = (date.get(Calendar.DAY_OF_WEEK) + 5) % 7 + 1
            schedule.lessons.filter { it.dayOfWeek == day }.map { lesson ->
                fun at(time: String): Long {
                    val parts = time.split(":")
                    return (date.clone() as Calendar).apply {
                        set(Calendar.HOUR_OF_DAY, parts[0].toInt())
                        set(Calendar.MINUTE, parts[1].toInt())
                        set(Calendar.SECOND, 0)
                        set(Calendar.MILLISECOND, 0)
                    }.timeInMillis
                }
                LessonOccurrence(lesson, at(lesson.startTime), at(lesson.endTime))
            }
        }.sortedBy { it.startMillis }
        return ClassSummary(
            occurrences.firstOrNull { nowMillis >= it.startMillis && nowMillis < it.endMillis },
            occurrences.firstOrNull { it.startMillis > nowMillis },
        )
    }
}
