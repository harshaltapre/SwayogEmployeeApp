package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.swayogemployeeapp.ui.theme.BrandPrimary
import com.example.swayogemployeeapp.ui.theme.BrandSecondary
import com.example.swayogemployeeapp.ui.theme.BrandAccent

@Composable
fun WorkForceLogo(
    modifier: Modifier = Modifier,
    size: Dp = 100.dp
) {
    Canvas(
        modifier = modifier
            .size(size)
            .graphicsLayer {
                shadowElevation = 8f
                shape = androidx.compose.ui.graphics.RectangleShape
                clip = false
            }
    ) {
        val w = this.size.width
        val h = this.size.height

        // 1. Draw the Shield (Indigo to Electric Blue gradient)
        val shieldPath = Path().apply {
            moveTo(w * 0.15f, h * 0.15f)
            lineTo(w * 0.85f, h * 0.15f)
            lineTo(w * 0.85f, h * 0.55f)
            quadraticBezierTo(w * 0.85f, h * 0.8f, w * 0.5f, h * 0.95f)
            quadraticBezierTo(w * 0.15f, h * 0.8f, w * 0.15f, h * 0.55f)
            close()
        }
        
        val shieldGradient = Brush.verticalGradient(
            colors = listOf(BrandPrimary, BrandSecondary)
        )
        
        drawPath(
            path = shieldPath,
            brush = shieldGradient
        )

        // 2. Draw the W monogram cuts to suggest a 'W' inside the shield
        val wMonogramPath = Path().apply {
            moveTo(w * 0.28f, h * 0.32f)
            lineTo(w * 0.36f, h * 0.32f)
            lineTo(w * 0.44f, h * 0.62f)
            lineTo(w * 0.52f, h * 0.32f)
            lineTo(w * 0.60f, h * 0.32f)
            lineTo(w * 0.68f, h * 0.62f)
            lineTo(w * 0.76f, h * 0.32f)
            lineTo(w * 0.82f, h * 0.32f)
            lineTo(w * 0.72f, h * 0.72f)
            lineTo(w * 0.62f, h * 0.72f)
            lineTo(w * 0.50f, h * 0.48f)
            lineTo(w * 0.38f, h * 0.72f)
            lineTo(w * 0.28f, h * 0.72f)
            close()
        }
        
        drawPath(
            path = wMonogramPath,
            color = Color.White.copy(alpha = 0.35f)
        )

        // 3. Draw the progress Arrow (Vibrant Orange)
        val arrowPath = Path().apply {
            moveTo(w * 0.46f, h * 0.42f)
            lineTo(w * 0.66f, h * 0.52f)
            lineTo(w * 0.46f, h * 0.62f)
            lineTo(w * 0.52f, h * 0.52f)
            close()
        }
        
        drawPath(
            path = arrowPath,
            color = BrandAccent
        )
    }
}
