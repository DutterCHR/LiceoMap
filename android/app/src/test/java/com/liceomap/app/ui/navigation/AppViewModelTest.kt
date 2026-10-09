package com.liceomap.app.ui.navigation

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.SavedStateHandle
import com.liceomap.app.data.demo.DemoEntryResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class AppViewModelTest {
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @Test
    fun newAppStartsAtLoginWithMapAsDefaultTab() {
        val viewModel = AppViewModel(SavedStateHandle())
        assertNull(viewModel.uiState.value.demoSession)
        assertEquals(AppDestination.MAP, viewModel.uiState.value.destination)
        assertEquals("", viewModel.uiState.value.rut)
        assertEquals("", viewModel.uiState.value.password)
    }

    @Test
    fun invalidEntryKeepsLoginAndDoesNotSaveSession() {
        val handle = SavedStateHandle()
        val viewModel = AppViewModel(handle)
        viewModel.onRutChanged("12345678-9")
        assertEquals(DemoEntryResult.MissingFields, viewModel.enterDemo())
        assertNull(viewModel.uiState.value.demoSession)
        assertFalse(handle.contains("demoCourse"))
    }

    @Test
    fun successfulEntryExposesDemoCourseAndClearsPassword() {
        val handle = SavedStateHandle()
        val viewModel = AppViewModel(handle)
        viewModel.onRutChanged("12345678-9")
        viewModel.onPasswordChanged("demo")
        val result = viewModel.enterDemo() as DemoEntryResult.Entered
        assertEquals(result.session, viewModel.uiState.value.demoSession)
        assertEquals("3° Medio A", viewModel.uiState.value.demoSession?.course)
        assertEquals("", viewModel.uiState.value.password)
        assertEquals("3° Medio A", handle.get<String>("demoCourse"))
    }

    @Test
    fun editingFieldsPublishesStateWithoutSavingPassword() {
        val handle = SavedStateHandle()
        val viewModel = AppViewModel(handle)
        viewModel.onRutChanged("12345678-9")
        viewModel.onPasswordChanged("demo")
        assertEquals("12345678-9", viewModel.uiState.value.rut)
        assertEquals("demo", viewModel.uiState.value.password)
        assertEquals(setOf("rut"), handle.keys())
    }

    @Test
    fun everyTabCanBeSelectedAndSaved() {
        val handle = SavedStateHandle()
        val viewModel = AppViewModel(handle)
        for (destination in AppDestination.entries) {
            viewModel.selectDestination(destination)
            assertEquals(destination, viewModel.uiState.value.destination)
            assertEquals(destination.name, handle.get<String>("destination"))
        }
    }

    @Test
    fun savedStateRestoresSessionRutAndSelectedTab() {
        val handle = SavedStateHandle()
        val original = AppViewModel(handle)
        original.onRutChanged("12345678-9")
        original.onPasswordChanged("demo")
        original.enterDemo()
        original.selectDestination(AppDestination.SCHEDULE)

        val restoredHandle = SavedStateHandle(handle.keys().associateWith { handle.get<Any?>(it) })
        val restored = AppViewModel(restoredHandle)
        assertEquals(original.uiState.value, restored.uiState.value)
    }

    @Test
    fun loginDraftRestoresRutButDoesNotPersistPassword() {
        val handle = SavedStateHandle()
        val original = AppViewModel(handle)
        original.onRutChanged("12345678-9")
        original.onPasswordChanged("demo")

        val restoredHandle = SavedStateHandle(handle.keys().associateWith { handle.get<Any?>(it) })
        val restored = AppViewModel(restoredHandle)
        assertEquals("12345678-9", restored.uiState.value.rut)
        assertEquals("", restored.uiState.value.password)
        assertNull(restored.uiState.value.demoSession)
    }

    @Test
    fun unknownSavedDestinationFallsBackToMap() {
        val viewModel = AppViewModel(SavedStateHandle(mapOf("destination" to "removed-tab")))
        assertEquals(AppDestination.MAP, viewModel.uiState.value.destination)
    }
}
