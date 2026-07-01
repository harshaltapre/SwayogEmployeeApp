package com.example.swayogemployeeapp.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp

// ── Google Material Design 3 Shapes ──

val PillShape = RoundedCornerShape(999.dp)           // Fully rounded / Pill-shaped buttons
val CardShape = RoundedCornerShape(8.dp)              // Standard card border radius
val LargeCardShape = RoundedCornerShape(12.dp)        // Large container border radius
val Material3CardShape = RoundedCornerShape(24.dp)   // Material 3 style large containers
val InputFieldShape = RoundedCornerShape(8.dp)         // Input field corners

private val WorkForceDarkColorScheme = darkColorScheme(
    primary = GoogleBlue,
    secondary = GoogleBlue,
    tertiary = GoogleGreen,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = PrimaryTextDark,
    onSurface = PrimaryTextDark,
    onSurfaceVariant = SecondaryTextDark,
    outline = DividerDark,
    error = GoogleRed
)

private val WorkForceLightColorScheme = lightColorScheme(
    primary = GoogleBlue,
    secondary = GoogleBlue,
    tertiary = GoogleGreen,
    background = BackgroundLight,
    surface = SurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = PrimaryTextLight,
    onSurface = PrimaryTextLight,
    onSurfaceVariant = SecondaryTextLight,
    outline = DividerLight,
    error = GoogleRed
)

@Composable
fun SwayogEmployeeAppTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        WorkForceDarkColorScheme
    } else {
        WorkForceLightColorScheme
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