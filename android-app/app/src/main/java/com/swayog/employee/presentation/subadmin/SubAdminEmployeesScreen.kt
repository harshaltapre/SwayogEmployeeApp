package com.swayog.employee.presentation.subadmin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.window.Dialog
import com.swayog.employee.data.model.Employee
import android.widget.Toast
import com.swayog.employee.data.model.Task
import com.swayog.employee.presentation.common.components.BeforeAfterImageSection
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTopBar
import com.swayog.employee.presentation.common.utils.ImageUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminEmployeesScreen(
    onNavigateBack: () -> Unit,
    viewModel: SubAdminEmployeesViewModel = hiltViewModel()
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val serverUrl by viewModel.dataStoreManager.serverUrl.collectAsState(initial = null)
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var selectedEmployee by remember { mutableStateOf<Employee?>(null) }
    var viewMode by remember { mutableStateOf("grid") }
    var showCreateEmployeeDialog by remember { mutableStateOf(false) }

    if (selectedEmployee != null) {
        EmployeeDetailContent(
            employee = selectedEmployee!!,
            tasks = uiState.tasks.filter { it.employeeUserId == selectedEmployee!!.id },
            serverUrl = serverUrl,
            onBack = { selectedEmployee = null }
        )
        return
    }

    if (showCreateEmployeeDialog) {
        CreateEmployeeDialog(
            onDismiss = { showCreateEmployeeDialog = false },
            onCreateEmployee = { request ->
                viewModel.createEmployee(
                    request = request,
                    onSuccess = {
                        showCreateEmployeeDialog = false
                        Toast.makeText(context, "Employee created successfully!", Toast.LENGTH_SHORT).show()
                    },
                    onError = { err ->
                        Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                    }
                )
            }
        )
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Staff Section",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { showCreateEmployeeDialog = true }) {
                        Icon(Icons.Default.PersonAdd, contentDescription = "Add Employee")
                    }
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateEmployeeDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Employee")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text(
                text = "Manage staff and track assigned tasks.",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF64748B),
                modifier = Modifier.padding(bottom = 16.dp)
            )

            TabRow(
                selectedTabIndex = selectedTabIndex,
                containerColor = Color(0xFFF1F5F9),
                modifier = Modifier.clip(RoundedCornerShape(8.dp)),
                indicator = { } // Remove default indicator
            ) {
                val tabs = listOf("Staff Directory", "Assigned Tasks")
                tabs.forEachIndexed { index, title ->
                    val selected = selectedTabIndex == index
                    Tab(
                        selected = selected,
                        onClick = { selectedTabIndex = index },
                        modifier = Modifier
                            .padding(4.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (selected) Color.White else Color.Transparent),
                        text = {
                            Text(
                                text = title,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                color = if (selected) Color(0xFF0F172A) else Color(0xFF64748B)
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (uiState.isLoading && uiState.employees.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                if (uiState.error != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                        modifier = Modifier.padding(bottom = 8.dp)
                    ) {
                        Text(
                            uiState.error!!,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.padding(8.dp),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }

                if (selectedTabIndex == 0) {
                    StaffDirectoryTab(
                        employees = uiState.filteredEmployees,
                        avgRating = uiState.avgRating,
                        viewMode = viewMode,
                        onViewModeChange = { viewMode = it },
                        onEmployeeClick = { selectedEmployee = it }
                    )
                } else {
                    AssignedTasksTab(
                        tasks = uiState.tasks,
                        employees = uiState.employees,
                        serverUrl = serverUrl,
                        onAssignTask = { taskId, empId ->
                            viewModel.assignTask(
                                taskId = taskId,
                                employeeUserId = empId,
                                onSuccess = {
                                    Toast.makeText(context, "Task assigned successfully!", Toast.LENGTH_SHORT).show()
                                },
                                onError = { err ->
                                    Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                }
                            )
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun StaffDirectoryTab(
    employees: List<Employee>,
    avgRating: Double,
    viewMode: String,
    onViewModeChange: (String) -> Unit,
    onEmployeeClick: (Employee) -> Unit
) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCard(title = "Total Staff", value = employees.size.toString(), icon = Icons.Default.Group)
                StatCard(title = "Avg Rating", value = String.format("%.1f", avgRating), icon = Icons.Default.Star, iconColor = Color(0xFF16A34A))
            }
            Row(
                modifier = Modifier
                    .background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp))
                    .padding(4.dp)
            ) {
                IconButton(
                    onClick = { onViewModeChange("grid") },
                    modifier = Modifier
                        .background(if (viewMode == "grid") Color.White else Color.Transparent, RoundedCornerShape(6.dp))
                        .size(36.dp)
                ) {
                    Icon(Icons.Default.GridView, contentDescription = "Grid", modifier = Modifier.size(20.dp))
                }
                IconButton(
                    onClick = { onViewModeChange("table") },
                    modifier = Modifier
                        .background(if (viewMode == "table") Color.White else Color.Transparent, RoundedCornerShape(6.dp))
                        .size(36.dp)
                ) {
                    Icon(Icons.Default.List, contentDescription = "Table", modifier = Modifier.size(20.dp))
                }
            }
        }

        if (employees.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No employees found.", color = Color.Gray)
            }
        } else if (viewMode == "grid") {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(employees, key = { it.id }) { employee ->
                    EmployeeGridCard(employee, onEmployeeClick)
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(employees, key = { it.id }) { employee ->
                    EmployeeListCard(employee, onEmployeeClick)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeDetailContent(
    employee: Employee,
    tasks: List<Task>,
    serverUrl: String?,
    onBack: () -> Unit
) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var selectedTaskForDetails by remember { mutableStateOf<Task?>(null) }

    if (selectedTaskForDetails != null) {
        val detailTask = selectedTaskForDetails!!
        Dialog(onDismissRequest = { selectedTaskForDetails = null }) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = detailTask.jobType ?: "Task Details",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(onClick = { selectedTaskForDetails = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    Divider()

                    Text("Status: ${(detailTask.status ?: "Unknown").replace("_", " ").uppercase()}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("Description: ${detailTask.description ?: "N/A"}")
                    Text("Customer: ${detailTask.customerName ?: "N/A"}")
                    Text("Phone: ${detailTask.customerPhone ?: "N/A"}")
                    Text("Address: ${detailTask.address ?: "N/A"}")

                    if (!detailTask.completionMessage.isNullOrBlank()) {
                        Text("Completion Remarks / Observations:", fontWeight = FontWeight.Bold)
                        Text(detailTask.completionMessage, style = MaterialTheme.typography.bodyMedium)
                    }

                    BeforeAfterImageSection(
                        beforeImageUrl = detailTask.beforeImageUrl,
                        afterImageUrl = detailTask.afterImageUrl,
                        sitePhotos = detailTask.sitePhotos ?: detailTask.images,
                        taskType = detailTask.taskType,
                        jobType = detailTask.jobType,
                        isSiteVisit = detailTask.isSiteVisit,
                        serverUrl = serverUrl
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { selectedTaskForDetails = null },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Close")
                    }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(employee.fullName) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Employee Profile Card
            SwayogCard {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .background(Color(0xFF0F172A), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = employee.fullName.firstOrNull()?.toString() ?: "?",
                            color = Color.White,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = employee.fullName,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = employee.role.replace("_", " ").lowercase().replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    androidx.compose.material3.Divider(color = Color.LightGray.copy(alpha = 0.5f))
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(employee.phoneNumber ?: "N/A", fontSize = 14.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Email, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = employee.email, 
                                fontSize = 14.sp,
                                modifier = Modifier.weight(1f),
                                maxLines = 1,
                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Zone: ${employee.zone}", fontSize = 14.sp)
                        }
                    }
                }
            }

            // Stats Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Active Tasks", 
                    value = tasks.size.toString(), 
                    icon = Icons.Default.Assignment
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Rating", 
                    value = String.format("%.1f", employee.rating ?: 0.0), 
                    icon = Icons.Default.Star, 
                    iconColor = Color(0xFF16A34A)
                )
            }

            // Tabs
            TabRow(
                selectedTabIndex = selectedTabIndex,
                containerColor = Color(0xFFF1F5F9),
                modifier = Modifier.clip(RoundedCornerShape(8.dp)),
                indicator = { }
            ) {
                val tabs = listOf("Assigned Tasks", "Profile")
                tabs.forEachIndexed { index, title ->
                    val selected = selectedTabIndex == index
                    Tab(
                        selected = selected,
                        onClick = { selectedTabIndex = index },
                        modifier = Modifier
                            .padding(4.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (selected) Color.White else Color.Transparent),
                        text = {
                            Text(
                                text = title,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                color = if (selected) Color(0xFF0F172A) else Color(0xFF64748B)
                            )
                        }
                    )
                }
            }

            // Tab Content
            if (selectedTabIndex == 0) {
                if (tasks.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No assigned tasks", color = Color.Gray)
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(tasks) { task ->
                            TaskCard(task = task, onClick = { selectedTaskForDetails = task })
                        }
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    item {
                        InfoRow("Role", employee.role)
                        InfoRow("Email", employee.email)
                        InfoRow("Phone", employee.phoneNumber ?: "N/A")
                        InfoRow("Zone", employee.zone)
                        InfoRow("Status", employee.status ?: "active")
                        InfoRow("Created", employee.createdAt)
                    }
                }
            }
        }
    }
}

@Composable
fun TaskCard(task: Task, onClick: (() -> Unit)? = null) {
    SwayogCard(
        modifier = if (onClick != null) Modifier.clickable { onClick() } else Modifier
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = task.jobType ?: "Unknown",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Badge(
                    containerColor = when (task.status?.lowercase()) {
                        "completed" -> Color(0xFFDCFCE7)
                        "in_progress" -> Color(0xFFDBEAFE)
                        else -> Color(0xFFFEF3C7)
                    },
                    contentColor = when (task.status?.lowercase()) {
                        "completed" -> Color(0xFF166534)
                        "in_progress" -> Color(0xFF1E40AF)
                        else -> Color(0xFF92400E)
                    }
                ) {
                    Text((task.status ?: "Unknown").replace("_", " "), fontSize = 10.sp)
                }
            }
            Text(task.description ?: "", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            if (!task.scheduledTime.isNullOrEmpty()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CalendarToday, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(task.scheduledTime ?: "", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontWeight = FontWeight.Bold, color = Color.Gray)
        Text(value)
    }
}

@Composable
fun EmployeeGridCard(employee: Employee, onClick: (Employee) -> Unit) {
    SwayogCard(
        modifier = Modifier.clickable { onClick(employee) },
        elevation = 0
    ) {
        Column(modifier = Modifier.padding(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = employee.fullName.firstOrNull()?.toString() ?: "?",
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = employee.fullName,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    val displayRole = employee.employeeProfile?.jobRole?.replace("_", " ")?.split(" ")?.joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } } ?: employee.role.replaceFirstChar { it.uppercase() }
                    Text(
                        text = displayRole,
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("ZONE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Text(employee.zone, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("STATUS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Text(
                        if (employee.isActive) "Active" else "Inactive",
                        fontSize = 12.sp,
                        color = if (employee.isActive) Color(0xFF10B981) else Color.Gray,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun EmployeeListCard(employee: Employee, onClick: (Employee) -> Unit) {
    SwayogCard(
        modifier = Modifier.clickable { onClick(employee) },
        elevation = 0
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = employee.fullName.firstOrNull()?.toString() ?: "?",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(employee.fullName, fontWeight = FontWeight.Bold)
                val displayRole = employee.employeeProfile?.jobRole?.replace("_", " ")?.split(" ")?.joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } } ?: employee.role.replaceFirstChar { it.uppercase() }
                Text("$displayRole • ${employee.zone}", fontSize = 12.sp, color = Color.Gray)
            }
            Text(
                if (employee.isActive) "Active" else "Inactive",
                fontSize = 12.sp,
                color = if (employee.isActive) Color(0xFF10B981) else Color.Gray,
                modifier = Modifier.background(
                    if (employee.isActive) Color(0xFFD1FAE5) else Color(0xFFF1F5F9),
                    RoundedCornerShape(4.dp)
                ).padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
fun AssignedTasksTab(
    tasks: List<Task>,
    employees: List<Employee>,
    serverUrl: String? = null,
    onAssignTask: (String, String) -> Unit = { _, _ -> }
) {
    var showAssignDialog by remember { mutableStateOf<Task?>(null) }
    var selectedTaskForPreview by remember { mutableStateOf<Task?>(null) }

    if (selectedTaskForPreview != null) {
        val detailTask = selectedTaskForPreview!!
        Dialog(onDismissRequest = { selectedTaskForPreview = null }) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = detailTask.jobType ?: "Task Details",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(onClick = { selectedTaskForPreview = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    Divider()

                    Text("Status: ${(detailTask.status ?: "Unknown").replace("_", " ").uppercase()}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("Description: ${detailTask.description ?: "N/A"}")
                    Text("Customer: ${detailTask.customerName ?: "N/A"}")
                    Text("Phone: ${detailTask.customerPhone ?: "N/A"}")
                    Text("Address: ${detailTask.address ?: "N/A"}")

                    if (!detailTask.completionMessage.isNullOrBlank()) {
                        Text("Completion Remarks / Observations:", fontWeight = FontWeight.Bold)
                        Text(detailTask.completionMessage, style = MaterialTheme.typography.bodyMedium)
                    }

                    BeforeAfterImageSection(
                        beforeImageUrl = detailTask.beforeImageUrl,
                        afterImageUrl = detailTask.afterImageUrl,
                        sitePhotos = detailTask.sitePhotos ?: detailTask.images,
                        taskType = detailTask.taskType,
                        jobType = detailTask.jobType,
                        isSiteVisit = detailTask.isSiteVisit,
                        serverUrl = serverUrl
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { selectedTaskForPreview = null },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Close")
                    }
                }
            }
        }
    }
    
    if (showAssignDialog != null) {
        val task = showAssignDialog!!
        var selectedEmpId by remember { mutableStateOf(task.employeeUserId ?: "") }
        
        AlertDialog(
            onDismissRequest = { showAssignDialog = null },
            title = { Text("Assign Task") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Select employee for: ${task.jobType}")
                    LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                        items(employees) { emp ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedEmpId = emp.id }
                                    .padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(selected = selectedEmpId == emp.id, onClick = { selectedEmpId = emp.id })
                                Text(emp.fullName)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onAssignTask(task.id, selectedEmpId)
                        showAssignDialog = null
                    },
                    enabled = selectedEmpId.isNotBlank()
                ) { Text("Assign") }
            },
            dismissButton = {
                TextButton(onClick = { showAssignDialog = null }) { Text("Cancel") }
            }
        )
    }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(tasks) { task ->
            val assignedEmp = employees.find { it.id == task.employeeUserId }
            SwayogCard(
                elevation = 0,
                modifier = Modifier.clickable { 
                    if (task.status == "completed") {
                        selectedTaskForPreview = task
                    } else {
                        showAssignDialog = task
                    }
                }
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(task.jobType ?: "Unknown", fontWeight = FontWeight.Bold)
                        Badge(
                            containerColor = if (task.status == "completed") Color(0xFFDCFCE7) else Color(0xFFFEF3C7)
                        ) {
                            Text(task.status ?: "Unknown", fontSize = 10.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(task.customerName ?: "Unknown", fontSize = 14.sp)
                    Text(task.scheduledTime ?: "", fontSize = 12.sp, color = Color.Gray)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = assignedEmp?.fullName ?: "Unassigned",
                                fontSize = 12.sp,
                                color = if (assignedEmp != null) Color.Black else Color.Gray
                            )
                        }
                        if (task.status != "completed") {
                            Text(
                                "Tap to reassign",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color? = null
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .background(Color.White.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(8.dp)
            ) {
                Icon(icon, contentDescription = null, tint = iconColor ?: MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
                Text(value, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
            }
        }
    }
}
