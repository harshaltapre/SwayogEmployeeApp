package com.swayog.employee.presentation.common.responsive

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class WindowWidthSizeClass {
    Compact,   // < 600dp (most phones in portrait)
    Medium,    // 600dp - 839dp (small tablets, large foldables, landscape phones)
    Expanded   // >= 840dp (large tablets, desktop / wide displays)
}

enum class WindowHeightSizeClass {
    Compact,   // < 480dp (phones in landscape)
    Medium,    // 480dp - 899dp (standard phone portrait & tablets)
    Expanded   // >= 900dp (tall tablets)
}

data class WindowSizeInfo(
    val widthSizeClass: WindowWidthSizeClass,
    val heightSizeClass: WindowHeightSizeClass,
    val screenWidthDp: Dp,
    val screenHeightDp: Dp,
    val isLandscape: Boolean,
    val isTablet: Boolean,
    val isCompact: Boolean,
    val contentPadding: Dp,
    val cardSpacing: Dp,
    val maxContentWidth: Dp
)

val LocalWindowSizeInfo = compositionLocalOf<WindowSizeInfo> {
    WindowSizeInfo(
        widthSizeClass = WindowWidthSizeClass.Compact,
        heightSizeClass = WindowHeightSizeClass.Medium,
        screenWidthDp = 360.dp,
        screenHeightDp = 640.dp,
        isLandscape = false,
        isTablet = false,
        isCompact = true,
        contentPadding = 16.dp,
        cardSpacing = 12.dp,
        maxContentWidth = 600.dp
    )
}

@Composable
fun rememberWindowSizeInfo(): WindowSizeInfo {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp.dp
    val screenHeight = configuration.screenHeightDp.dp
    val isLandscape = configuration.screenWidthDp > configuration.screenHeightDp

    val widthSizeClass = when {
        configuration.screenWidthDp < 600 -> WindowWidthSizeClass.Compact
        configuration.screenWidthDp < 840 -> WindowWidthSizeClass.Medium
        else -> WindowWidthSizeClass.Expanded
    }

    val heightSizeClass = when {
        configuration.screenHeightDp < 480 -> WindowHeightSizeClass.Compact
        configuration.screenHeightDp < 900 -> WindowHeightSizeClass.Medium
        else -> WindowHeightSizeClass.Expanded
    }

    val isTablet = widthSizeClass != WindowWidthSizeClass.Compact
    val isCompact = configuration.screenWidthDp < 360

    val contentPadding = when {
        isCompact -> 10.dp
        widthSizeClass == WindowWidthSizeClass.Compact -> 16.dp
        widthSizeClass == WindowWidthSizeClass.Medium -> 24.dp
        else -> 32.dp
    }

    val cardSpacing = when {
        isCompact -> 8.dp
        widthSizeClass == WindowWidthSizeClass.Compact -> 12.dp
        else -> 16.dp
    }

    val maxContentWidth = when (widthSizeClass) {
        WindowWidthSizeClass.Compact -> Dp.Unspecified
        WindowWidthSizeClass.Medium -> 720.dp
        WindowWidthSizeClass.Expanded -> 960.dp
    }

    return remember(configuration.screenWidthDp, configuration.screenHeightDp) {
        WindowSizeInfo(
            widthSizeClass = widthSizeClass,
            heightSizeClass = heightSizeClass,
            screenWidthDp = screenWidth,
            screenHeightDp = screenHeight,
            isLandscape = isLandscape,
            isTablet = isTablet,
            isCompact = isCompact,
            contentPadding = contentPadding,
            cardSpacing = cardSpacing,
            maxContentWidth = maxContentWidth
        )
    }
}

/**
 * A container that centers and constrains maximum width on wide displays (tablets/landscape)
 * while maintaining full-bleed layout on mobile phones.
 */
@Composable
fun ResponsiveContentContainer(
    modifier: Modifier = Modifier,
    maxWidth: Dp? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val windowSize = LocalWindowSizeInfo.current
    val targetMaxWidth = maxWidth ?: windowSize.maxContentWidth

    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = if (windowSize.isTablet) Alignment.TopCenter else Alignment.TopStart
    ) {
        Box(
            modifier = if (targetMaxWidth != Dp.Unspecified && windowSize.isTablet) {
                Modifier.widthIn(max = targetMaxWidth).fillMaxWidth()
            } else {
                Modifier.fillMaxWidth()
            },
            content = content
        )
    }
}
