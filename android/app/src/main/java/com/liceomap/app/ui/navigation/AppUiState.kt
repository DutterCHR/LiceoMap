package com.liceomap.app.ui.navigation
import com.liceomap.app.model.*
import com.liceomap.app.domain.*
import com.liceomap.app.ui.theme.ThemeMode

data class AppUiState(
    val rut: String = "",
    val demoSession: DemoSession? = null,
    val destination: AppDestination = AppDestination.HOME,
    val selectedDay: Int = ScheduleClock.dayOfWeek(System.currentTimeMillis()),
    val selectedRoom: RoomId? = null,
    val announcementId: String? = null,
    val announcementCategory: String? = null,
    val announcementOrder: AnnouncementOrder = AnnouncementOrder.NEWEST,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
)
