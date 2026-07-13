package com.swayog.employee.presentation.subadmin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.Task
import com.swayog.employee.presentation.common.components.SwayogCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminEmployeesScreen(
    viewModel: SubAdminEmployeesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTabIndex by remember { mutableStateOf(0) }
    var selectedEmployee by remember { mutableStateOf<Employee?>(null) }
    var viewMode by remember { mutableStateOf("grid") }

    if (selectedEmployee != null) {
        // Employee Details Screen mock (we will implement EmployeeDetailContent later)
        Column(modifier = Modifier.fillMaxSize()) {
            TopAppBar(
                title = { Text(selectedEmployee!!.fullName) },
                navigationIcon = {
                    IconButton(onClick = { selectedEmployee = null }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Employee Detail Content")
            }
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        Text(
            text = "Employee Section",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
            color = Color(0xFF0F172A)
        )
        Text(
            text = "Manage staff and track assigned tasks.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF64748B),
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
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

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (uiState.error != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(uiState.error!!, color = MaterialTheme.colorScheme.error)
            }
        } else {
            if (selectedTabIndex == 0) {
                StaffDirectoryTab(
                    employees = uiState.employees,
                    viewMode = viewMode,
                    onViewModeChange = { viewMode = it },
                    onEmployeeClick = { selectedEmployee = it }
                )
            } else {
                AssignedTasksTab(
                    tasks = uiState.tasks,
                    employees = uiState.employees
                )
            }
        }
    }
}

@Composable
fun StaffDirectoryTab(
    employees: List<Employee>,
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
                items(employees) { employee ->
                    EmployeeGridCard(employee, onEmployeeClick)
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(employees) { employee ->
                    EmployeeListCard(employee, onEmployeeClick)
                }
            }
        }
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
fun AssignedTasksTab(tasks: List<Task>, employees: List<Employee>) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(tasks) { task ->
            val assignedEmp = employees.find { it.id == task.employeeUserId }
            SwayogCard(elevation = 0) {
                Column(modifier = Modifier.padding(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(task.jobType, fontWeight = FontWeight.Bold)
                        Text(task.status, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(task.customerName, fontSize = 14.sp)
                    Text(task.scheduledTime, fontSize = 12.sp, color = Color.Gray)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = assignedEmp?.fullName ?: "Unassigned",
                            fontSize = 12.sp,
                            color = if (assignedEmp != null) Color.Black else Color.Gray
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Card(
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
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
                Text(value, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
            }
        }
    }
}
