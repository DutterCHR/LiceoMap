package com.liceomap.app.ui.theme
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
enum class ThemeMode(val label: String) {
    SYSTEM("Automático"), LIGHT("Claro"), DARK("Oscuro");
    fun usesDarkTheme(systemDark: Boolean): Boolean = when (this) {
        SYSTEM -> systemDark
        LIGHT -> false
        DARK -> true
    }
}
internal val LightColors = lightColorScheme(
    primary = Pine, onPrimary = Color.White,
    primaryContainer = Color(0xFFD1E8E4), onPrimaryContainer = Ink,
    secondary = Color(0xFF416660), onSecondary = Color.White,
    secondaryContainer = Color(0xFFD8EAE5), onSecondaryContainer = Ink,
    tertiary = Color(0xFF486860), onTertiary = Color.White,
    background = Paper, onBackground = Ink,
    surface = Color.White, onSurface = Ink,
    surfaceVariant = Color(0xFFE1EAE6), onSurfaceVariant = Color(0xFF405652),
    outline = Color(0xFF6D817B),
    outlineVariant = Color(0xFFC1D1CB), surfaceTint = Pine,
    surfaceDim = Color(0xFFD8E3DE), surfaceBright = Color.White,
    surfaceContainerLowest = Color.White, surfaceContainerLow = Paper,
    surfaceContainer = Color(0xFFEDF3F0), surfaceContainerHigh = Color(0xFFE6EEEA),
    surfaceContainerHighest = Color(0xFFE1EAE6),
    tertiaryContainer = Color(0xFFD8EAE5), onTertiaryContainer = Ink,
    inverseSurface = NightSurface, inverseOnSurface = Paper, inversePrimary = Mist,
)
internal val DarkColors = darkColorScheme(
    primary = Color(0xFFA8D1CA), onPrimary = Night,
    primaryContainer = Pine, onPrimaryContainer = Color(0xFFDAEFEB),
    secondary = Color(0xFFA4C7BF), onSecondary = Night,
    secondaryContainer = Color(0xFF35524D), onSecondaryContainer = Color(0xFFDAEFEB),
    tertiary = Color(0xFFB4CFC5), onTertiary = Night,
    background = Night, onBackground = Color(0xFFE1EFEB),
    surface = NightSurface, onSurface = Color(0xFFE1EFEB),
    surfaceVariant = Color(0xFF344B48), onSurfaceVariant = Color(0xFFC1D4CE),
    outline = Color(0xFF8DA69F),
    outlineVariant = Color(0xFF4E6660), surfaceTint = Mist,
    surfaceDim = Night, surfaceBright = Color(0xFF3A504C),
    surfaceContainerLowest = Color(0xFF101D1F), surfaceContainerLow = Color(0xFF1B2B2D),
    surfaceContainer = NightSurface, surfaceContainerHigh = Color(0xFF2A3F3C),
    surfaceContainerHighest = Color(0xFF344B48),
    tertiaryContainer = Color(0xFF35524D), onTertiaryContainer = Color(0xFFDAEFEB),
    inverseSurface = Paper, inverseOnSurface = Ink, inversePrimary = Pine,
)
@Composable
fun LiceoMapTheme(mode: ThemeMode = ThemeMode.SYSTEM, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (mode.usesDarkTheme(isSystemInDarkTheme())) DarkColors else LightColors,
        typography = Typography,
        shapes = Shapes(small = RoundedCornerShape(12.dp), medium = RoundedCornerShape(20.dp), large = RoundedCornerShape(28.dp)),
        content = content,
    )
}
