package com.liceomap.app.ui.navigation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import com.liceomap.app.data.demo.DemoEntry
import com.liceomap.app.data.demo.DemoEntryResult
import com.liceomap.app.model.DemoSession
import com.liceomap.app.model.RoomId
import com.liceomap.app.domain.ScheduleClock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class AppViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {
    private val mutableUiState = MutableStateFlow(
        AppUiState(
            rut = savedStateHandle["rut"] ?: "",
            demoSession = savedStateHandle.get<String>("demoCourse")?.let(::DemoSession),
            destination = AppDestination.entries.firstOrNull {
                it.name == savedStateHandle.get<String>("destination")
            } ?: AppDestination.HOME,
            selectedDay = savedStateHandle.get<Int>("selectedDay")?.takeIf { it in 1..7 }
                ?: ScheduleClock.dayOfWeek(System.currentTimeMillis()),
            selectedRoom = savedStateHandle.get<String>("selectedRoom")?.takeIf { it.isNotBlank() }?.let(::RoomId),
        )
    )
    val uiState = mutableUiState.asStateFlow()

    fun onRutChanged(rut: String) {
        savedStateHandle["rut"] = rut
        mutableUiState.update { it.copy(rut = rut) }
    }

    fun onPasswordChanged(password: String) {
        // Retained during activity recreation by the ViewModel, never written to saved state.
        mutableUiState.update { it.copy(password = password) }
    }

    fun enterDemo(): DemoEntryResult {
        val state = uiState.value
        val result = DemoEntry.enter(state.rut, state.password)
        if (result is DemoEntryResult.Entered) {
            savedStateHandle["demoCourse"] = result.session.course
            savedStateHandle["destination"] = AppDestination.HOME.name
            mutableUiState.update { it.copy(demoSession = result.session, password = "", destination = AppDestination.HOME) }
        }
        return result
    }

    fun selectDestination(destination: AppDestination) {
        savedStateHandle["destination"] = destination.name
        mutableUiState.update { it.copy(destination = destination) }
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
}
