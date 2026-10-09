package com.liceomap.app.ui.navigation

import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.liceomap.app.data.demo.DemoData
import com.liceomap.app.data.demo.DemoEntryResult
import com.liceomap.app.ui.announcements.AnnouncementsScreen
import com.liceomap.app.ui.login.LoginScreen
import com.liceomap.app.ui.map.MapScreen
import com.liceomap.app.ui.schedule.ScheduleScreen

/** Single owner of login/main routing and tab content; back behavior remains unchanged. */
@Composable
fun AppNavigation(appViewModel: AppViewModel = viewModel()) {
    val state by appViewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val screenStateHolder = rememberSaveableStateHolder()
    val session = state.demoSession

    if (session == null) {
        LoginScreen(
            rut = state.rut,
            password = state.password,
            onRutChanged = appViewModel::onRutChanged,
            onPasswordChanged = appViewModel::onPasswordChanged,
            onEnter = {
                val message = when (appViewModel.enterDemo()) {
                    DemoEntryResult.MissingFields -> "Ingresa RUT y Contraseña"
                    is DemoEntryResult.Entered -> "Ingreso de demostración"
                }
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            },
        )
    } else {
        MainScreen(
            course = session.course,
            destination = state.destination,
            onDestinationSelected = appViewModel::selectDestination,
        ) {
            screenStateHolder.SaveableStateProvider(state.destination.name) {
                when (state.destination) {
                    AppDestination.MAP -> MapScreen(DemoData.map)
                    AppDestination.SCHEDULE -> ScheduleScreen(session.course)
                    AppDestination.ANNOUNCEMENTS -> AnnouncementsScreen()
                }
            }
        }
    }
}
