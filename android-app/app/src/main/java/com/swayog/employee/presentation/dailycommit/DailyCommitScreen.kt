package com.swayog.employee.presentation.dailycommit

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.DateRange
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
    
    var commitDate by remember { mutableStateOf(todayDateStr) }
    var taskWorkedOn by remember { mutableStateOf("") }
    var workSummary by remember { mutableStateOf("") }
    var hoursSpent by remember { mutableStateOf("8.0") }
    var issuesBlockers by remember { mutableStateOf("") }
    var tomorrowPlan by remember { mutableStateOf("") }
    
    // Check if user already submitted for the selected date
    val alreadySubmitted = commitsHistory.any { it.commitDate == commitDate }
    val existingCommit = commitsHistory.find { it.commitDate == commitDate }
    
    // Update fields if already submitted
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            PendingSyncBanner(pendingCount = pendingSyncCount)
            
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
                            Text(
                                text = if (alreadySubmitted) "Submitted Log" else "Submit Timesheet",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (alreadySubmitted) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.onSurface // BrandGreen
                            )
                            
                            // Date field
                            SwayogTextField(
                                value = commitDate,
                                onValueChange = { if (!alreadySubmitted) commitDate = it },
                                label = "Log Date",
                                placeholder = "yyyy-MM-dd",
                                enabled = !alreadySubmitted,
                                trailingIcon = {
                                    Icon(Icons.Default.DateRange, contentDescription = null)
                                }
                            )
                            
                            // Task Worked On field
                            SwayogTextField(
                                value = taskWorkedOn,
                                onValueChange = { if (!alreadySubmitted) taskWorkedOn = it },
                                label = "Task Worked On",
                                placeholder = "e.g. Inverter calibration at Baner site",
                                enabled = !alreadySubmitted,
                                trailingIcon = {
                                    Icon(Icons.Default.Assignment, contentDescription = null)
                                }
                            )
                            
                            // Summary field
                            SwayogTextField(
                                value = workSummary,
                                onValueChange = { if (!alreadySubmitted) workSummary = it },
                                label = "Work Summary",
                                placeholder = "Describe details of accomplishments today...",
                                enabled = !alreadySubmitted,
                                singleLine = false
                            )
                            
                            // Hours spent
                            SwayogTextField(
                                value = hoursSpent,
                                onValueChange = { if (!alreadySubmitted) hoursSpent = it },
                                label = "Hours Spent (Decimal)",
                                placeholder = "e.g. 8.5",
                                keyboardType = KeyboardType.Number,
                                enabled = !alreadySubmitted,
                                trailingIcon = {
                                    Icon(Icons.Default.AccessTime, contentDescription = null)
                                }
                            )
                            
                            // Blockers
                            SwayogTextField(
                                value = issuesBlockers,
                                onValueChange = { if (!alreadySubmitted) issuesBlockers = it },
                                label = "Issues & Blockers (Optional)",
                                placeholder = "Describe any issues faced...",
                                enabled = !alreadySubmitted
                            )
                            
                            // Tomorrow Plan
                            SwayogTextField(
                                value = tomorrowPlan,
                                onValueChange = { if (!alreadySubmitted) tomorrowPlan = it },
                                label = "Tomorrow's Target (Optional)",
                                placeholder = "What is the plan for next work day...",
                                enabled = !alreadySubmitted
                            )
                            
                            if (!alreadySubmitted) {
                                Spacer(modifier = Modifier.height(8.dp))
                                SwayogButton(
                                    text = "Submit Commit Log",
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
                    items(commitsHistory.reversed(), key = { it.id }) { commit ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
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
                                    Text(
                                        text = commit.commitDate,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
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
                            }
                        }
                    }
                }
            }
        }
    }
}
