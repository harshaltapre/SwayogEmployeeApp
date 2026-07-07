package com.swayog.employee.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.swayog.employee.presentation.auth.LoginScreen
import com.swayog.employee.presentation.dashboard.DashboardScreen
import com.swayog.employee.presentation.attendance.AttendanceScreen
import com.swayog.employee.presentation.tasks.TasksScreen
import com.swayog.employee.presentation.profile.ProfileScreen
import com.swayog.employee.presentation.settings.SettingsScreen

@Composable
fun SwayogNavHost(
    navController: NavHostController = androidx.navigation.compose.rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToAttendance = {
                    navController.navigate(Screen.Attendance.route)
                },
                onNavigateToTasks = {
                    navController.navigate(Screen.Tasks.route)
                },
                onNavigateToProfile = {
                    navController.navigate(Screen.Profile.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Attendance.route) {
            AttendanceScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.Tasks.route) {
            TasksScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }
    }
}

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object Attendance : Screen("attendance")
    object Tasks : Screen("tasks")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
}
