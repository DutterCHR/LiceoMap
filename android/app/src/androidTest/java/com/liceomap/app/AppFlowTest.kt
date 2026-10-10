package com.liceomap.app

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.core.view.WindowCompat
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AppFlowTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun enterDemo() {
        rule.onNodeWithTag("enter-demo").performClick()
        rule.onNodeWithText("Tu día en LiceoMap").assertIsDisplayed()
    }

    @Test fun loginHomeScheduleMapAndBackRestoreDayAcrossRecreation() {
        enterDemo()
        rule.onNodeWithText("Horarios").performClick()
        rule.onNodeWithTag("day-1").performClick()
        rule.onNodeWithTag("room-demo-a101-08:00").performScrollTo().performClick()
        rule.onNodeWithText("Sala A-101").assertIsDisplayed()
        rule.activityRule.scenario.recreate()
        rule.onNodeWithText("Sala A-101").assertIsDisplayed()
        rule.onNodeWithTag("navigate-back").performClick()
        rule.onNodeWithTag("schedule-list").performScrollToIndex(0)
        rule.onNodeWithTag("day-1").assertIsSelected()
        rule.onNodeWithTag("navigate-back").performClick()
        rule.onNodeWithText("Tu día en LiceoMap").assertIsDisplayed()
    }

    @Test fun homeAnnouncementsDetailAndBackRestoreListAfterRecreation() {
        enterDemo()
        rule.onNodeWithTag("nav-ANNOUNCEMENTS").performClick()
        rule.onNodeWithText("Biblioteca").performClick()
        rule.onNodeWithTag("announcement-demo-library").performScrollTo().performClick()
        rule.onNodeWithText("Un espacio para descubrir historias").assertIsDisplayed()
        rule.activityRule.scenario.recreate()
        rule.onNodeWithText("Un espacio para descubrir historias").assertIsDisplayed()
        rule.onNodeWithTag("navigate-back").performClick()
        rule.onNodeWithTag("announcements-list").performScrollToIndex(0)
        rule.onNodeWithText("Biblioteca", substring = false).assertIsSelected()
        rule.onNodeWithTag("navigate-back").performClick()
        rule.onNodeWithText("Tu día en LiceoMap").assertIsDisplayed()
    }

    @Test fun profileThemeSurvivesRecreationAndLogoutClearsSession() {
        enterDemo()
        rule.onNodeWithTag("nav-PROFILE").performClick()
        rule.onNodeWithTag("profile-list").performScrollToIndex(2)
        rule.onNodeWithTag("theme-DARK").performScrollTo().performClick()
        rule.runOnIdle {
            org.junit.Assert.assertFalse(WindowCompat.getInsetsController(rule.activity.window,
                rule.activity.window.decorView).isAppearanceLightStatusBars)
        }
        rule.activityRule.scenario.recreate()
        rule.onNodeWithTag("theme-DARK").performScrollTo().assertIsSelected()
        rule.onNodeWithTag("theme-SYSTEM").performScrollTo().performClick()
        rule.onNodeWithTag("profile-list").performScrollToIndex(4)
        rule.onNodeWithTag("logout").performScrollTo().performClick()
        rule.onNodeWithTag("confirm-logout").performClick()
        rule.onNodeWithTag("enter-demo").assertIsDisplayed()
        rule.activityRule.scenario.recreate()
        rule.onNodeWithTag("enter-demo").assertIsDisplayed()
        rule.onNodeWithTag("enter-demo").performClick()
        rule.onNodeWithText("Tu día en LiceoMap").assertIsDisplayed()
    }
}
