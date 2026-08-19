package com.swayog.employee.presentation.tasks

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.provider.Settings
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import coil.compose.AsyncImage
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.swayog.employee.data.model.Task
import com.swayog.employee.presentation.common.components.*
import com.swayog.employee.core.util.OfflinePendingException
import com.swayog.employee.core.util.OnlineSubmissionFailedException
import com.swayog.employee.presentation.common.utils.WatermarkHelper
import java.io.ByteArrayOutputStream
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

@Composable
fun TasksScreen(
    onNavigateBack: () -> Unit,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val tasksState by viewModel.tasksState.collectAsState()
    val tasksList by viewModel.tasks.collectAsState()
    val pendingSyncCount by viewModel.pendingSyncCount.collectAsState()
    val canCreateTask by viewModel.canCreateTask.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedTask by remember { mutableStateOf<Task?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var showCreateTaskDialog by remember { mutableStateOf(false) }
    var showRateTaskDialog by remember { mutableStateOf(false) }

    val filteredTasks = remember(tasksList, selectedTab, searchQuery) {
        val tabFiltered = when (selectedTab) {
            1 -> tasksList.filter { !it.status.equals("completed", ignoreCase = true) }
            2 -> tasksList.filter { it.status.equals("completed", ignoreCase = true) }
            else -> tasksList.filter { !it.status.equals("completed", ignoreCase = true) }
        }
        if (searchQuery.isBlank()) tabFiltered
        else tabFiltered.filter {
            (it.customerName ?: "").contains(searchQuery, ignoreCase = true) ||
                    (it.jobType ?: "").contains(searchQuery, ignoreCase = true) ||
                    (it.description ?: "").contains(searchQuery, ignoreCase = true) ||
                    (it.address ?: "").contains(searchQuery, ignoreCase = true)
        }
    }

    // Counts for tab badges
    val activeCount = tasksList.count { !it.status.equals("completed", ignoreCase = true) }
    val completedCount = tasksList.count { it.status.equals("completed", ignoreCase = true) }
    val allCount = activeCount

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
                    IconButton(onClick = {
                        Toast.makeText(context, "Refreshing tasks...", Toast.LENGTH_SHORT).show()
                        viewModel.refresh()
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    if (canCreateTask) {
                        IconButton(onClick = { showCreateTaskDialog = true }) {
                            Icon(Icons.Default.Add, contentDescription = "Create Task")
                        }
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
            var isSyncing by remember { mutableStateOf(false) }

            PendingSyncBanner(
                pendingCount = pendingSyncCount,
                onClick = {
                    if (isSyncing) return@PendingSyncBanner
                    isSyncing = true
                    Toast.makeText(context, "Syncing pending actions...", Toast.LENGTH_SHORT).show()
                    viewModel.syncPending { summary ->
                        isSyncing = false
                        val message = when {
                            summary.isOffline -> "No internet connection. Site visit remains saved locally."
                            summary.isAuthError -> "Unable to sync. Please sign in again. Your site visit is still saved."
                            summary.isPhotoError -> "Site visit could not be synced because one or more photos failed to upload. Data remains saved locally."
                            summary.total == 0 -> "No pending actions to sync."
                            summary.synced > 0 && summary.failed == 0 && summary.permanentlyFailed == 0 -> {
                                if (summary.synced == 1) "Site visit synced successfully."
                                else "${summary.synced} site visits synced successfully."
                            }
                            summary.permanentlyFailed > 0 && summary.synced == 0 && summary.failed == 0 -> {
                                "Some pending tasks could not be submitted — the task was not found or you are not assigned to it. Please contact your coordinator."
                            }
                            summary.permanentlyFailed > 0 -> {
                                val syncMsg = if (summary.synced > 0) "${summary.synced} synced. " else ""
                                "${syncMsg}${summary.permanentlyFailed} item(s) removed: task not found or not authorized. Please check with your coordinator."
                            }
                            summary.synced > 0 && summary.failed > 0 -> {
                                "${summary.synced} of ${summary.total} site visits synced. ${summary.failed} failed and will be retried."
                            }
                            else -> "Failed to sync site visits. Data remains saved locally."
                        }
                        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                    }
                }
            )
            
            Column(
                modifier = Modifier
                    .fillMaxSize()
            ) {   // Search Bar
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
                                Badge(containerColor = Color(0xFFD1603D)) { // BrandOrange
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
                                Badge(containerColor = Color(0xFF0B6E4F)) { // BrandGreen
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
                        items(filteredTasks, key = { it.id }) { task ->
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
                    serverUrl = serverUrl,
                    onDismiss = { selectedTask = null },
                    onStartTask = {
                        viewModel.updateTaskStatus(task.id, "IN_PROGRESS") { result ->
                            if (result.isSuccess) {
                                selectedTask = result.getOrNull()
                            } else {
                                Toast.makeText(context, "Failed to start task", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    onCompleteTask = { msg, doc, beforeImg, afterImg, bLat, bLng, aLat, aLng, taskType, images, beforeImages, afterImages, sitePhotos ->
                        viewModel.completeTask(
                            taskId = task.id,
                            message = msg,
                            documentUrl = doc,
                            beforeImageUrl = beforeImg,
                            afterImageUrl = afterImg,
                            beforeLatitude = bLat,
                            beforeLongitude = bLng,
                            afterLatitude = aLat,
                            afterLongitude = aLng,
                            taskType = taskType,
                            images = images,
                            beforeImages = beforeImages,
                            afterImages = afterImages,
                            sitePhotos = sitePhotos
                        ) { result ->
                            if (result.isSuccess) {
                                selectedTask = null
                                viewModel.refresh()
                            } else {
                                val exception = result.exceptionOrNull()
                                when (exception) {
                                    is OfflinePendingException -> {
                                        // Device was offline or had a connectivity error — data is saved locally.
                                        // Dismiss the dialog and refresh so the task shows as completed (pending sync).
                                        selectedTask = null
                                        viewModel.refresh()
                                        Toast.makeText(context, exception.message, Toast.LENGTH_LONG).show()
                                    }
                                    is OnlineSubmissionFailedException -> {
                                        // Device IS online but the server rejected the request.
                                        // Do NOT dismiss the dialog — let the user see the error and retry.
                                        val errMsg = exception.message ?: "Submission failed"
                                        val userFriendlyMsg = when {
                                            errMsg.contains("(404)") -> "Task not found on server (404). The task may have been removed or re-assigned. Please contact your coordinator."
                                            errMsg.contains("(403)") -> "You are not authorized to complete this task (403). Please ask your service coordinator to reassign it to you as the primary employee."
                                            errMsg.contains("(422)") -> "Submission rejected: some required fields are missing or invalid. Please check your input and try again."
                                            errMsg.contains("(413)") -> "Photos are too large to upload. Please try with fewer photos or retake at lower resolution."
                                            else -> errMsg
                                        }
                                        Toast.makeText(context, userFriendlyMsg, Toast.LENGTH_LONG).show()
                                    }
                                    else -> {
                                        // Unknown error — surface it to the user without dismissing.
                                        val errorMsg = exception?.message ?: "Unknown error"
                                        Toast.makeText(context, "Failed: $errorMsg", Toast.LENGTH_LONG).show()
                                    }
                                }
                            }
                        }
                    }
                )
            }

            // Create Task Dialog
            if (showCreateTaskDialog) {
                CreateTaskDialog(
                    onDismiss = { showCreateTaskDialog = false },
                    onCreateTask = { jobType, description, customerName, customerPhone, address, scheduledTime, employeeUserId ->
                        viewModel.createTask(
                            jobType = jobType,
                            description = description,
                            customerName = customerName,
                            customerPhone = customerPhone,
                            address = address,
                            latitude = null,
                            longitude = null,
                            scheduledTime = scheduledTime,
                            employeeUserId = employeeUserId
                        ) { result ->
                            if (result.isSuccess) {
                                showCreateTaskDialog = false
                                Toast.makeText(context, "Task created successfully!", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Failed to create task: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                )
            }

            // Rate Task Dialog
            if (showRateTaskDialog && selectedTask != null) {
                RateTaskDialog(
                    task = selectedTask!!,
                    onDismiss = { 
                        showRateTaskDialog = false
                        selectedTask = null
                    },
                    onRateTask = { rating, feedback, fixCharges ->
                        viewModel.rateTask(
                            taskId = selectedTask!!.id,
                            rating = rating,
                            feedback = feedback,
                            fixCharges = fixCharges
                        ) { result ->
                            if (result.isSuccess) {
                                showRateTaskDialog = false
                                selectedTask = null
                                Toast.makeText(context, "Task rated successfully!", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Failed to rate task: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
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
fun CreateTaskDialog(
    onDismiss: () -> Unit,
    onCreateTask: (
        jobType: String,
        description: String,
        customerName: String,
        customerPhone: String,
        address: String,
        scheduledTime: String,
        employeeUserId: String
    ) -> Unit
) {
    val context = LocalContext.current
    val userId by remember { mutableStateOf("") }
    
    var jobType by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var customerName by remember { mutableStateOf("") }
    var customerPhone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var scheduledTime by remember { mutableStateOf("") }
    var employeeUserId by remember { mutableStateOf(userId) }
    
    val jobTypes = listOf("Installation", "Service", "AMC Visit", "Complaint", "Survey", "Maintenance")
    var expanded by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Create New Task",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                // Job Type Dropdown
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = jobType,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Job Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        jobTypes.forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type) },
                                onClick = {
                                    jobType = type
                                    expanded = false
                                }
                            )
                        }
                    }
                }

                SwayogTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = "Description",
                    placeholder = "Describe the task...",
                    singleLine = false
                )

                SwayogTextField(
                    value = customerName,
                    onValueChange = { customerName = it },
                    label = "Customer Name",
                    placeholder = "Enter customer name"
                )

                SwayogTextField(
                    value = customerPhone,
                    onValueChange = { customerPhone = it },
                    label = "Customer Phone",
                    placeholder = "Enter phone number",
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone
                )

                SwayogTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = "Address",
                    placeholder = "Enter address",
                    singleLine = false
                )

                SwayogTextField(
                    value = scheduledTime,
                    onValueChange = { scheduledTime = it },
                    label = "Scheduled Time",
                    placeholder = "YYYY-MM-DD HH:MM"
                )

                SwayogTextField(
                    value = employeeUserId,
                    onValueChange = { employeeUserId = it },
                    label = "Assign to Employee ID",
                    placeholder = "Enter employee ID"
                )

                SwayogButton(
                    text = "Create Task",
                    enabled = jobType.isNotBlank() && 
                              description.isNotBlank() && 
                              customerName.isNotBlank() && 
                              customerPhone.isNotBlank() &&
                              address.isNotBlank() &&
                              scheduledTime.isNotBlank() &&
                              employeeUserId.isNotBlank(),
                    onClick = {
                        onCreateTask(
                            jobType,
                            description,
                            customerName,
                            customerPhone,
                            address,
                            scheduledTime,
                            employeeUserId
                        )
                    }
                )
            }
        }
    }
}

@Composable
fun RateTaskDialog(
    task: Task,
    onDismiss: () -> Unit,
    onRateTask: (rating: Int, feedback: String?, fixCharges: Double?) -> Unit
) {
    var rating by remember { mutableIntStateOf(0) }
    var feedback by remember { mutableStateOf("") }
    var fixCharges by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
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
                        text = "Rate Task",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                Text(
                    text = task.description ?: "Task",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                // Star Rating
                Text("Rating:", style = MaterialTheme.typography.labelLarge)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    repeat(5) { index ->
                        IconButton(
                            onClick = { rating = index + 1 },
                            modifier = Modifier.size(40.dp)
                        ) {
                            Icon(
                                imageVector = if (index < rating) Icons.Default.Star else Icons.Default.StarBorder,
                                contentDescription = "Star ${index + 1}",
                                tint = if (index < rating) Color(0xFFFFD700) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                }

                SwayogTextField(
                    value = feedback,
                    onValueChange = { feedback = it },
                    label = "Feedback (Optional)",
                    placeholder = "Share your experience...",
                    singleLine = false
                )

                SwayogTextField(
                    value = fixCharges,
                    onValueChange = { fixCharges = it },
                    label = "Fix Charges (Optional)",
                    placeholder = "Enter amount if applicable",
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal
                )

                SwayogButton(
                    text = "Submit Rating",
                    enabled = rating > 0,
                    onClick = {
                        onRateTask(
                            rating,
                            feedback.takeIf { it.isNotBlank() },
                            fixCharges.toDoubleOrNull()
                        )
                    }
                )
            }
        }
    }
}

@Composable
fun TaskCard(
    task: Task,
    onViewDetails: () -> Unit
) {
    val context = LocalContext.current
    val jobTypeEmoji = when (task.jobType?.lowercase()) {
        "installation" -> "🔧"
        "service" -> "🛠️"
        "amc visit" -> "📋"
        "complaint" -> "⚠️"
        "survey" -> "📐"
        else -> " "
    }

    val statusColor = when (task.status?.lowercase()) {
        "completed" -> Color(0xFF0B6E4F) // BrandGreen
        "in_progress" -> Color(0xFFD1603D) // BrandOrange
        "assigned" -> Color(0xFF386FA4) // BrandBlue
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
                        text = task.jobType ?: "Unknown",
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
                        text = (task.status ?: "Unknown").replace("_", " ").replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = task.description ?: "",
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
                Text(text = task.customerName ?: "Unknown", style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.AccessTime, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFFD1603D)) // BrandOrange
                Text(
                    text = task.scheduledTime ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFD1603D), // BrandOrange
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
                    text = task.address ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    maxLines = 3,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
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

            // Rate button for completed tasks
            if (task.status?.equals("completed", ignoreCase = true) == true) {
                Spacer(modifier = Modifier.height(8.dp))
                SwayogButton(
                    text = "Rate Task",
                    onClick = onViewDetails,
                    variant = ButtonVariant.Primary,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun TaskDetailDialog(
    task: Task,
    onDismiss: () -> Unit,
    onStartTask: () -> Unit,
    onCompleteTask: (String, String?, String?, String?, Double?, Double?, Double?, Double?, String?, List<String>?, List<String>?, List<String>?, List<String>?) -> Unit,
    serverUrl: String? = null
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var completionMessage by remember { mutableStateOf("") }
    var docUrl by remember { mutableStateOf("") }

    // Photo state: watermarked base64 data URLs
    var beforeImageUrl by remember { mutableStateOf<String?>(null) }
    var afterImageUrl by remember { mutableStateOf<String?>(null) }
    // Multiple images for site visits and AMC visits
    var uploadedImages by remember { mutableStateOf<List<String>>(emptyList()) }
    var beforeImages by remember { mutableStateOf<List<String>>(emptyList()) }
    var afterImages by remember { mutableStateOf<List<String>>(emptyList()) }
    
    // Photo state: watermarked bitmaps for preview
    var beforeBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var afterBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var imageBitmaps by remember { mutableStateOf<List<Bitmap>>(emptyList()) }
    
    // GPS coordinates captured at photo time
    var beforeLat by remember { mutableStateOf<Double?>(null) }
    var beforeLng by remember { mutableStateOf<Double?>(null) }
    var afterLat by remember { mutableStateOf<Double?>(null) }
    var afterLng by remember { mutableStateOf<Double?>(null) }
    
    // Processing flag
    var isProcessing by remember { mutableStateOf(false) }
    // Which photo we're currently capturing ("before", "after", or index for multiple images)
    var pendingPhotoType by remember { mutableStateOf<String?>(null) }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    
    // Determine task type and required image count
    val taskType = task.taskType ?: when {
        task.isSiteVisit -> "SITE_VISIT"
        task.isAmcVisit -> "AMC_VISIT"
        else -> "REGULAR"
    }
    
    val requiredImageCount = task.requiredImageCount
    val currentImageCount = when (taskType) {
        "SITE_VISIT" -> uploadedImages.size
        "AMC_VISIT" -> beforeImages.size + afterImages.size
        else -> (if (beforeImageUrl != null) 1 else 0) + (if (afterImageUrl != null) 1 else 0)
    }

    // Helper to get current GPS, watermark the bitmap, and convert to base64
    fun processPhoto(bitmap: Bitmap, type: String, addressOverride: String? = null) {
        coroutineScope.launch {
            isProcessing = true
            try {
                // Get current GPS location
                var lat: Double? = null
                var lng: Double? = null
                try {
                    if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                        val location = fusedLocationClient.getCurrentLocation(
                            Priority.PRIORITY_HIGH_ACCURACY,
                            CancellationTokenSource().token
                        ).await()
                        lat = location?.latitude
                        lng = location?.longitude
                    }
                } catch (_: Exception) { /* GPS unavailable, proceed without */ }

                val address = addressOverride ?: task.address ?: "Unknown Location"
                val customerName = task.customerName ?: "Unknown Customer"
                val taskId = task.id
                
                val format = java.text.SimpleDateFormat("EEEE, dd/MM/yyyy hh:mm a", java.util.Locale.getDefault())
                val timestamp = format.format(java.util.Date())

                // Scale bitmap down to reduce memory usage and avoid payload timeouts.
                // Site visit photos get tighter compression (10+ photos) vs before/after (2 photos).
                val isSiteVisitPhoto = type == "site_visit"
                val maxDim = if (isSiteVisitPhoto) 600f else 800f
                val jpegQuality = if (isSiteVisitPhoto) 60 else 75
                val scale = minOf(maxDim / bitmap.width, maxDim / bitmap.height)
                val scaledBitmap = if (scale < 1f) {
                    Bitmap.createScaledBitmap(bitmap, (bitmap.width * scale).toInt(), (bitmap.height * scale).toInt(), true)
                } else {
                    bitmap
                }

                // Watermark the scaled bitmap
                val watermarked = WatermarkHelper.addWatermark(scaledBitmap, lat, lng, address, customerName, taskId, timestamp)

                // Convert to base64 data URL
                val outputStream = ByteArrayOutputStream()
                watermarked.compress(Bitmap.CompressFormat.JPEG, jpegQuality, outputStream)
                val base64String = "data:image/jpeg;base64," + Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

                when (type) {
                    "before" -> {
                        beforeBitmap = watermarked
                        beforeImageUrl = base64String
                        beforeLat = lat
                        beforeLng = lng
                    }
                    "after" -> {
                        afterBitmap = watermarked
                        afterImageUrl = base64String
                        afterLat = lat
                        afterLng = lng
                    }
                    "site_visit" -> {
                        uploadedImages = uploadedImages + base64String
                        imageBitmaps = imageBitmaps + watermarked
                    }
                    "amc_before" -> {
                        beforeImages = beforeImages + base64String
                    }
                    "amc_after" -> {
                        afterImages = afterImages + base64String
                    }
                }
                android.util.Log.d("TaskSubmissionChain", "LOG 1 - Image Captured: type=$type, base64Length=${base64String.length}, lat=$lat, lng=$lng")
                Toast.makeText(context, "${type.replaceFirstChar { it.uppercase() }} photo captured with GPS stamp ✓", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Failed to process photo: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isProcessing = false
            }
        }
    }

    // Camera launcher (returns a Bitmap thumbnail)
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        if (bitmap != null && pendingPhotoType != null) {
            processPhoto(bitmap, pendingPhotoType!!)
        }
        pendingPhotoType = null
    }

    // Gallery launcher (returns a Uri)
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null && pendingPhotoType != null) {
            try {
                val bitmap = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                    val source = android.graphics.ImageDecoder.createSource(context.contentResolver, uri)
                    android.graphics.ImageDecoder.decodeBitmap(source)
                } else {
                    @Suppress("DEPRECATION")
                    android.provider.MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
                }
                // Convert hardware bitmap to software if needed
                val softwareBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true)
                processPhoto(softwareBitmap, pendingPhotoType!!)
            } catch (e: Exception) {
                Toast.makeText(context, "Failed to load image from gallery", Toast.LENGTH_SHORT).show()
            }
        }
        pendingPhotoType = null
    }

    var isCustomCameraOpen by remember { mutableStateOf(false) }
    var showImageSourceDialog by remember { mutableStateOf(false) }
    var showPermissionRationale by remember { mutableStateOf(false) }

    // Permission launcher for camera + location
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val locationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        
        if (cameraGranted && locationGranted && pendingPhotoType != null) {
            isCustomCameraOpen = true
        } else {
            showPermissionRationale = true
            pendingPhotoType = null
        }
    }

    if (showPermissionRationale) {
        AlertDialog(
            onDismissRequest = { showPermissionRationale = false },
            title = { Text("Permissions Required") },
            text = { Text("Camera and Location permissions are required to capture geotagged proof-of-work photos. Please grant them in Settings.") },
            confirmButton = {
                TextButton(onClick = {
                    showPermissionRationale = false
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.fromParts("package", context.packageName, null)
                    }
                    context.startActivity(intent)
                }) {
                    Text("Open Settings")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionRationale = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    fun openCustomCamera() {
        showImageSourceDialog = false
        val cameraGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        val locationGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (cameraGranted && locationGranted) {
            isCustomCameraOpen = true
        } else {
            permissionLauncher.launch(arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION
            ))
        }
    }

    if (isCustomCameraOpen) {
        Dialog(
            onDismissRequest = {
                isCustomCameraOpen = false
                pendingPhotoType = null
            },
            properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)
        ) {
            CustomCameraScreen(
                customerName = task.customerName ?: "Unknown",
                taskId = task.id,
                taskAddress = task.address ?: "Unknown",
                onPhotoCaptured = { bitmap, address ->
                    if (pendingPhotoType != null) {
                        processPhoto(bitmap, pendingPhotoType!!, address)
                    }
                    isCustomCameraOpen = false
                    pendingPhotoType = null
                },
                onClosed = {
                    isCustomCameraOpen = false
                    pendingPhotoType = null
                }
            )
        }
    }

    fun launchPhotoPicker(type: String) {
        pendingPhotoType = type
        showImageSourceDialog = true
    }

    if (showImageSourceDialog) {
        AlertDialog(
            onDismissRequest = {
                showImageSourceDialog = false
                pendingPhotoType = null
            },
            title = { Text("Select Image Source") },
            text = { Text("Choose where to upload the photo from.") },
            confirmButton = {
                TextButton(onClick = {
                    openCustomCamera()
                }) {
                    Text("Camera")
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showImageSourceDialog = false
                    galleryLauncher.launch("image/*")
                }) {
                    Text("Gallery")
                }
            }
        )
    }

    val jobTypeEmoji = when (task.jobType?.lowercase()) {
        "installation" -> "🔧"
        "service" -> "🛠️"
        "amc visit" -> "📋"
        "complaint" -> "⚠️"
        "survey" -> "📐"
        else -> " "
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
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
                    text = task.jobType ?: "Unknown",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = task.description ?: "",
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
                            Text("Customer: ${task.customerName ?: "Unknown"}", fontWeight = FontWeight.Bold)
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${task.customerPhone ?: ""}"))
                                context.startActivity(intent)
                            }
                        ) {
                            Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Phone: ${task.customerPhone ?: "Unknown"}", color = MaterialTheme.colorScheme.primary)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Address: ${task.address ?: "Unknown"}")
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Scheduled: ${task.scheduledTime ?: "Unknown"}")
                        }
                    }
                }

                // Navigate to Maps button
                OutlinedButton(
                    onClick = {
                        val encodedAddress = Uri.encode(task.address ?: "")
                        val mapUri = Uri.parse("geo:0,0?q=$encodedAddress")
                        context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Navigate to Location")
                }

                if (task.status?.equals("completed", ignoreCase = true) == true) {
                    Text("Completion Status", fontWeight = FontWeight.Bold)
                    Text("Remarks: ${task.completionMessage ?: "None"}")
                    task.completionDocumentUrl?.let { url ->
                        Text("Document URL: $url", color = MaterialTheme.colorScheme.primary, modifier = Modifier.clickable {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            context.startActivity(browserIntent)
                        })
                    }
                    
                    BeforeAfterImageSection(
                        beforeImageUrl = task.beforeImageUrl,
                        afterImageUrl = task.afterImageUrl,
                        sitePhotos = task.sitePhotos ?: task.images,
                        taskType = task.taskType,
                        jobType = task.jobType,
                        isSiteVisit = task.isSiteVisit,
                        serverUrl = serverUrl
                    )
                } else {
                    if (task.status?.equals("assigned", ignoreCase = true) == true) {
                        SwayogButton(
                            text = "Start Task (In Progress)",
                            onClick = onStartTask
                        )
                    } else if (task.status?.equals("in_progress", ignoreCase = true) == true || task.status?.equals("pending", ignoreCase = true) == true) {
                        val isSiteVisitTask = task.isSiteVisit

                        if (isSiteVisitTask) {
                            // Site Visit Photo Upload Flow (Gallery + Description)
                            Text(
                                text = "📸 Site Visit Photos (GPS Proof)",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = "Minimum 4 photos required (${uploadedImages.size}/4 uploaded)",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (uploadedImages.size >= 4) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.SemiBold
                            )

                            // Display Grid of uploaded site photo thumbnails
                            if (imageBitmaps.isNotEmpty()) {
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    itemsIndexed(imageBitmaps) { idx, bitmap ->
                                        Box(modifier = Modifier.size(100.dp)) {
                                            Image(
                                                bitmap = bitmap.asImageBitmap(),
                                                contentDescription = "Site Photo ${idx + 1}",
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .clip(RoundedCornerShape(8.dp)),
                                                contentScale = ContentScale.Crop
                                            )
                                            IconButton(
                                                onClick = {
                                                    imageBitmaps = imageBitmaps.toMutableList().apply { removeAt(idx) }
                                                    uploadedImages = uploadedImages.toMutableList().apply { removeAt(idx) }
                                                },
                                                modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = "Remove photo", tint = Color.Red, modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    }
                                }
                            }

                            if (uploadedImages.size < 10) {
                                OutlinedButton(
                                    onClick = { launchPhotoPicker("site_visit") },
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    enabled = !isProcessing,
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        if (isProcessing && pendingPhotoType == "site_visit") {
                                            CircularProgressIndicator(modifier = Modifier.size(20.dp))
                                        } else {
                                            Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(20.dp))
                                            Text("Add Site Photo (${uploadedImages.size}/10)", style = MaterialTheme.typography.labelMedium)
                                        }
                                    }
                                }
                            }

                            Text("Site Visit Description & Observations", fontWeight = FontWeight.Bold)

                            SwayogTextField(
                                value = completionMessage,
                                onValueChange = { completionMessage = it },
                                label = "Site Observations / Remarks",
                                placeholder = "Enter details of site inspection, system feasibility, roof state...",
                                singleLine = false
                            )

                            SwayogTextField(
                                value = docUrl,
                                onValueChange = { docUrl = it },
                                label = "Document Link (Optional)",
                                placeholder = "URL of report blueprint, or proof"
                            )

                            SwayogButton(
                                text = if (isProcessing) "Processing..." else "Submit Site Visit",
                                enabled = uploadedImages.size >= 4 && completionMessage.trim().length >= 3 && !isProcessing,
                                onClick = {
                                    if (uploadedImages.size < 4) {
                                        Toast.makeText(context, "Minimum 4 site photos required", Toast.LENGTH_SHORT).show()
                                    } else if (completionMessage.trim().length < 3) {
                                        Toast.makeText(context, "Observations description must be at least 3 characters", Toast.LENGTH_SHORT).show()
                                    } else {
                                        val finalMessage = completionMessage.trim()
                                        val firstPhoto = uploadedImages.firstOrNull()
                                        val lastPhoto = if (uploadedImages.size > 1) uploadedImages.last() else firstPhoto
                                        onCompleteTask(
                                            finalMessage,
                                            docUrl.trim().ifEmpty { null },
                                            firstPhoto,
                                            lastPhoto,
                                            beforeLat,
                                            beforeLng,
                                            afterLat,
                                            afterLng,
                                            "SITE_VISIT",
                                            uploadedImages,
                                            null,
                                            null,
                                            uploadedImages
                                        )
                                    }
                                }
                            )
                        } else {
                            // Cleaning / Maintenance / Regular Before & After Flow
                            Text(
                                text = "📷 Before & After Photos (GPS Proof)",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                // Before Photo
                                Column(
                                    modifier = Modifier.weight(1f),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("Before Work", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    if (beforeBitmap != null) {
                                        Box {
                                            Image(
                                                bitmap = beforeBitmap!!.asImageBitmap(),
                                                contentDescription = "Before photo",
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(120.dp)
                                                    .clip(RoundedCornerShape(8.dp)),
                                                contentScale = ContentScale.Crop
                                            )
                                            IconButton(
                                                onClick = {
                                                    beforeBitmap = null
                                                    beforeImageUrl = null
                                                    beforeLat = null
                                                    beforeLng = null
                                                    afterBitmap = null
                                                    afterImageUrl = null
                                                    afterLat = null
                                                    afterLng = null
                                                },
                                                modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.Red, modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    } else {
                                        OutlinedButton(
                                            onClick = { launchPhotoPicker("before") },
                                            modifier = Modifier.fillMaxWidth().height(120.dp),
                                            enabled = !isProcessing,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                if (isProcessing && pendingPhotoType == "before") {
                                                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                                } else {
                                                    Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(28.dp))
                                                    Text("Upload Photo", style = MaterialTheme.typography.labelSmall)
                                                }
                                            }
                                        }
                                    }
                                }

                                // After Photo
                                Column(
                                    modifier = Modifier.weight(1f),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("After Work", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    if (afterBitmap != null) {
                                        Box {
                                            Image(
                                                bitmap = afterBitmap!!.asImageBitmap(),
                                                contentDescription = "After photo",
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(120.dp)
                                                    .clip(RoundedCornerShape(8.dp)),
                                                contentScale = ContentScale.Crop
                                            )
                                            IconButton(
                                                onClick = {
                                                    afterBitmap = null
                                                    afterImageUrl = null
                                                    afterLat = null
                                                    afterLng = null
                                                },
                                                modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.Red, modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    } else {
                                        OutlinedButton(
                                            onClick = { launchPhotoPicker("after") },
                                            modifier = Modifier.fillMaxWidth().height(120.dp),
                                            enabled = beforeImageUrl != null && !isProcessing,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                if (isProcessing && pendingPhotoType == "after") {
                                                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                                } else {
                                                    Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(28.dp))
                                                    Text("Upload Photo", style = MaterialTheme.typography.labelSmall)
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            if (beforeImageUrl != null && afterImageUrl != null) {
                                Text("Complete Task Form", fontWeight = FontWeight.Bold)

                                SwayogTextField(
                                    value = completionMessage,
                                    onValueChange = { completionMessage = it },
                                    label = "Completion Message",
                                    placeholder = "Describe what was accomplished...",
                                    singleLine = false
                                )

                                SwayogTextField(
                                    value = docUrl,
                                    onValueChange = { docUrl = it },
                                    label = "Document Link (Optional)",
                                    placeholder = "URL of report blueprint, or proof"
                                )
                            }

                            SwayogButton(
                                text = if (isProcessing) "Processing..." else "Mark Task Completed",
                                enabled = beforeImageUrl != null && afterImageUrl != null && completionMessage.trim().length >= 3 && !isProcessing,
                                onClick = {
                                    if (completionMessage.trim().length < 3) {
                                        Toast.makeText(context, "Completion description must be at least 3 characters", Toast.LENGTH_SHORT).show()
                                    } else if (beforeImageUrl == null) {
                                        Toast.makeText(context, "Before Image is required", Toast.LENGTH_SHORT).show()
                                    } else if (afterImageUrl == null) {
                                        Toast.makeText(context, "After Image is required", Toast.LENGTH_SHORT).show()
                                    } else {
                                        val finalMessage = completionMessage.trim()
                                        onCompleteTask(
                                            finalMessage,
                                            docUrl.trim().ifEmpty { null },
                                            beforeImageUrl,
                                            afterImageUrl,
                                            beforeLat,
                                            beforeLng,
                                            afterLat,
                                            afterLng,
                                            taskType,
                                            null,
                                            null,
                                            null,
                                            null
                                        )
                                    }
                                }
                            )
                        }

                        // Completed Task Image Display
                        if (task.status == "completed") {
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Site Visit / Multiple Task Photos Gallery
                            val photosList = (task.sitePhotos?.takeIf { it.isNotEmpty() } ?: task.images)?.filter { it.isNotBlank() } ?: emptyList()
                            if (photosList.isNotEmpty()) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0B6E4F).copy(alpha = 0.1f))
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Icon(Icons.Default.CameraAlt, contentDescription = null, tint = Color(0xFF0B6E4F))
                                            Text(
                                                text = "Site Visit Photos (${photosList.size})",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF0B6E4F)
                                            )
                                        }
                                        
                                        Divider()
                                        
                                        LazyColumn(
                                            modifier = Modifier.height(220.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            items(photosList.size) { index ->
                                                val photoUrl = photosList[index]
                                                Card(
                                                    modifier = Modifier.fillMaxWidth()
                                                ) {
                                                    Box {
                                                        AsyncImage(
                                                            model = photoUrl,
                                                            contentDescription = "Site photo ${index + 1}",
                                                            modifier = Modifier
                                                                .fillMaxWidth()
                                                                .height(150.dp),
                                                            contentScale = ContentScale.Crop
                                                        )
                                                        Text(
                                                            text = "Photo #${index + 1}",
                                                            modifier = Modifier
                                                                .align(Alignment.BottomStart)
                                                                .padding(8.dp)
                                                                .background(Color.Black.copy(alpha = 0.6f))
                                                                .padding(4.dp),
                                                            color = Color.White,
                                                            style = MaterialTheme.typography.labelSmall
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Before/After Photos for Tasks
                            if (task.beforeImageUrl != null || task.afterImageUrl != null) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0B6E4F).copy(alpha = 0.1f))
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Icon(Icons.Default.CameraAlt, contentDescription = null, tint = Color(0xFF0B6E4F))
                                            Text(
                                                text = "Work Proof Photos",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF0B6E4F)
                                            )
                                        }
                                        
                                        Divider()
                                        
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            // Before Photo
                                            if (task.beforeImageUrl != null) {
                                                Card(
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Column {
                                                        Text(
                                                            text = "Before Work",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            fontWeight = FontWeight.Bold,
                                                            modifier = Modifier.padding(8.dp)
                                                        )
                                                        AsyncImage(
                                                            model = task.beforeImageUrl,
                                                            contentDescription = "Before photo",
                                                            modifier = Modifier
                                                                .fillMaxWidth()
                                                                .height(120.dp),
                                                            contentScale = ContentScale.Crop
                                                        )
                                                        if (task.beforeLatitude != null && task.beforeLongitude != null) {
                                                            Text(
                                                                text = "📍 ${task.beforeLatitude!!.toString().take(6)}, ${task.beforeLongitude!!.toString().take(6)}",
                                                                style = MaterialTheme.typography.labelSmall,
                                                                modifier = Modifier.padding(8.dp),
                                                                color = Color.Blue
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            // After Photo
                                            if (task.afterImageUrl != null) {
                                                Card(
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Column {
                                                        Text(
                                                            text = "After Work",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            fontWeight = FontWeight.Bold,
                                                            modifier = Modifier.padding(8.dp)
                                                        )
                                                        AsyncImage(
                                                            model = task.afterImageUrl,
                                                            contentDescription = "After photo",
                                                            modifier = Modifier
                                                                .fillMaxWidth()
                                                                .height(120.dp),
                                                            contentScale = ContentScale.Crop
                                                        )
                                                        if (task.afterLatitude != null && task.afterLongitude != null) {
                                                            Text(
                                                                text = "📍 ${task.afterLatitude!!.toString().take(6)}, ${task.afterLongitude!!.toString().take(6)}",
                                                                style = MaterialTheme.typography.labelSmall,
                                                                modifier = Modifier.padding(8.dp),
                                                                color = Color.Blue
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

                        // Invoice Display
                        task.invoice?.let { invoice ->
                            Spacer(modifier = Modifier.height(16.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B6E4F).copy(alpha = 0.1f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(Icons.Default.Receipt, contentDescription = null, tint = Color(0xFF0B6E4F))
                                        Text(
                                            text = "Invoice Generated",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF0B6E4F)
                                        )
                                    }
                                    
                                    Divider()
                                    
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Invoice Number:", style = MaterialTheme.typography.bodyMedium)
                                        Text(
                                            invoice.invoiceNumber ?: "N/A",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Amount:", style = MaterialTheme.typography.bodyMedium)
                                        Text(
                                            "₹${invoice.amount}",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF0B6E4F)
                                        )
                                    }
                                    
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Status:", style = MaterialTheme.typography.bodyMedium)
                                        Text(
                                            invoice.status,
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    
                                    invoice.paymentMethod?.let { method ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("Payment Method:", style = MaterialTheme.typography.bodyMedium)
                                            Text(
                                                method,
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                        }
                                    }
                                    
                                    invoice.proofUrl?.let { proof ->
                                        Spacer(modifier = Modifier.height(8.dp))
                                        TextButton(
                                            onClick = {
                                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(proof))
                                                context.startActivity(intent)
                                            }
                                        ) {
                                            Text("View Proof Document")
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
}
