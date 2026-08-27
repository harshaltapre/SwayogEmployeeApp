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
import com.swayog.employee.presentation.common.LocalCompactViewEnabled
import com.swayog.employee.presentation.common.LocalAnimationsEnabled

@AndroidEntryPoint
class MainActivity : androidx.fragment.app.FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val mainViewModel: MainViewModel = hiltViewModel()
            val isLoggedIn by mainViewModel.isLoggedIn.collectAsState()
            val userRole by mainViewModel.userRole.collectAsState()
            val jobRole by mainViewModel.jobRole.collectAsState()
            val darkMode by mainViewModel.darkMode.collectAsState()
            val compactViewEnabled by mainViewModel.compactViewEnabled.collectAsState()
            val animationsEnabled by mainViewModel.animationsEnabled.collectAsState()

            CompositionLocalProvider(
                LocalCompactViewEnabled provides compactViewEnabled,
                LocalAnimationsEnabled provides animationsEnabled
            ) {
                SwayogEmployeeAppTheme(darkTheme = darkMode) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        SwayogNavHost(
                            isLoggedIn = isLoggedIn,
                            userRole = userRole,
                            jobRole = jobRole,
                            startDestination = if (isLoggedIn) {
                                com.swayog.employee.presentation.navigation.Screen.Dashboard.route
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
