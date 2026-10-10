package com.liceomap.app.ui.navigation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import com.liceomap.app.data.demo.DemoEntry
import com.liceomap.app.domain.*
import com.liceomap.app.model.*
import com.liceomap.app.ui.theme.ThemeMode
import kotlinx.coroutines.flow.*

class AppViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {
    private val mutableUiState = MutableStateFlow(
        AppUiState(
            rut = savedStateHandle["rut"] ?: "",
            demoSession = savedStateHandle.get<String>("demoCourse")?.let {
                DemoSession(it, savedStateHandle["studentName"])
            },
            destination = AppDestination.entries.firstOrNull {
                it.name == savedStateHandle.get<String>("destination")
            } ?: AppDestination.HOME,
            selectedDay = savedStateHandle.get<Int>("selectedDay")?.takeIf { it in 1..7 }
                ?: ScheduleClock.dayOfWeek(System.currentTimeMillis()),
            selectedRoom = savedStateHandle.get<String>("selectedRoom")?.takeIf { it.isNotBlank() }?.let(::RoomId),
            announcementId = savedStateHandle["announcementId"],
            announcementCategory = savedStateHandle["announcementCategory"],
            announcementOrder = AnnouncementOrder.entries.firstOrNull {
                it.name == savedStateHandle.get<String>("announcementOrder")
            } ?: AnnouncementOrder.NEWEST,
            themeMode = ThemeMode.entries.firstOrNull {
                it.name == savedStateHandle.get<String>("themeMode")
            } ?: ThemeMode.SYSTEM,
        )
    )
    val uiState = mutableUiState.asStateFlow()

    fun onRutChanged(rut: String) {
        savedStateHandle["rut"] = rut
        mutableUiState.update { it.copy(rut = rut) }
    }

    fun enterDemo(): DemoSession {
        val session = DemoEntry.enter()
        savedStateHandle["demoCourse"] = session.course
        savedStateHandle["destination"] = AppDestination.HOME.name
        mutableUiState.update { it.copy(demoSession = session, destination = AppDestination.HOME) }
        return session
    }

    fun selectDestination(destination: AppDestination) {
        savedStateHandle["destination"] = destination.name
        savedStateHandle.remove<String>("announcementId")
        mutableUiState.update { it.copy(destination = destination, announcementId = null) }
    }

    fun selectDay(day: Int) {
        require(day in 1..7)
        savedStateHandle["selectedDay"] = day
        mutableUiState.update { it.copy(selectedDay = day) }
    }

    fun openRoom(room: RoomId) {
        savedStateHandle["selectedRoom"] = room.value
        mutableUiState.update { it.copy(selectedRoom = room) }
        selectDestination(AppDestination.MAP)
    }

    fun openAnnouncement(id: String) {
        selectDestination(AppDestination.ANNOUNCEMENTS)
        savedStateHandle["announcementId"] = id
        mutableUiState.update { it.copy(announcementId = id) }
    }

    fun closeAnnouncement() {
        savedStateHandle.remove<String>("announcementId")
        mutableUiState.update { it.copy(announcementId = null) }
    }

    fun selectCategory(category: String?) {
        savedStateHandle["announcementCategory"] = category
        mutableUiState.update { it.copy(announcementCategory = category) }
    }

    fun selectOrder(order: AnnouncementOrder) {
        savedStateHandle["announcementOrder"] = order.name
        mutableUiState.update { it.copy(announcementOrder = order) }
    }

    fun selectTheme(mode: ThemeMode) {
        savedStateHandle["themeMode"] = mode.name
        mutableUiState.update { it.copy(themeMode = mode) }
    }

    fun initializeTheme(mode: ThemeMode) {
        if (!savedStateHandle.contains("themeMode")) selectTheme(mode)
    }

    fun logout() {
        val theme = uiState.value.themeMode
        savedStateHandle.keys().filter { it != "themeMode" }.forEach { savedStateHandle.remove<Any?>(it) }
        mutableUiState.value = AppUiState(themeMode = theme)
    }
}
