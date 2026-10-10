package com.liceomap.app.ui.navigation

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.SavedStateHandle
import com.liceomap.app.model.RoomId
import com.liceomap.app.domain.AnnouncementOrder
import com.liceomap.app.ui.theme.ThemeMode
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class AppViewModelTest {
    @Test fun fullScheduleRoomPathCanGoBackAfterProcessStateRestoration() {
        val handle = SavedStateHandle()
        val vm = AppViewModel(handle)
        vm.enterDemo()
        vm.selectDestination(AppDestination.SCHEDULE)
        vm.selectDay(3)
        vm.openRoom(RoomId("demo-a102"))
        val restored = restore(handle)
        assertTrue(restored.goBack())
        assertEquals(AppDestination.SCHEDULE, restored.uiState.value.destination)
        assertEquals(3, restored.uiState.value.selectedDay)
        assertTrue(restored.goBack())
        assertEquals(AppDestination.HOME, restored.uiState.value.destination)
        assertFalse(restored.goBack())
    }
    @Test fun homeAnnouncementDetailReturnsThroughListAndKeepsFilters() {
        val vm = AppViewModel(SavedStateHandle())
        vm.enterDemo()
        vm.selectCategory("Biblioteca")
        vm.openAnnouncement("demo-library")
        assertTrue(vm.goBack())
        assertEquals(AppDestination.ANNOUNCEMENTS, vm.uiState.value.destination)
        assertNull(vm.uiState.value.announcementId)
        assertEquals("Biblioteca", vm.uiState.value.announcementCategory)
        assertTrue(vm.goBack())
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
    }
    @Test fun selectingMainTabReplacesChildHistoryAndClearsRoomSelection() {
        val vm = AppViewModel(SavedStateHandle())
        vm.enterDemo()
        vm.selectDestination(AppDestination.SCHEDULE)
        vm.openRoom(RoomId("demo-a101"))
        vm.selectDestination(AppDestination.PROFILE)
        assertNull(vm.uiState.value.selectedRoom)
        assertTrue(vm.goBack())
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
        assertFalse(vm.goBack())
    }
    @get:Rule val instantTaskExecutorRule = InstantTaskExecutorRule()
    private fun restore(handle: SavedStateHandle) = AppViewModel(SavedStateHandle(handle.keys().associateWith { handle.get<Any?>(it) }))

    @Test fun startsAtLoginAndDemoOpensHomeWithoutCredentials() {
        val vm = AppViewModel(SavedStateHandle())
        assertNull(vm.uiState.value.demoSession)
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
        vm.enterDemo()
        assertEquals("3° Medio A", vm.uiState.value.demoSession?.course)
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
    }
    @Test fun everyDestinationCanBeSelectedAndSaved() {
        val handle = SavedStateHandle()
        val vm = AppViewModel(handle)
        AppDestination.entries.forEach {
            vm.selectDestination(it)
            assertEquals(it, restore(handle).uiState.value.destination)
        }
    }
    @Test fun restoresSessionDayAndRoomAndFilters() {
        val handle = SavedStateHandle()
        val vm = AppViewModel(handle)
        vm.enterDemo()
        vm.selectDay(5)
        vm.openRoom(RoomId("demo-a102"))
        vm.selectCategory("Académico")
        vm.selectOrder(AnnouncementOrder.OLDEST)
        vm.selectTheme(ThemeMode.DARK)
        assertEquals(vm.uiState.value, restore(handle).uiState.value)
    }
    @Test fun restoresDetailAndClosesItWithoutDroppingFilters() {
        val handle = SavedStateHandle()
        val vm = AppViewModel(handle)
        vm.selectCategory("Biblioteca")
        vm.openAnnouncement("demo-library")
        val restored = restore(handle)
        assertEquals("demo-library", restored.uiState.value.announcementId)
        restored.closeAnnouncement()
        assertNull(restored.uiState.value.announcementId)
        assertEquals("Biblioteca", restored.uiState.value.announcementCategory)
    }
    @Test fun logoutClearsAllSessionStateAndPreservesAppearance() {
        val handle = SavedStateHandle()
        val vm = AppViewModel(handle)
        vm.onRutChanged("12345678-5")
        vm.enterDemo()
        vm.selectDay(5)
        vm.openRoom(RoomId("demo-a101"))
        vm.openAnnouncement("demo-library")
        vm.selectTheme(ThemeMode.DARK)
        vm.logout()
        assertNull(vm.uiState.value.demoSession)
        assertEquals("", vm.uiState.value.rut)
        assertNull(vm.uiState.value.selectedRoom)
        assertNull(vm.uiState.value.announcementId)
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
        assertEquals(setOf("themeMode"), handle.keys())
        assertEquals(ThemeMode.DARK, restore(handle).uiState.value.themeMode)
        vm.enterDemo()
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
    }
    @Test fun corruptedSavedValuesFallBackToSafeDefaults() {
        val vm = AppViewModel(SavedStateHandle(mapOf("destination" to "removed", "selectedDay" to 99,
            "announcementOrder" to "removed", "themeMode" to "removed")))
        assertEquals(AppDestination.HOME, vm.uiState.value.destination)
        assertTrue(vm.uiState.value.selectedDay in 1..7)
        assertEquals(AnnouncementOrder.NEWEST, vm.uiState.value.announcementOrder)
        assertEquals(ThemeMode.SYSTEM, vm.uiState.value.themeMode)
    }
    @Test fun savedThemeIsNotOverwrittenByInitialPreferenceRead() {
        val vm = AppViewModel(SavedStateHandle(mapOf("themeMode" to "DARK")))
        vm.initializeTheme(ThemeMode.LIGHT)
        assertEquals(ThemeMode.DARK, vm.uiState.value.themeMode)
    }
    @Test fun demoDoesNotWriteCredentialsToSavedState() {
        val handle = SavedStateHandle()
        AppViewModel(handle).enterDemo()
        assertFalse(handle.keys().any { it.contains("password", true) || it.contains("token", true) || it == "rut" })
    }
}
