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
)
internal val DarkColors = darkColorScheme(
    primary = Mist, onPrimary = Night,
    primaryContainer = Pine, onPrimaryContainer = Color(0xFFDAEFEB),
    secondary = Color(0xFFA4C7BF), onSecondary = Night,
    secondaryContainer = Color(0xFF35524D), onSecondaryContainer = Color(0xFFDAEFEB),
    tertiary = Color(0xFFB4CFC5), onTertiary = Night,
    background = Night, onBackground = Color(0xFFE1EFEB),
    surface = NightSurface, onSurface = Color(0xFFE1EFEB),
    surfaceVariant = Color(0xFF344B48), onSurfaceVariant = Color(0xFFC1D4CE),
    outline = Color(0xFF8DA69F),
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
