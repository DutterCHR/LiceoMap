package com.liceomap.app.ui.navigation

import com.liceomap.app.model.DemoSession

data class AppUiState(
    val rut: String = "",
    val password: String = "",
    val demoSession: DemoSession? = null,
    val destination: AppDestination = AppDestination.MAP,
)
