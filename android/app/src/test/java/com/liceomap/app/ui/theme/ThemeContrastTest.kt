package com.liceomap.app.ui.theme

import androidx.compose.ui.graphics.Color
import kotlin.math.pow
import org.junit.Assert.assertTrue
import org.junit.Test

class ThemeContrastTest {
    private fun luminance(color: Color): Double {
        fun linear(channel: Float): Double = if (channel <= 0.04045f) channel / 12.92
            else ((channel + 0.055) / 1.055).pow(2.4)
        return 0.2126 * linear(color.red) + 0.7152 * linear(color.green) + 0.0722 * linear(color.blue)
    }
    @Test fun mainTextPairsMeetWcagAAContrastInBothThemes() {
        for (colors in listOf(LightColors, DarkColors)) {
            for ((foreground, background) in listOf(
                colors.onPrimary to colors.primary, colors.onSecondary to colors.secondary,
                colors.onTertiary to colors.tertiary, colors.onBackground to colors.background,
                colors.onSurface to colors.surface, colors.onSurfaceVariant to colors.surfaceVariant,
                colors.onPrimaryContainer to colors.primaryContainer,
                colors.onSurface to colors.surfaceContainer,
                colors.onSurface to colors.surfaceContainerHighest,
                colors.primary to colors.surfaceContainerHighest,
            )) {
                val a = luminance(foreground)
                val b = luminance(background)
                val ratio = (maxOf(a, b) + 0.05) / (minOf(a, b) + 0.05)
                assertTrue("Text contrast was $ratio", ratio >= 4.5)
            }
        }
    }
}
