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
import androidx.compose.ui.unit.sp
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
    val tasksList by viewModel.tasks.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedTask by remember { mutableStateOf<Task?>(null) }
    var searchQuery by remember { mutableStateOf("") }

    val filteredTasks = remember(tasksList, selectedTab, searchQuery) {
        val tabFiltered = when (selectedTab) {
            1 -> tasksList.filter { it.status != "completed" }
            2 -> tasksList.filter { it.status == "completed" }
            else -> tasksList
        }
        if (searchQuery.isBlank()) tabFiltered
        else tabFiltered.filter {
            it.customerName.contains(searchQuery, ignoreCase = true) ||
                    it.jobType.contains(searchQuery, ignoreCase = true) ||
                    it.description.contains(searchQuery, ignoreCase = true) ||
                    it.address.contains(searchQuery, ignoreCase = true)
        }
    }

    // Counts for tab badges
    val allCount = tasksList.size
    val activeCount = tasksList.count { it.status != "completed" }
    val completedCount = tasksList.count { it.status == "completed" }

    LaunchedEffect(tasksState) {
        if (tasksState is TasksState.Error) {
            Toast.makeText(context, (tasksState as TasksState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "My Tasks",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
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
                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Search tasks by name, type, address...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = "Search")
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                // Tabs with count badges
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text("All")
                                Badge(containerColor = MaterialTheme.colorScheme.primary) {
                                    Text(allCount.toString(), color = MaterialTheme.colorScheme.onPrimary)
                                }
                            }
                        }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text("Active")
                                Badge(containerColor = Color(0xFFFF9800)) {
                                    Text(activeCount.toString(), color = Color.White)
                                }
                            }
                        }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text("Done")
                                Badge(containerColor = Color(0xFF4CAF50)) {
                                    Text(completedCount.toString(), color = Color.White)
                                }
                            }
                        }
                    )
                }

                if (filteredTasks.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = if (searchQuery.isNotEmpty()) Icons.Default.SearchOff else Icons.Default.Assignment,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = if (searchQuery.isNotEmpty()) "No tasks match \"$searchQuery\"" else "No tasks found",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                            if (searchQuery.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                TextButton(onClick = { searchQuery = "" }) {
                                    Text("Clear search")
                                }
                            }
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredTasks) { task ->
                            TaskCard(
                                task = task,
                                onViewDetails = { selectedTask = task }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(8.dp)) }
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
                        viewModel.updateTaskStatus(task.id, "in_progress") { result ->
                            if (result.isSuccess) {
                                selectedTask = result.getOrNull()
                            } else {
                                Toast.makeText(context, "Failed to start task", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    onCompleteTask = { msg, doc ->
                        viewModel.completeTask(task.id, msg, doc) { result ->
                            if (result.isSuccess) {
                                selectedTask = null
                                viewModel.refresh()
                            } else {
                                Toast.makeText(context, "Failed to complete task", Toast.LENGTH_SHORT).show()
                            }
                        }
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
    val context = LocalContext.current
    val jobTypeEmoji = when (task.jobType.lowercase()) {
        "installation" -> "🔧"
        "service" -> "🛠️"
        "amc visit" -> "📋"
        "complaint" -> "⚠️"
        "survey" -> "📐"
        else -> "📌"
    }

    val statusColor = when (task.status.lowercase()) {
        "completed" -> Color(0xFF4CAF50)
        "in_progress" -> Color(0xFFFF9800)
        "assigned" -> Color(0xFF2196F3)
        "cancelled" -> Color(0xFFF44336)
        else -> MaterialTheme.colorScheme.onSurface
    }

    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = jobTypeEmoji, fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = task.jobType,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Surface(
                    color = statusColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = task.status.replace("_", " ").replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = task.description,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2
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
                Icon(Icons.Default.AccessTime, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFFFF9800))
                Text(
                    text = task.scheduledTime,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFFF9800),
                    fontWeight = FontWeight.Medium
                )
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
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    maxLines = 1
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action buttons row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SwayogButton(
                    text = "View Details",
                    onClick = onViewDetails,
                    variant = ButtonVariant.Secondary,
                    modifier = Modifier.weight(1f)
                )

                // Open in Maps
                OutlinedButton(
                    onClick = {
                        val encodedAddress = Uri.encode(task.address)
                        val mapUri = Uri.parse("geo:0,0?q=$encodedAddress")
                        context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                    },
                    modifier = Modifier.height(40.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Map, contentDescription = "Maps", modifier = Modifier.size(18.dp))
                }

                // Call customer
                OutlinedButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${task.customerPhone}"))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.height(40.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Phone, contentDescription = "Call", modifier = Modifier.size(18.dp))
                }
            }
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

    val jobTypeEmoji = when (task.jobType.lowercase()) {
        "installation" -> "🔧"
        "service" -> "🛠️"
        "amc visit" -> "📋"
        "complaint" -> "⚠️"
        "survey" -> "📐"
        else -> "📌"
    }

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
                        text = "$jobTypeEmoji Task Details",
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Customer: ${task.customerName}", fontWeight = FontWeight.Bold)
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${task.customerPhone}"))
                                context.startActivity(intent)
                            }
                        ) {
                            Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Phone: ${task.customerPhone}", color = MaterialTheme.colorScheme.primary)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Address: ${task.address}")
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Scheduled: ${task.scheduledTime}")
                        }
                    }
                }

                // Navigate to Maps button
                OutlinedButton(
                    onClick = {
                        val encodedAddress = Uri.encode(task.address)
                        val mapUri = Uri.parse("geo:0,0?q=$encodedAddress")
                        context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Navigate to Location")
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
