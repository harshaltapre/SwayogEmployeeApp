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
import com.swayog.employee.presentation.dailycommit.DailyCommitScreen
import com.swayog.employee.presentation.subadmin.*
import com.swayog.employee.presentation.attendance.face.FaceEnrollmentScreen

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
                popUpTo(0) { inclusive = true }
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
                onNavigateToDailyCommit = {
                    navController.navigate(Screen.DailyCommit.route)
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
        
        composable(Screen.DailyCommit.route) {
            DailyCommitScreen(
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
                SubAdminEmployeesScreen()
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
}
