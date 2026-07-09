package com.swayog.employee.presentation.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.common.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToAttendance: () -> Unit,
    onNavigateToTasks: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    val userName by viewModel.userName.collectAsState()
    val userRole by viewModel.userRole.collectAsState()
    val jobRole by viewModel.jobRole.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val performance by viewModel.performance.collectAsState()
    
    var workDescription by remember { mutableStateOf("") }
    
    val activeTasks = tasks.filter { it.status != "completed" }
    val completedTasks = tasks.filter { it.status == "completed" }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Dashboard",
                actions = {
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(Icons.Default.Person, contentDescription = "Profile")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        }
    ) { paddingValues ->
        when (dashboardState) {
            is DashboardState.Loading -> {
                LoadingScreen(
                    modifier = Modifier.padding(paddingValues),
                    message = "Loading dashboard..."
                )
            }
            
            is DashboardState.Error -> {
                ErrorScreen(
                    message = (dashboardState as DashboardState.Error).message,
                    onRetry = viewModel::retryLoading,
                    modifier = Modifier.padding(paddingValues)
                )
            }
            
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Welcome Section
                    item {
                        Column {
                            Text(
                                text = "Hi, ${userName ?: "User"} 👋",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold
                            )
                            val displayRole = jobRole ?: when (userRole?.uppercase()) {
                                "SUPER_ADMIN" -> "Super Admin"
                                "ADMIN" -> "Admin"
                                "SUB_ADMIN" -> "Service Coordinator"
                                else -> "Employee"
                            }
                            Text(
                                text = "Role: $displayRole",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Here's your overview for today",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    
                    // Stats Cards
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            SwayogStatCard(
                                title = "Active",
                                value = activeTasks.size.toString(),
                                modifier = Modifier.weight(1f),
                                backgroundColor = MaterialTheme.colorScheme.primary
                            )
                            SwayogStatCard(
                                title = "Completed",
                                value = completedTasks.size.toString(),
                                contentColor = MaterialTheme.colorScheme.onSecondary,
                                modifier = Modifier.weight(1f),
                                backgroundColor = MaterialTheme.colorScheme.secondary
                            )
                            SwayogStatCard(
                                title = "Total",
                                value = tasks.size.toString(),
                                modifier = Modifier.weight(1f),
                                backgroundColor = MaterialTheme.colorScheme.tertiary
                            )
                        }
                    }
                    
                    // Attendance Card
                    item {
                        SwayogCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Today's Attendance",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    val attendance = todayAttendance
                                    if (attendance != null) {
                                        Text(
                                            text = if (attendance.checkInTime != null) {
                                                "Checked in at ${attendance.checkInTime}"
                                            } else {
                                                "Not checked in yet"
                                            },
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    } else {
                                        Text(
                                            text = "No attendance record",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Button(
                                    onClick = onNavigateToAttendance,
                                    modifier = Modifier.wrapContentWidth()
                                ) {
                                    Text(
                                        text = "View Details",
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                    
                    // Performance Card
                    item {
                        val perf = performance
                        if (perf != null) {
                            SwayogCard {
                                Column {
                                    Text(
                                        text = "Performance Score",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(24.dp)
                                    ) {
                                        Column {
                                            Text(
                                                text = "${perf.performanceScore}/5",
                                                style = MaterialTheme.typography.headlineMedium,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = "Score",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                            )
                                        }
                                        Column {
                                            Text(
                                                text = "${perf.attendancePercent}%",
                                                style = MaterialTheme.typography.headlineMedium,
                                                color = MaterialTheme.colorScheme.secondary
                                            )
                                            Text(
                                                text = "Attendance",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Active Tasks
                    item {
                        SwayogCard {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "My Tasks",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    TextButton(onClick = onNavigateToTasks) {
                                        Text("View All")
                                    }
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                if (activeTasks.isEmpty()) {
                                    Text(
                                        text = "No active tasks",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                } else {
                                    activeTasks.take(3).forEach { task ->
                                        TaskItem(task = task)
                                        Spacer(modifier = Modifier.height(8.dp))
                                    }
                                }
                            }
                        }
                    }
                    
                    // Quick Work Update
                    item {
                        SwayogCard {
                            Column {
                                Text(
                                    text = "Quick Work Update",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                OutlinedTextField(
                                    value = workDescription,
                                    onValueChange = { workDescription = it },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(120.dp),
                                    placeholder = {
                                        Text("What are you working on right now?")
                                    },
                                    minLines = 3,
                                    maxLines = 5
                                )
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                SwayogButton(
                                    text = "Send Update",
                                    onClick = {
                                        if (workDescription.isNotBlank()) {
                                            viewModel.saveWorkDescription(workDescription)
                                            workDescription = ""
                                        }
                                    },
                                    enabled = workDescription.isNotBlank()
                                )
                            }
                        }
                    }
                    
                    // Logout Button
                    item {
                        SwayogButton(
                            text = "Logout",
                            onClick = onLogout,
                            variant = ButtonVariant.Secondary
                        )
                    }
                    
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun TaskItem(task: com.swayog.employee.data.model.Task) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = task.jobType,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = task.customerName,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Text(
                    text = task.scheduledTime,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
        }
    }
}
