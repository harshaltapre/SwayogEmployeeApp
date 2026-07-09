package com.swayog.employee.presentation.tasks

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.Task
import com.swayog.employee.presentation.common.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    onNavigateBack: () -> Unit,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val tasksState by viewModel.tasksState.collectAsState()
    val tasksList by viewModel.tasksList.collectAsState()
    
    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedTask by remember { mutableStateOf<Task?>(null) }
    
    val filteredTasks = remember(tasksList, selectedTab) {
        when (selectedTab) {
            1 -> tasksList.filter { it.status != "completed" }
            2 -> tasksList.filter { it.status == "completed" }
            else -> tasksList
        }
    }
    
    LaunchedEffect(tasksState) {
        if (tasksState is TasksState.Success) {
            Toast.makeText(context, (tasksState as TasksState.Success).message, Toast.LENGTH_SHORT).show()
            viewModel.resetState()
        } else if (tasksState is TasksState.Error) {
            Toast.makeText(context, (tasksState as TasksState.Error).message, Toast.LENGTH_LONG).show()
            viewModel.resetState()
        }
    }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "My Tasks",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.refreshTasksList() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Tabs
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("All") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Active") }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("Completed") }
                    )
                }
                
                if (filteredTasks.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No tasks found",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredTasks) { task ->
                            TaskCard(
                                task = task,
                                onViewDetails = { selectedTask = task }
                            )
                        }
                    }
                }
            }
            
            // Loading Indicator Overlay
            if (tasksState is TasksState.Loading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            
            // Task Detail Dialog Sheet
            selectedTask?.let { task ->
                TaskDetailDialog(
                    task = task,
                    onDismiss = { selectedTask = null },
                    onStartTask = {
                        viewModel.updateStatus(task.id, "in_progress")
                        selectedTask = task.copy(status = "in_progress")
                    },
                    onCompleteTask = { msg, doc ->
                        viewModel.completeTask(task.id, msg, doc)
                        selectedTask = null
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCard(
    task: Task,
    onViewDetails: () -> Unit
) {
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
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
                
                val containerColor = when (task.status.lowercase()) {
                    "completed" -> MaterialTheme.colorScheme.primaryContainer
                    "in_progress" -> MaterialTheme.colorScheme.secondaryContainer
                    else -> MaterialTheme.colorScheme.surfaceVariant
                }
                
                Badge(containerColor = containerColor) {
                    Text(
                        text = task.status.replace("_", " ").uppercase(),
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = task.description,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                Text(text = task.customerName, style = MaterialTheme.typography.bodyMedium)
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                Text(
                    text = task.address,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            SwayogButton(
                text = "View Details",
                onClick = onViewDetails,
                variant = ButtonVariant.Secondary
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailDialog(
    task: Task,
    onDismiss: () -> Unit,
    onStartTask: () -> Unit,
    onCompleteTask: (String, String?) -> Unit
) {
    val context = LocalContext.current
    var completionMessage by remember { mutableStateOf("") }
    var docUrl by remember { mutableStateOf("") }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Task Details",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
                
                Divider()
                
                Text(
                    text = task.jobType,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = task.description,
                    style = MaterialTheme.typography.bodyMedium
                )
                
                // Customer Information Block
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("Customer: ${task.customerName}", fontWeight = FontWeight.Bold)
                        Text("Phone: ${task.customerPhone}", modifier = Modifier.clickable {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${task.customerPhone}"))
                            context.startActivity(intent)
                        }, color = MaterialTheme.colorScheme.primary)
                        Text("Address: ${task.address}")
                        Text("Scheduled: ${task.scheduledTime}")
                    }
                }
                
                if (task.status == "completed") {
                    Divider()
                    Text("Completion Status", fontWeight = FontWeight.Bold)
                    Text("Remarks: ${task.completionMessage ?: "None"}")
                    task.completionDocumentUrl?.let { url ->
                        Text("Document URL: $url", color = MaterialTheme.colorScheme.primary, modifier = Modifier.clickable {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            context.startActivity(browserIntent)
                        })
                    }
                } else {
                    // Actions / Form
                    Divider()
                    
                    if (task.status == "assigned") {
                        SwayogButton(
                            text = "Start Task (In Progress)",
                            onClick = onStartTask
                        )
                    } else if (task.status == "in_progress") {
                        Text("Complete Task Form", fontWeight = FontWeight.Bold)
                        
                        SwayogTextField(
                            value = completionMessage,
                            onValueChange = { completionMessage = it },
                            label = "Completion Message",
                            placeholder = "Describe what was accomplished..."
                        )
                        
                        SwayogTextField(
                            value = docUrl,
                            onValueChange = { docUrl = it },
                            label = "Document Link (Optional)",
                            placeholder = "URL of report blueprint, or proof"
                        )
                        
                        SwayogButton(
                            text = "Mark Task Completed",
                            onClick = {
                                if (completionMessage.trim().isBlank()) {
                                    Toast.makeText(context, "Completion description is required", Toast.LENGTH_SHORT).show()
                                } else {
                                    onCompleteTask(completionMessage, docUrl.trim().ifEmpty { null })
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
