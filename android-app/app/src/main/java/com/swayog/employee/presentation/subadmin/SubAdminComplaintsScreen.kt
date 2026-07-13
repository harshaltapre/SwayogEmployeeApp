package com.swayog.employee.presentation.subadmin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.ServiceRequest
import com.swayog.employee.presentation.common.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminComplaintsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SubAdminComplaintsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val state by viewModel.state.collectAsState()
    val complaints by viewModel.complaints.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val actionState by viewModel.actionState.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedComplaint by remember { mutableStateOf<ServiceRequest?>(null) }
    var isScheduleOpen by remember { mutableStateOf(false) }

    val filteredComplaints = remember(complaints, selectedTab) {
        when (selectedTab) {
            1 -> complaints.filter { it.status.lowercase() == "pending" }
            2 -> complaints.filter { it.status.lowercase() == "scheduled" }
            3 -> complaints.filter { it.status.lowercase() == "resolved" }
            else -> complaints
        }
    }

    LaunchedEffect(actionState) {
        when (actionState) {
            is ComplaintActionState.Success -> {
                Toast.makeText(context, (actionState as ComplaintActionState.Success).message, Toast.LENGTH_SHORT).show()
                isScheduleOpen = false
                selectedComplaint = null
                viewModel.resetActionState()
            }
            is ComplaintActionState.Error -> {
                Toast.makeText(context, (actionState as ComplaintActionState.Error).message, Toast.LENGTH_LONG).show()
                viewModel.resetActionState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Service Requests",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadData() }) {
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
            // Tab Row
            TabRow(selectedTabIndex = selectedTab) {
                Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("All") })
                Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("Pending") })
                Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }, text = { Text("Scheduled") })
                Tab(selected = selectedTab == 3, onClick = { selectedTab = 3 }, text = { Text("Resolved") })
            }

            // List
            if (state is SubAdminComplaintsState.Loading && complaints.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (filteredComplaints.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "No service requests found.",
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
                    items(filteredComplaints, key = { it.id }) { complaint ->
                        ComplaintItem(
                            complaint = complaint,
                            onClick = { selectedComplaint = complaint }
                        )
                    }
                }
            }
        }

        // Details Modal Dialog
        selectedComplaint?.let { complaint ->
            ComplaintDetailsDialog(
                complaint = complaint,
                onDismiss = { selectedComplaint = null },
                onScheduleClick = { isScheduleOpen = true },
                onResolveClick = { viewModel.resolveComplaint(complaint.id) },
                isLoading = actionState is ComplaintActionState.Loading
            )
        }

        // Reschedule/Schedule Dialog
        if (isScheduleOpen && selectedComplaint != null) {
            ScheduleVisitDialog(
                employees = employees,
                onDismiss = { isScheduleOpen = false },
                onSubmit = { date, time, techId ->
                    viewModel.scheduleComplaint(
                        requestId = selectedComplaint!!.id,
                        date = date,
                        time = time,
                        technicianId = techId
                    )
                },
                isLoading = actionState is ComplaintActionState.Loading
            )
        }
    }
}

@Composable
fun ComplaintItem(
    complaint: ServiceRequest,
    onClick: () -> Unit
) {
    val statusUpper = complaint.status.uppercase()
    val (statusColor, statusBg) = when (statusUpper) {
        "PENDING" -> Color(0xFFEF4444) to Color(0xFFFEE2E2) // Red
        "SCHEDULED" -> Color(0xFF3B82F6) to Color(0xFFDBEAFE) // Blue
        "RESOLVED" -> Color(0xFF10B981) to Color(0xFFD1FAE5) // Green
        else -> Color(0xFF6B7280) to Color(0xFFF3F4F6)
    }

    SwayogCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = complaint.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = complaint.status.replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = complaint.description,
                style = MaterialTheme.typography.bodySmall,
                maxLines = 2,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Created: " + complaint.createdAt.substringBefore("T"),
                    style = MaterialTheme.typography.bodySmall,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )

                if (complaint.scheduledDate != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CalendarToday,
                            contentDescription = "Date",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = complaint.scheduledDate + (complaint.scheduledTime?.let { " $it" } ?: ""),
                            style = MaterialTheme.typography.bodySmall,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ComplaintDetailsDialog(
    complaint: ServiceRequest,
    onDismiss: () -> Unit,
    onScheduleClick: () -> Unit,
    onResolveClick: () -> Unit,
    isLoading: Boolean
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Ticket Details",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "Title", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(text = complaint.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)

                    Text(text = "Description", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(text = complaint.description, style = MaterialTheme.typography.bodyMedium)

                    complaint.address?.let {
                        Text(text = "Address", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        Text(text = it, style = MaterialTheme.typography.bodyMedium)
                    }

                    Text(text = "Current Status", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(text = complaint.status.uppercase(), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (complaint.status.lowercase() != "resolved") {
                        Button(
                            onClick = onScheduleClick,
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading
                        ) {
                            Text(if (complaint.status.lowercase() == "scheduled") "Reschedule" else "Schedule")
                        }
                        
                        Button(
                            onClick = onResolveClick,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            enabled = !isLoading
                        ) {
                            Text("Resolve")
                        }
                    }
                }

                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                    enabled = !isLoading
                ) {
                    Text("Close")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleVisitDialog(
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onSubmit: (String, String?, String) -> Unit,
    isLoading: Boolean
) {
    var date by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }
    var selectedEmployeeId by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    // Filter to technicians/engineers
    val technicians = remember(employees) {
        employees.filter { emp ->
            val role = emp.role.lowercase()
            val jobRole = emp.employeeProfile?.jobRole?.lowercase() ?: ""
            role.contains("technician") || role.contains("engineer") ||
            jobRole.contains("technician") || jobRole.contains("engineer") ||
            jobRole.contains("field")
        }
    }

    val selectedEmployeeName = remember(selectedEmployeeId, technicians) {
        technicians.find { it.id == selectedEmployeeId }?.fullName ?: "Select Technician"
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Schedule Visit",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Scheduled Date (YYYY-MM-DD)") },
                    placeholder = { Text("e.g. 2026-07-15") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Scheduled Time (Optional)") },
                    placeholder = { Text("e.g. 10:00 AM") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Dropdown Selector for Technicians
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = selectedEmployeeName,
                        onValueChange = {},
                        label = { Text("Assign Technician") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { expanded = true },
                        enabled = false,
                        trailingIcon = {
                            Icon(Icons.Default.ArrowDropDown, contentDescription = "Dropdown")
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        technicians.forEach { tech ->
                            DropdownMenuItem(
                                text = {
                                    Text("${tech.fullName} (${tech.employeeProfile?.jobRole ?: tech.role})")
                                },
                                onClick = {
                                    selectedEmployeeId = tech.id
                                    expanded = false
                                }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isLoading) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            onSubmit(date, time.ifBlank { null }, selectedEmployeeId)
                        },
                        enabled = date.isNotBlank() && selectedEmployeeId.isNotBlank() && !isLoading
                    ) {
                        if (isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                        else Text("Confirm")
                    }
                }
            }
        }
    }
}
