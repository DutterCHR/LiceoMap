package com.liceomap.app.ui.content

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.liceomap.app.data.demo.*
import com.liceomap.app.data.repository.*
import com.liceomap.app.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

data class SchoolContentState(
    val schedule: LoadState<Schedule> = LoadState.Loading,
    val announcements: LoadState<List<Announcement>> = LoadState.Loading,
)

/** One content owner for Home, Schedule and Announcements. Repositories are injectable. */
class SchoolContentViewModel(
    private val schedules: ScheduleRepository = DemoScheduleRepository(),
    private val announcements: AnnouncementsRepository = DemoAnnouncementsRepository(),
    private val dispatcher: CoroutineDispatcher = Dispatchers.Main.immediate,
) : ViewModel() {
    private val mutableState = MutableStateFlow(SchoolContentState())
    val uiState = mutableState.asStateFlow()
    private var loadJob: Job? = null

    fun clear() {
        loadJob?.cancel()
        loadJob = null
        mutableState.value = SchoolContentState()
    }

    fun load(course: String) {
        loadJob?.cancel()
        mutableState.value = SchoolContentState()
        loadJob = viewModelScope.launch(dispatcher) {
            supervisorScope {
                launch {
                    try {
                        val data = schedules.loadSchedule(course)
                        require(data.course == course) { "Schedule belongs to another course" }
                        mutableState.update { it.copy(schedule = LoadState.Ready(data)) }
                    } catch (cancelled: CancellationException) { throw cancelled
                    } catch (_: Exception) {
                        mutableState.update { it.copy(schedule = LoadState.Error("No pudimos cargar el horario.")) }
                    }
                }
                launch {
                    try {
                        val items = announcements.loadAnnouncements()
                        require(items.map { it.id }.distinct().size == items.size) { "Duplicate announcement identities" }
                        val data = items.sortedWith(
                            compareByDescending<Announcement> { it.publishedAt }.thenBy { it.id }
                        )
                        mutableState.update { it.copy(announcements = LoadState.Ready(data)) }
                    } catch (cancelled: CancellationException) { throw cancelled
                    } catch (_: Exception) {
                        mutableState.update { it.copy(announcements = LoadState.Error("No pudimos cargar los anuncios.")) }
                    }
                }
            }
        }
    }
}
