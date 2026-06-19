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

                // Seed database with mock tasks on initial startup for verification
                LaunchedEffect(Unit) {
                    mainViewModel.assignTaskLocally(
                        EmployeeTaskEntity(
                            id = 101,
                            jobType = "Survey",
                            description = "Intake rooftop measurements and shading factor checklists",
                            scheduledTime = "2026-06-19T09:00:00Z",
                            status = "assigned",
                            customerName = "John Doe",
                            customerPhone = "+91 98765 43210",
                            address = "Plot 12, Sector 8, Kopar Khairane, Navi Mumbai",
                            latitude = 19.117,
                            longitude = 72.999,
                            completionMessage = null,
                            completionDocumentUrl = null,
                            completedAt = null
                        )
                    )
                    mainViewModel.assignTaskLocally(
                        EmployeeTaskEntity(
                            id = 102,
                            jobType = "Installation",
                            description = "Perform earthing checks, Megger cable test, net-meter verification",
                            scheduledTime = "2026-06-19T11:30:00Z",
                            status = "assigned",
                            customerName = "Jane Smith",
                            customerPhone = "+91 88776 65544",
                            address = "Tower C, 1404 Orchid Heights, Mahalaxmi, Mumbai",
                            latitude = 18.981,
                            longitude = 72.829,
                            completionMessage = null,
                            completionDocumentUrl = null,
                            completedAt = null
                        )
                    )
                    mainViewModel.assignTaskLocally(
                        EmployeeTaskEntity(
                            id = 103,
                            jobType = "AMC Visit",
                            description = "Scheduled panels washing & clamp structural tight auditing",
                            scheduledTime = "2026-06-19T14:00:00Z",
                            status = "assigned",
                            customerName = "Rajesh Kumar",
                            customerPhone = "+91 99338 84433",
                            address = "Bunglow 4, Road 11, Juhu Scheme, Mumbai",
                            latitude = 19.102,
                            longitude = 72.825,
                            completionMessage = null,
                            completionDocumentUrl = null,
                            completedAt = null
                        )
                    )
                    mainViewModel.assignTaskLocally(
                        EmployeeTaskEntity(
                            id = 104,
                            jobType = "Complaint",
                            description = "Client complaint: Inverter Red light Error 117 (PV Voc High)",
                            scheduledTime = "2026-06-19T16:30:00Z",
                            status = "assigned",
                            customerName = "Amit Patel",
                            customerPhone = "+91 77665 54433",
                            address = "Charkop Ind Area, Kandivali West, Mumbai",
                            latitude = 19.208,
                            longitude = 72.831,
                            completionMessage = null,
                            completionDocumentUrl = null,
                            completedAt = null
                        )
                    )
                    
                    // Seed initial inventory stock items
                    mainViewModel.addInventoryItem(
                        InventoryItemEntity("itm_001", "Mono PERC 450W Solar Panels", "Module", 124.0, "Units", "HASH_PANEL_MONO")
                    )
                    mainViewModel.addInventoryItem(
                        InventoryItemEntity("itm_002", "Growatt 5000TL3-S Inverter", "Inverter", 12.0, "Pcs", "HASH_INV_GWT5000")
                    )
                    mainViewModel.addInventoryItem(
                        InventoryItemEntity("itm_003", "4sqmm DC Red Solar Cable", "Cable", 1200.0, "Meters", "HASH_CABLE_DC_4")
                    )
                    mainViewModel.addInventoryItem(
                        InventoryItemEntity("itm_004", "Galvanized Solar Structure Brackets", "Structure", 3.0, "Sets", "HASH_STRUCT_BRACKET")
                    )
                    mainViewModel.addInventoryItem(
                        InventoryItemEntity("itm_005", "MC4 Branch Connectors", "BOS", 80.0, "Pairs", "HASH_BOS_MC4")
                    )
                }

                // Check active session routing on launch
                LaunchedEffect(session) {
                    if (session == null) {
                        navController.navigate("login") {
                            popUpTo(0)
                        }
                    } else {
                        navController.navigate("attendance") {
                            popUpTo(0)
                        }
                    }
                }

                NavHost(navController = navController, startDestination = "login") {
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