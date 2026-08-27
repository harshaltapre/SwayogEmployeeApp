package com.swayog.employee.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import com.swayog.employee.presentation.auth.LoginScreen
import com.swayog.employee.presentation.dashboard.DashboardScreen
import com.swayog.employee.presentation.attendance.AttendanceScreen
import com.swayog.employee.presentation.tasks.TasksScreen
import com.swayog.employee.presentation.profile.ProfileScreen
import com.swayog.employee.presentation.settings.SettingsScreen
import com.swayog.employee.presentation.dailycommit.DailyCommitScreen
import com.swayog.employee.presentation.subadmin.*
import com.swayog.employee.presentation.attendance.face.FaceEnrollmentScreen
import com.swayog.employee.presentation.inverter.InverterDataScreen

import com.swayog.employee.presentation.notifications.NotificationsScreen

@Composable
fun SwayogNavHost(
    navController: NavHostController = androidx.navigation.compose.rememberNavController(),
    startDestination: String = Screen.Login.route,
    isLoggedIn: Boolean = true,
    userRole: String? = null,
    jobRole: String? = null,
    onLogout: () -> Unit = {}
) {
    val isServiceCoordinator = androidx.compose.runtime.remember(userRole, jobRole) {
        userRole?.uppercase() == "SUB_ADMIN" || jobRole?.replace(" ", "")?.lowercase() == "servicecoordinator"
    }
    androidx.compose.runtime.LaunchedEffect(isLoggedIn) {
        if (!isLoggedIn && navController.currentDestination?.route != Screen.Login.route) {
            navController.navigate(Screen.Login.route) {
                popUpTo(navController.graph.id) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
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
            // Obtain the ViewModel here so we can call refreshTodayAttendance() every time
            // the Dashboard destination resumes (i.e. the user pops back from Attendance etc.).
            val dashboardViewModel: com.swayog.employee.presentation.dashboard.DashboardViewModel = hiltViewModel()

            // currentBackStackEntry changes whenever this destination comes to the top.
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            LaunchedEffect(navBackStackEntry) {
                if (navController.currentDestination?.route == Screen.Dashboard.route) {
                    dashboardViewModel.refreshTodayAttendance()
                }
            }

            DashboardScreen(
                viewModel = dashboardViewModel,
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
                onNavigateToDailyCommit = {
                    navController.navigate(Screen.DailyCommit.route)
                },
                onNavigateToNotifications = {
                    navController.navigate(Screen.Notifications.route)
                },
                onNavigateToSubAdminCustomers = {
                    navController.navigate(Screen.SubAdminCustomers.route)
                },
                onNavigateToSubAdminCustomerDetails = { customerId ->
                    navController.navigate("subadmin_customer_details/$customerId")
                },
                onNavigateToSubAdminComplaints = {
                    navController.navigate(Screen.SubAdminComplaints.route)
                },
                onNavigateToSubAdminCalendar = {
                    navController.navigate(Screen.SubAdminCalendar.route)
                },
                onNavigateToSubAdminEmployees = {
                    navController.navigate(Screen.SubAdminEmployees.route)
                },
                onNavigateToSubAdminFinancials = {
                    navController.navigate(Screen.SubAdminFinancials.route)
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
                onNavigateBack = { navController.popBackStack() },
                onNavigateToFaceEnrollment = { navController.navigate(Screen.FaceEnrollment.route) },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                    onLogout()
                }
            )
        }
        
        composable(Screen.FaceEnrollment.route) {
            FaceEnrollmentScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.InverterData.route) {
            InverterDataScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.DailyCommit.route) {
            DailyCommitScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Notifications.route) {
            NotificationsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        if (isServiceCoordinator) {
            composable(Screen.SubAdminCustomers.route) {
                SubAdminCustomersScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToDetails = { customerId ->
                        navController.navigate("subadmin_customer_details/$customerId")
                    }
                )
            }

            composable(
                route = Screen.SubAdminCustomerDetails.route,
                arguments = listOf(
                    androidx.navigation.navArgument("customerId") {
                        type = androidx.navigation.NavType.IntType
                    }
                )
            ) {
                SubAdminCustomerDetailsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SubAdminComplaints.route) {
                SubAdminComplaintsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SubAdminCalendar.route) {
                SubAdminCalendarScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SubAdminMap.route) {
                SubAdminMapScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SubAdminEmployees.route) {
                SubAdminEmployeesScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SubAdminFinancials.route) {
                SubAdminFinancialsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Dashboard : Screen("dashboard")
    data object Attendance : Screen("attendance")
    data object Tasks : Screen("tasks")
    data object Profile : Screen("profile")
    data object Settings : Screen("settings")
    data object DailyCommit : Screen("daily_commit")
    data object Notifications : Screen("notifications")
    data object SubAdminCustomers : Screen("subadmin_customers")
    data object SubAdminCustomerDetails : Screen("subadmin_customer_details/{customerId}") {
        fun createRoute(customerId: Int) = "subadmin_customer_details/$customerId"
    }
    data object SubAdminComplaints : Screen("subadmin_complaints")
    data object SubAdminCalendar : Screen("subadmin_calendar")
    data object SubAdminMap : Screen("subadmin_map")
    data object SubAdminEmployees : Screen("subadmin_employees")
    data object SubAdminFinancials : Screen("subadmin_financials")
    data object FaceEnrollment : Screen("face_enrollment")
    data object InverterData : Screen("inverter_data")
}
