package com.example.swayogemployeeapp.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView

private val AmberCleanTechColorScheme = darkColorScheme(
    primary = PrimaryAmber,
    secondary = EngineeringBlue,
    tertiary = SuccessGreen,
    background = BackgroundDark,
    surface = SurfaceDark,
    onPrimary = BackgroundDark,
    onSecondary = NeutralText,
    onTertiary = NeutralText,
    onBackground = NeutralText,
    onSurface = NeutralText,
    outline = BorderGray
)

// A high-contrast light fallback that preserves high-visibility outdoors
private val LightCleanTechColorScheme = lightColorScheme(
    primary = PrimaryAmber,
    secondary = EngineeringBlue,
    tertiary = SuccessGreen,
    background = NeutralText,
    surface = NeutralText,
    onPrimary = BackgroundDark,
    onSecondary = BackgroundDark,
    onTertiary = BackgroundDark,
    onBackground = BackgroundDark,
    onSurface = BackgroundDark,
    outline = BorderGray
)

@Composable
fun SwayogEmployeeAppTheme(
    darkTheme: Boolean = true, // Force dark mode for energy-efficient CleanTech styling
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        AmberCleanTechColorScheme
    } else {
        LightCleanTechColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}