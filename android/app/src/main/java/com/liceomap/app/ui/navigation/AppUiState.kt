package com.liceomap.app.ui.navigation

import com.liceomap.app.model.DemoSession
import com.liceomap.app.model.RoomId
import com.liceomap.app.domain.ScheduleClock

data class AppUiState(
    val rut: String = "",
    val password: String = "",
    val demoSession: DemoSession? = null,
    val destination: AppDestination = AppDestination.HOME,
    val selectedDay: Int = ScheduleClock.dayOfWeek(System.currentTimeMillis()),
    val selectedRoom: RoomId? = null,
)
