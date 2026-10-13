package com.liceomap.app.ui.theme
import org.junit.Assert.*
import org.junit.Test
class ThemeModeTest {
    @Test fun automaticFollowsSystemAndExplicitModesOverrideIt() {
        assertTrue(ThemeMode.SYSTEM.usesDarkTheme(true))
        assertFalse(ThemeMode.SYSTEM.usesDarkTheme(false))
        assertTrue(ThemeMode.DARK.usesDarkTheme(false))
        assertFalse(ThemeMode.LIGHT.usesDarkTheme(true))
    }
}
