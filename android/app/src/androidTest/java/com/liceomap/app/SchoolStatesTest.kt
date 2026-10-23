package com.liceomap.app

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.liceomap.app.model.*
import com.liceomap.app.ui.content.SchoolContentState
import com.liceomap.app.ui.home.HomeScreen
import com.liceomap.app.ui.announcements.AnnouncementDetailScreen
import com.liceomap.app.ui.theme.LiceoMapTheme
import org.junit.Rule
import org.junit.Test

class SchoolStatesTest {
    @get:Rule val rule = createComposeRule()
    @Test fun homeShowsLoadingStates() {
        rule.setContent {
            LiceoMapTheme {
                HomeScreen(DemoSession("A", "Camila"), SchoolContentState(), 0, {}, {}, {})
            }
        }
        rule.onNodeWithText("Hola, Camila").assertIsDisplayed()
        rule.onNodeWithText("Preparando tu día").assertIsDisplayed()
    }
    @Test fun homeShowsEmptyScheduleAndAnnouncements() {
        rule.setContent {
            LiceoMapTheme {
                HomeScreen(DemoSession("A"), SchoolContentState(
                    LoadState.Ready(Schedule("A", emptyList())), LoadState.Ready(emptyList())),
                    0, {}, {}, {})
            }
        }
        rule.onNodeWithText("Sin clases programadas").assertIsDisplayed()
        rule.onNodeWithText("Todo al día").performScrollTo().assertIsDisplayed()
    }
    @Test fun missingAnnouncementShowsRecoverableState() {
        rule.setContent {
            LiceoMapTheme { AnnouncementDetailScreen("missing", LoadState.Ready(emptyList()), {}) }
        }
        rule.onNodeWithText("Anuncio no encontrado").assertIsDisplayed()
    }
    @Test fun errorStateLetsUserRetry() {
        var retries = 0
        rule.setContent {
            LiceoMapTheme {
                AnnouncementDetailScreen("missing", LoadState.Error("Sin conexión"), { retries++ })
            }
        }
        rule.onNodeWithText("Reintentar").performClick()
        org.junit.Assert.assertEquals(1, retries)
    }
}
