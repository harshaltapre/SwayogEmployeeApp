package com.example.swayogemployeeapp.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.BackgroundDark
import com.example.swayogemployeeapp.ui.theme.BrandAccent
import com.example.swayogemployeeapp.ui.theme.BrandPrimary
import com.example.swayogemployeeapp.ui.theme.BrandSecondary
import com.example.swayogemployeeapp.ui.theme.NeutralText
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onSplashFinished: () -> Unit
) {
    // Entrance animations
    val entranceTransition = remember { Animatable(0f) }
    
    // Pulse animation once entrance finishes
    val infiniteTransition = rememberInfiniteTransition(label = "logoPulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    var taglineAlpha by remember { mutableStateOf(0f) }

    LaunchedEffect(Unit) {
        // Run entrance scale-up and fade-in
        entranceTransition.animateTo(
            targetValue = 1f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
        // Fade in tagline
        taglineAlpha = 1f
        
        delay(1500)
        onSplashFinished()
    }

    val animatedTaglineAlpha by animateFloatAsState(
        targetValue = taglineAlpha,
        animationSpec = tween(800, easing = LinearOutSlowInEasing),
        label = "taglineFade"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        BrandPrimary.copy(alpha = 0.25f),
                        BackgroundDark
                    ),
                    radius = 1800f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            // Apply both entrance scale and pulse scale
            Box(
                modifier = Modifier
                    .scale(entranceTransition.value * pulseScale)
                    .alpha(entranceTransition.value)
                    .padding(bottom = 28.dp)
            ) {
                WorkForceLogo(size = 120.dp)
            }

            Text(
                text = "WorkForce Pro",
                color = NeutralText,
                fontSize = 34.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.5.sp,
                modifier = Modifier.alpha(entranceTransition.value)
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Empowering Teams • Simplifying Workflows",
                color = NeutralText.copy(alpha = 0.65f),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                modifier = Modifier.alpha(animatedTaglineAlpha)
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 64.dp)
        ) {
            CircularProgressIndicator(
                color = BrandAccent,
                strokeWidth = 3.5.dp,
                modifier = Modifier.size(38.dp)
            )
        }
    }
}
