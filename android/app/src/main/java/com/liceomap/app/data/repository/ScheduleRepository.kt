package com.liceomap.app.data.repository

import com.liceomap.app.model.Schedule

interface ScheduleRepository {
    suspend fun loadSchedule(course: String): Schedule
}
