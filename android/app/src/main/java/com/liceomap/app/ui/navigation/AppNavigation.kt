package com.liceomap.app.ui.navigation

import android.widget.Toast
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.liceomap.app.data.demo.*
import com.liceomap.app.ui.announcements.AnnouncementsScreen
import com.liceomap.app.ui.components.StatusCard
import com.liceomap.app.ui.content.SchoolContentViewModel
import com.liceomap.app.ui.content.rememberSchoolTime
import com.liceomap.app.ui.home.HomeScreen
import com.liceomap.app.ui.login.LoginScreen
import com.liceomap.app.ui.map.MapScreen
import com.liceomap.app.ui.schedule.ScheduleScreen

@Composable
fun AppNavigation(appViewModel: AppViewModel = viewModel(), contentViewModel: SchoolContentViewModel = viewModel()) {
    val state by appViewModel.uiState.collectAsStateWithLifecycle()
    val content by contentViewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val screenStateHolder = rememberSaveableStateHolder()
    val session = state.demoSession
    val nowMillis by rememberSchoolTime()

    LaunchedEffect(session?.course) { session?.let { contentViewModel.load(it.course) } }
    if (session == null) {
        LoginScreen(
            rut = state.rut, password = state.password,
            onRutChanged = appViewModel::onRutChanged,
            onPasswordChanged = appViewModel::onPasswordChanged,
            onEnter = {
                val message = when (appViewModel.enterDemo()) {
                    DemoEntryResult.MissingFields -> "Completa los campos de demostración"
                    is DemoEntryResult.Entered -> "Ingreso de demostración"
                }
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            },
        )
    } else {
        MainScreen(session.course, state.destination, appViewModel::selectDestination) {
            screenStateHolder.SaveableStateProvider(state.destination.name) {
                when (state.destination) {
                    AppDestination.HOME -> HomeScreen(session, content, nowMillis,
                        appViewModel::selectDestination,
                        { appViewModel.selectDestination(AppDestination.ANNOUNCEMENTS) },
                        { contentViewModel.load(session.course) })
                    AppDestination.MAP -> MapScreen(DemoData.map, state.selectedRoom)
                    AppDestination.SCHEDULE -> ScheduleScreen(session.course, content.schedule,
                        state.selectedDay, nowMillis, appViewModel::selectDay, appViewModel::openRoom,
                        { contentViewModel.load(session.course) })
                    AppDestination.ANNOUNCEMENTS -> AnnouncementsScreen()
                    AppDestination.PROFILE -> StatusCard("Perfil de demostración", session.course)
                }
            }
        }
    }
}
