package com.swayog.employee.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.navigation.SwayogNavHost
import com.swayog.employee.ui.theme.SwayogEmployeeAppTheme
import dagger.hilt.android.AndroidEntryPoint

import androidx.compose.runtime.CompositionLocalProvider
import com.swayog.employee.presentation.common.   LocalCompactViewEnabled
import com.swayog.employee.presentation.common.LocalAnimationsEnabled

import androidx.activity.viewModels

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@AndroidEntryPoint
class MainActivity : androidx.fragment.app.FragmentActivity() {
    private val mainViewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val isLoggedIn by mainViewModel.isLoggedIn.collectAsState()
            val userRole by mainViewModel.userRole.collectAsState()
            val jobRole by mainViewModel.jobRole.collectAsState()
            val darkMode by mainViewModel.darkMode.collectAsState()
            val compactViewEnabled by mainViewModel.compactViewEnabled.collectAsState()
            val animationsEnabled by mainViewModel.animationsEnabled.collectAsState()

            val isInventoryCoordinator = androidx.compose.runtime.remember(userRole, jobRole) {
                val normalizedJob = jobRole?.lowercase()?.replace(" ", "")?.replace("-", "") ?: ""
                val normalizedRole = userRole?.lowercase()?.replace(" ", "")?.replace("-", "") ?: ""
                normalizedJob.contains("inventory") || normalizedRole.contains("inventory")
            }

            val windowSizeInfo = com.swayog.employee.presentation.common.responsive.rememberWindowSizeInfo()

            CompositionLocalProvider(
                LocalCompactViewEnabled provides compactViewEnabled,
                LocalAnimationsEnabled provides animationsEnabled,
                com.swayog.employee.presentation.common.responsive.LocalWindowSizeInfo provides windowSizeInfo
            ) {
                SwayogEmployeeAppTheme(darkTheme = darkMode) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        if (isLoggedIn == null) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(16.dp)
                                ) {
                                    androidx.compose.foundation.Image(
                                        painter = androidx.compose.ui.res.painterResource(id = com.swayog.employee.R.drawable.app_logo),
                                        contentDescription = "SWAYOG Logo",
                                        modifier = Modifier
                                            .size(90.dp)
                                            .clip(androidx.compose.foundation.shape.RoundedCornerShape(18.dp))
                                    )
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(28.dp),
                                        strokeWidth = 2.5.dp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        } else {
                            SwayogNavHost(
                                isLoggedIn = isLoggedIn == true,
                                userRole = userRole,
                                jobRole = jobRole,
                                startDestination = if (isLoggedIn == true) {
                                    if (isInventoryCoordinator) {
                                        com.swayog.employee.presentation.navigation.Screen.InventoryCoordinator.route
                                    } else {
                                        com.swayog.employee.presentation.navigation.Screen.Dashboard.route
                                    }
                                } else {
                                    com.swayog.employee.presentation.navigation.Screen.Login.route
                                },
                                onLogout = {
                                    mainViewModel.logout()
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        mainViewModel.onAppForegrounded()
    }
}
