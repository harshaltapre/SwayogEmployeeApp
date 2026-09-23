package com.swayog.employee.presentation.dailycommit

import android.app.DatePickerDialog
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.common.components.*
import java.text.SimpleDateFormat
import java.util.*

import com.swayog.employee.presentation.common.responsive.ResponsiveContentContainer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyCommitScreen(
    onNavigateBack: () -> Unit,
    viewModel: DailyCommitViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val state by viewModel.dailyCommitState.collectAsState()
    val commitsHistory by viewModel.commitsHistory.collectAsState()
    val pendingSyncCount by viewModel.pendingSyncCount.collectAsState()
    
    val todayDateStr = remember {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        sdf.format(Date())
    }

    val yesterdayDateStr = remember {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -1)
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        sdf.format(cal.time)
    }
    
    var commitDate by remember { mutableStateOf(todayDateStr) }
    var taskWorkedOn by remember { mutableStateOf("") }
    var workSummary by remember { mutableStateOf("") }
    var hoursSpent by remember { mutableStateOf("8.0") }
    var issuesBlockers by remember { mutableStateOf("") }
    var tomorrowPlan by remember { mutableStateOf("") }

    val calendar = Calendar.getInstance()
    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val cal = Calendar.getInstance()
            cal.set(year, month, dayOfMonth)
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            commitDate = sdf.format(cal.time)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )
    
    // Check if user already submitted for the selected date
    val alreadySubmitted = commitsHistory.any { it.commitDate == commitDate }
    val existingCommit = commitsHistory.find { it.commitDate == commitDate }
    
    // Update fields if already submitted for selected date
    LaunchedEffect(commitDate, existingCommit) {
        if (existingCommit != null) {
            taskWorkedOn = existingCommit.taskWorkedOn
            workSummary = existingCommit.workSummary
            hoursSpent = existingCommit.hoursSpent.toString()
            issuesBlockers = existingCommit.issuesBlockers ?: ""
            tomorrowPlan = existingCommit.tomorrowPlan ?: ""
        } else {
            taskWorkedOn = ""
            workSummary = ""
            hoursSpent = "8.0"
            issuesBlockers = ""
            tomorrowPlan = ""
        }
    }
    
    LaunchedEffect(state) {
        if (state is DailyCommitState.Success) {
            Toast.makeText(context, (state as DailyCommitState.Success).message, Toast.LENGTH_LONG).show()
            viewModel.resetState()
        } else if (state is DailyCommitState.Error) {
            Toast.makeText(context, (state as DailyCommitState.Error).message, Toast.LENGTH_LONG).show()
            viewModel.resetState()
        }
    }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Daily Commit Log",
                showBackButton = true,
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        ResponsiveContentContainer(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            maxWidth = 720.dp
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                PendingSyncBanner(
                    pendingCount = pendingSyncCount,
                    onClick = {
                        Toast.makeText(context, "Refreshing daily commits...", Toast.LENGTH_SHORT).show()
                        viewModel.refresh()
                    }
                )
                
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                // Submit Form Card
                item {
                    SwayogCard {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (alreadySubmitted) "Edit Log ($commitDate)" else "Submit Timesheet",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (alreadySubmitted) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.onSurface // BrandGreen
                                )
                                if (alreadySubmitted) {
                                    Badge(containerColor = Color(0xFF0B6E4F)) {
                                        Text("Submitted", color = Color.White)
                                    }
                                }
                            }

                            // Quick Date Selection Chips
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                FilterChip(
                                    selected = commitDate == todayDateStr,
                                    onClick = { commitDate = todayDateStr },
                                    label = { Text("Today") }
                                )
                                FilterChip(
                                    selected = commitDate == yesterdayDateStr,
                                    onClick = { commitDate = yesterdayDateStr },
                                    label = { Text("Yesterday") }
                                )
                                FilterChip(
                                    selected = commitDate != todayDateStr && commitDate != yesterdayDateStr,
                                    onClick = { datePickerDialog.show() },
                                    label = { Text("Pick Date") },
                                    leadingIcon = {
                                        Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(16.dp))
                                    }
                                )
                            }
                            
                            // Date field
                            SwayogTextField(
                                value = commitDate,
                                onValueChange = { commitDate = it },
                                label = "Log Date",
                                placeholder = "yyyy-MM-dd",
                                enabled = true,
                                trailingIcon = {
                                    IconButton(onClick = { datePickerDialog.show() }) {
                                        Icon(Icons.Default.DateRange, contentDescription = "Select Date")
                                    }
                                }
                            )
                            
                            // Task Worked On field
                            SwayogTextField(
                                value = taskWorkedOn,
                                onValueChange = { taskWorkedOn = it },
                                label = "Task Worked On",
                                placeholder = "e.g. Inverter calibration at Baner site",
                                enabled = true,
                                trailingIcon = {
                                    Icon(Icons.Default.Assignment, contentDescription = null)
                                }
                            )
                            
                            // Summary field
                            SwayogTextField(
                                value = workSummary,
                                onValueChange = { workSummary = it },
                                label = "Work Summary",
                                placeholder = "Describe details of accomplishments today...",
                                enabled = true,
                                singleLine = false
                            )
                            
                            // Hours spent
                            SwayogTextField(
                                value = hoursSpent,
                                onValueChange = { hoursSpent = it },
                                label = "Hours Spent (Decimal)",
                                placeholder = "e.g. 8.5",
                                keyboardType = KeyboardType.Number,
                                enabled = true,
                                trailingIcon = {
                                    Icon(Icons.Default.AccessTime, contentDescription = null)
                                }
                            )
                            
                            // Blockers
                            SwayogTextField(
                                value = issuesBlockers,
                                onValueChange = { issuesBlockers = it },
                                label = "Issues & Blockers (Optional)",
                                placeholder = "Describe any issues faced...",
                                enabled = true
                            )
                            
                            // Tomorrow Plan
                            SwayogTextField(
                                value = tomorrowPlan,
                                onValueChange = { tomorrowPlan = it },
                                label = "Tomorrow's Target (Optional)",
                                placeholder = "What is the plan for next work day...",
                                enabled = true
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            SwayogButton(
                                text = if (alreadySubmitted) "Update Commit Log" else "Submit Commit Log",
                                onClick = {
                                    val hours = hoursSpent.toDoubleOrNull()
                                    if (taskWorkedOn.trim().length < 2) {
                                        Toast.makeText(context, "Task title is too short", Toast.LENGTH_SHORT).show()
                                    } else if (workSummary.trim().length < 10) {
                                        Toast.makeText(context, "Work summary must be at least 10 chars", Toast.LENGTH_SHORT).show()
                                    } else if (hours == null || hours < 0.25 || hours > 24) {
                                        Toast.makeText(context, "Hours spent must be between 0.25 and 24", Toast.LENGTH_SHORT).show()
                                    } else {
                                        viewModel.submitDailyCommit(
                                            commitDate = commitDate,
                                            taskWorkedOn = taskWorkedOn,
                                            workSummary = workSummary,
                                            hoursSpent = hours,
                                            issuesBlockers = issuesBlockers,
                                            tomorrowPlan = tomorrowPlan
                                        )
                                    }
                                },
                                isLoading = state is DailyCommitState.Loading
                            )
                        }
                    }
                }
                
                // History Card
                item {
                    Text(
                        text = "History Logs",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                if (commitsHistory.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No work logs submitted yet",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                } else {
                    items(commitsHistory, key = { it.id }) { commit ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    commitDate = commit.commitDate
                                },
                            colors = CardDefaults.cardColors(
                                containerColor = if (commit.commitDate == commitDate) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = commit.commitDate,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Tap to edit",
                                            modifier = Modifier.size(14.dp),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                                        )
                                    }
                                    Badge(containerColor = Color(0xFF386FA4)) { // BrandBlue
                                        Text("${commit.hoursSpent} Hrs", color = Color.White)
                                    }
                                }
                                Text(
                                    text = commit.taskWorkedOn,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = commit.workSummary,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                                if (!commit.issuesBlockers.isNullOrBlank()) {
                                    Text(
                                        text = "Blockers: ${commit.issuesBlockers}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.error
                                    )
                                }
                                if (!commit.tomorrowPlan.isNullOrBlank()) {
                                    Text(
                                        text = "Target: ${commit.tomorrowPlan}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

}
