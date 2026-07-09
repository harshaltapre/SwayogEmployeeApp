package com.swayog.employee.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.common.components.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToAttendance: () -> Unit,
    onNavigateToTasks: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToDailyCommit: () -> Unit,
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

    // Live clock state
    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            currentTime = System.currentTimeMillis()
            delay(1000L)
        }
    }

    val timeFormat = remember { SimpleDateFormat("hh:mm:ss a", Locale.getDefault()) }
    val dateFormat = remember { SimpleDateFormat("EEEE, dd MMMM yyyy", Locale.getDefault()) }
    val formattedTime = timeFormat.format(Date(currentTime))
    val formattedDate = dateFormat.format(Date(currentTime))

    // Time-aware greeting
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        hour < 12 -> "Good Morning"
        hour < 17 -> "Good Afternoon"
        else -> "Good Evening"
    }

    val activeTasks = tasks.filter { it.status != "completed" }
    val completedTasks = tasks.filter { it.status == "completed" }

    // Work timer calculation
    val workDurationText = remember(todayAttendance, currentTime) {
        val attendance = todayAttendance ?: return@remember null
        val checkInStr = attendance.checkInTime ?: return@remember null
        try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val checkInDate = isoFormat.parse(checkInStr.substringBefore(".")) ?: return@remember null
            val endTime = if (attendance.checkOutTime != null) {
                isoFormat.parse(attendance.checkOutTime.substringBefore("."))?.time ?: currentTime
            } else {
                currentTime
            }
            val diffMs = endTime - checkInDate.time
            val hours = (diffMs / 3600000).toInt()
            val minutes = ((diffMs % 3600000) / 60000).toInt()
            val seconds = ((diffMs % 60000) / 1000).toInt()
            String.format("%02d:%02d:%02d", hours, minutes, seconds)
        } catch (_: Exception) { null }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Dashboard",
                actions = {
                    IconButton(onClick = { viewModel.retryLoading() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
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
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Welcome Section with Live Clock
                        item {
                            Column {
                                Text(
                                    text = "$greeting, ${userName?.split(" ")?.firstOrNull() ?: "User"} 👋",
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                val displayRole = jobRole ?: when (userRole?.uppercase()) {
                                    "SUPER_ADMIN" -> "Super Admin"
                                    "ADMIN" -> "Admin"
                                    "SUB_ADMIN" -> "Service Coordinator"
                                    "TEAM_LEAD" -> "Team Lead"
                                    "DEPARTMENT_HEAD" -> "Department Head"
                                    else -> "Employee"
                                }
                                Text(
                                    text = displayRole,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = formattedDate,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }

                        // Live Clock + Work Timer Card
                        item {
                            SwayogCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = formattedTime,
                                            style = MaterialTheme.typography.headlineLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary,
                                            letterSpacing = 2.sp
                                        )
                                        Text(
                                            text = "Current Time",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                    // Attendance Status Badge
                                    val attendance = todayAttendance
                                    val (badgeText, badgeColor) = when {
                                        attendance == null -> "Not Checked In" to MaterialTheme.colorScheme.error
                                        attendance.checkOutTime != null -> "Checked Out" to MaterialTheme.colorScheme.tertiary
                                        else -> "Checked In ✓" to MaterialTheme.colorScheme.primary
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Surface(
                                            color = badgeColor.copy(alpha = 0.15f),
                                            shape = RoundedCornerShape(20.dp)
                                        ) {
                                            Text(
                                                text = badgeText,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = badgeColor
                                            )
                                        }
                                        if (workDurationText != null) {
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "⏱ $workDurationText",
                                                style = MaterialTheme.typography.bodySmall,
                                                fontWeight = FontWeight.Medium,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                            )
                                        }
                                    }
                                }
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

                        // Quick Navigation Grid
                        item {
                            Text(
                                text = "Quick Actions",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                QuickActionCard(
                                    icon = Icons.Default.Fingerprint,
                                    label = "Attendance",
                                    color = MaterialTheme.colorScheme.primary,
                                    onClick = onNavigateToAttendance,
                                    modifier = Modifier.weight(1f)
                                )
                                QuickActionCard(
                                    icon = Icons.Default.Assignment,
                                    label = "Tasks",
                                    color = MaterialTheme.colorScheme.secondary,
                                    onClick = onNavigateToTasks,
                                    modifier = Modifier.weight(1f)
                                )
                                QuickActionCard(
                                    icon = Icons.Default.EditNote,
                                    label = "Timesheets",
                                    color = MaterialTheme.colorScheme.tertiary,
                                    onClick = onNavigateToDailyCommit,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        // My Tasks Section
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Active Tasks",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                TextButton(onClick = onNavigateToTasks) {
                                    Text("See All")
                                }
                            }
                            if (activeTasks.isEmpty()) {
                                SwayogCard {
                                    Text(
                                        text = "No active tasks assigned.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }
                            } else {
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    activeTasks.take(3).forEach { task ->
                                        TaskItem(task = task)
                                    }
                                }
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
                                                    "Checked in at ${attendance.checkInTime.substringAfter("T").substringBefore(".")}"
                                                } else {
                                                    "Not checked in yet"
                                                },
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                            )
                                            if (attendance.checkOutTime != null) {
                                                Text(
                                                    text = "Checked out at ${attendance.checkOutTime.substringAfter("T").substringBefore(".")}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                                )
                                            }
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

                        // Daily Commit Card
                        item {
                            SwayogCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "Daily Commit Log",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "Log tasks, hours & blockers",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                    Button(onClick = onNavigateToDailyCommit) {
                                        Text("Timesheets")
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
                                            text = "Monthly Performance",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceEvenly
                                        ) {
                                            PerformanceStat(
                                                value = "${perf.performanceScore}/5",
                                                label = "Score",
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            PerformanceStat(
                                                value = "${perf.attendancePercent}%",
                                                label = "Attendance",
                                                color = MaterialTheme.colorScheme.secondary
                                            )
                                            PerformanceStat(
                                                value = "${perf.taskCompletionRate}%",
                                                label = "Completion",
                                                color = MaterialTheme.colorScheme.tertiary
                                            )
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

                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PerformanceStat(
    value: String,
    label: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineMedium,
            color = color,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}

@Composable
fun QuickActionCard(
    icon: ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(90.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = color,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
        }
    }
}

@Composable
fun TaskItem(task: com.swayog.employee.data.model.Task) {
    val jobTypeEmoji = when (task.jobType.lowercase()) {
        "installation" -> "🔧"
        "service" -> "🛠️"
        "amc visit" -> "📋"
        "complaint" -> "⚠️"
        "survey" -> "📐"
        else -> "📌"
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(text = jobTypeEmoji, fontSize = 16.sp)
                Text(
                    text = task.jobType,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
            }
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
                Spacer(modifier = Modifier.weight(1f))
                val statusColor = when (task.status.lowercase()) {
                    "completed" -> MaterialTheme.colorScheme.primary
                    "in_progress" -> Color(0xFFFF9800)
                    "assigned" -> Color(0xFF2196F3)
                    else -> MaterialTheme.colorScheme.error
                }
                Surface(
                    color = statusColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = task.status.replace("_", " ").replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}
