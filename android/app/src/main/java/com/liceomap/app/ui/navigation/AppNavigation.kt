package com.liceomap.app.ui.navigation

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.view.WindowCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.liceomap.app.BuildConfig
import com.liceomap.app.data.demo.DemoData
import com.liceomap.app.data.repository.ThemePreferences
import com.liceomap.app.ui.announcements.*
import com.liceomap.app.ui.content.*
import com.liceomap.app.ui.home.HomeScreen
import com.liceomap.app.ui.login.LoginScreen
import com.liceomap.app.ui.map.MapScreen
import com.liceomap.app.ui.profile.ProfileScreen
import com.liceomap.app.ui.schedule.ScheduleScreen
import com.liceomap.app.ui.theme.LiceoMapTheme

@Composable
fun AppNavigation(appViewModel: AppViewModel = viewModel(), contentViewModel: SchoolContentViewModel = viewModel()) {
    val state by appViewModel.uiState.collectAsStateWithLifecycle()
    val content by contentViewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val preferences = remember(context) { ThemePreferences(context.applicationContext) }
    val session = state.demoSession
    val nowMillis by rememberSchoolTime()
    val darkTheme = state.themeMode.usesDarkTheme(isSystemInDarkTheme())

    SideEffect {
        (context as? Activity)?.window?.let { window ->
            WindowCompat.getInsetsController(window, window.decorView).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    LaunchedEffect(Unit) { appViewModel.initializeTheme(preferences.read()) }
    LaunchedEffect(session?.course) {
        if (session == null) contentViewModel.clear() else contentViewModel.load(session.course)
    }
    BackHandler(session != null && state.backStack.isNotEmpty()) { appViewModel.goBack() }
    LiceoMapTheme(state.themeMode) {
        Surface(Modifier.fillMaxSize()) {
            if (session == null) {
                LoginScreen(state.rut, appViewModel::onRutChanged, { appViewModel.enterDemo() })
            } else {
                // Disposed on logout, so a new session cannot inherit scroll or viewport state.
                val screenStateHolder = rememberSaveableStateHolder()
                MainScreen(state.destination, state.announcementId != null, state.backStack.isNotEmpty(),
                    { appViewModel.goBack() }, appViewModel::selectDestination) {
                    val routeKey = state.destination.name + ":" + (state.announcementId ?: "list")
                    screenStateHolder.SaveableStateProvider(routeKey) {
                        val retry = { contentViewModel.load(session.course) }
                        when (state.destination) {
                            AppDestination.HOME -> HomeScreen(session, content, nowMillis,
                                appViewModel::selectDestination, appViewModel::openAnnouncement, retry)
                            AppDestination.MAP -> MapScreen(DemoData.map, state.selectedRoom)
                            AppDestination.SCHEDULE -> ScheduleScreen(session.course, content.schedule,
                                state.selectedDay, nowMillis, appViewModel::selectDay, appViewModel::openRoom, retry)
                            AppDestination.ANNOUNCEMENTS -> {
                                val id = state.announcementId
                                if (id == null) AnnouncementsScreen(content.announcements, state.announcementCategory,
                                    state.announcementOrder, appViewModel::selectCategory, appViewModel::selectOrder,
                                    appViewModel::openAnnouncement, retry)
                                else AnnouncementDetailScreen(id, content.announcements, retry)
                            }
                            AppDestination.PROFILE -> ProfileScreen(session, state.themeMode, BuildConfig.VERSION_NAME,
                                { preferences.write(it); appViewModel.selectTheme(it) }, {
                                    contentViewModel.clear()
                                    appViewModel.logout()
                                })
                        }
                    }
                }
            }
        }
    }
}
