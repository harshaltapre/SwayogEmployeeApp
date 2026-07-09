package com.swayog.employee.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Primary,                  // Golden Honey
    secondary = Secondary,              // Warm Brown
    tertiary = PrimaryLight,            // Beeswax Yellow
    background = Color(0xFF1E1712),     // Honeycomb dark brown-black
    surface = Color(0xFF2C221A),        // Dark brown surface card
    surfaceVariant = Color(0xFF3B2F25),
    onPrimary = Color(0xFF1E1712),      // Dark brown text on gold primary
    onSecondary = Color.White,          // White text on brown secondary
    onTertiary = Color(0xFF1E1712),
    onBackground = Color(0xFFFFFDD0),   // Soft cream text
    onSurface = Color(0xFFFFFDD0),      // Soft cream text
    onSurfaceVariant = Color(0xFFD6C8B5)
)

private val LightColorScheme = lightColorScheme(
    primary = Primary,                  // Golden Honey
    secondary = Secondary,              // Warm Brown
    tertiary = PrimaryLight,            // Beeswax Yellow
    background = Background,            // Soft Cream
    surface = Surface,                  // White
    surfaceVariant = SurfaceVariant,    // Beeswax Cream Variant
    onPrimary = Color(0xFF3E2718),      // Dark Brown text on golden primary
    onSecondary = Color.White,          // White text on brown secondary
    onTertiary = Color(0xFF3E2718),
    onBackground = TextPrimary,         // Premium Dark Brown text
    onSurface = TextPrimary,            // Premium Dark Brown text
    onSurfaceVariant = TextSecondary
)

@Composable
fun SwayogEmployeeAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
