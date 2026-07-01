package com.example.swayogemployeeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.ui.screens.AttendanceScreen
import com.example.swayogemployeeapp.ui.screens.DashboardRouter
import com.example.swayogemployeeapp.ui.screens.LoginScreen
import com.example.swayogemployeeapp.ui.screens.MainViewModel
import com.example.swayogemployeeapp.ui.screens.SplashScreen
import com.example.swayogemployeeapp.ui.theme.SwayogEmployeeAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SwayogEmployeeAppTheme {
                val navController = rememberNavController()
                val mainViewModel: MainViewModel = viewModel()
                val session by mainViewModel.session.collectAsState()

                // Check active session routing on logout
                LaunchedEffect(session) {
                    val currentRoute = navController.currentDestination?.route
                    if (session == null && currentRoute != null && currentRoute != "splash" && currentRoute != "login") {
                        navController.navigate("login") {
                            popUpTo(0)
                        }
                    }
                }

                NavHost(navController = navController, startDestination = "splash") {
                    composable("splash") {
                        SplashScreen {
                            if (session == null) {
                                navController.navigate("login") {
                                    popUpTo("splash") { inclusive = true }
                                }
                            } else {
                                mainViewModel.syncAllDataFromServer()
                                navController.navigate("attendance") {
                                    popUpTo("splash") { inclusive = true }
                                }
                            }
                        }
                    }
                    composable("login") {
                        LoginScreen(viewModel = mainViewModel) {
                            navController.navigate("attendance") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                    }
                    composable("attendance") {
                        AttendanceScreen(
                            viewModel = mainViewModel,
                            onNavigateToDashboard = {
                                navController.navigate("dashboard")
                            },
                            onLogout = {
                                mainViewModel.logout()
                            }
                        )
                    }
                    composable("dashboard") {
                        DashboardRouter(
                            viewModel = mainViewModel,
                            onNavigateBackToClock = {
                                navController.popBackStack()
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