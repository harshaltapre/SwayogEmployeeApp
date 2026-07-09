package com.swayog.employee.presentation.tasks

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.Task
import com.swayog.employee.presentation.common.components.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    onNavigateBack: () -> Unit,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val tasks by viewModel.tasks.collectAsState()
    val state by viewModel.tasksState.collectAsState()
    
    var selectedTab by remember { mutableStateOf(0) }
    var selectedTask by remember { mutableStateOf<Task?>(null) }
    
    // Simple date checker
    val todayStr = remember {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        sdf.format(Date())
    }
    
    val filteredTasks = remember(tasks, selectedTab, todayStr) {
        when (selectedTab) {
            0 -> tasks.filter { it.status != "completed" && it.scheduledTime.contains(todayStr) } // Today
            1 -> tasks.filter { it.status != "completed" && !it.scheduledTime.contains(todayStr) } // Upcoming
            else -> tasks.filter { it.status == "completed" } // Completed
        }
    }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "My Tasks",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = viewModel::refresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Filter tabs
            TabRow(
                selectedTabIndex = selectedTab,
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Today") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Upcoming") }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Completed") }
                )
            }
            
            if (state is TasksState.Loading && tasks.isEmpty()) {
                LoadingScreen(message = "Syncing tasks...")
            } else {
                if (filteredTasks.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No tasks found",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredTasks) { task ->
                            TaskCard(
                                task = task,
                                onClick = { selectedTask = task }
                            )
                        }
                    }
                }
            }
        }
    }
    
    // Details drawer (M3 Dialog)
    selectedTask?.let { task ->
        TaskDetailsDialog(
            task = task,
            onDismiss = { selectedTask = null },
            onUpdateStatus = { status ->
                viewModel.updateTaskStatus(task.id, status) { res ->
                    res.onSuccess {
                        selectedTask = it
                        Toast.makeText(context, "Task status updated to $status", Toast.LENGTH_SHORT).show()
                    }.onFailure {
                        Toast.makeText(context, "Failed to update status: ${it.message}", Toast.LENGTH_LONG).show()
                    }
                }
            },
            onCompleteTask = { msg ->
                viewModel.completeTask(task.id, msg, null) { res ->
                    res.onSuccess {
                        selectedTask = null
                        Toast.makeText(context, "Task completed successfully!", Toast.LENGTH_SHORT).show()
                    }.onFailure {
                        Toast.makeText(context, "Failed to complete task: ${it.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCard(
    task: Task,
    onClick: () -> Unit
) {
    SwayogCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.jobType,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Badge(
                    containerColor = when (task.status.lowercase()) {
                        "assigned" -> MaterialTheme.colorScheme.secondaryContainer
                        "in-progress" -> MaterialTheme.colorScheme.tertiaryContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                ) {
                    Text(
                        text = task.status.uppercase(),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Client: ${task.customerName}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Text(
                    text = task.address,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
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
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailsDialog(
    task: Task,
    onDismiss: () -> Unit,
    onUpdateStatus: (String) -> Unit,
    onCompleteTask: (String) -> Unit
) {
    val context = LocalContext.current
    var completionNotes by remember { mutableStateOf("") }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(
                        text = task.jobType,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                item {
                    Divider()
                }
                
                item {
                    Text(
                        text = "Customer details",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(text = "Name: ${task.customerName}", style = MaterialTheme.typography.bodyMedium)
                    
                    // Click to call trigger
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${task.customerPhone}"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Cannot make call", Toast.LENGTH_SHORT).show()
                                }
                            }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Phone: ${task.customerPhone}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    
                    // Click to map trigger
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(task.address)}"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Cannot open maps", Toast.LENGTH_SHORT).show()
                                }
                            }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Map, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Location: ${task.address}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                
                item {
                    Text(
                        text = "Task details",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(text = "Scheduled: ${task.scheduledTime}", style = MaterialTheme.typography.bodyMedium)
                    Text(text = "Description: ${task.description}", style = MaterialTheme.typography.bodyMedium)
                    Text(text = "Status: ${task.status.uppercase()}", style = MaterialTheme.typography.bodyMedium)
                }
                
                if (task.status.lowercase() == "assigned") {
                    item {
                        SwayogButton(
                            text = "Start Work",
                            onClick = { onUpdateStatus("in-progress") }
                        )
                    }
                }
                
                if (task.status.lowercase() == "in-progress") {
                    item {
                        Divider()
                    }
                    item {
                        Text(
                            text = "Submit Field Completion Report",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = completionNotes,
                            onValueChange = { completionNotes = it },
                            label = { Text("Field Notes / Completion Message") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        SwayogButton(
                            text = "Complete Task",
                            enabled = completionNotes.isNotBlank(),
                            onClick = { onCompleteTask(completionNotes) }
                        )
                    }
                }
                
                item {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Close")
                    }
                }
            }
        }
    }
}
