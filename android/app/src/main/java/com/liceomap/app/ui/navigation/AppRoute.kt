package com.liceomap.app.ui.navigation

import com.liceomap.app.model.RoomId

data class AppRoute(
    val destination: AppDestination,
    val announcementId: String? = null,
    val room: RoomId? = null,
)
