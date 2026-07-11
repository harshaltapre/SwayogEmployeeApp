package com.swayog.employee.presentation.subadmin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.CreateAmcVisitRequest
import com.swayog.employee.data.model.Customer
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTopBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminCalendarScreen(
    onNavigateBack: () -> Unit,
    viewModel: SubAdminCalendarViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val state by viewModel.state.collectAsState()
    val events by viewModel.events.collectAsState()
    val actionState by viewModel.actionState.collectAsState()

    var selectedFilter by remember { mutableIntStateOf(0) }
    var isCreateDialogOpen by remember { mutableStateOf(false) }

    val filteredEvents = remember(events, selectedFilter) {
        when (selectedFilter) {
            1 -> events.filter { it.type.contains("AMC", ignoreCase = true) }
            2 -> events.filter { it.type.contains("Complaint", ignoreCase = true) }
            else -> events
        }
    }

    LaunchedEffect(actionState) {
        when (actionState) {
            is CalendarActionState.Success -> {
                Toast.makeText(context, (actionState as CalendarActionState.Success).message, Toast.LENGTH_SHORT).show()
                viewModel.resetActionState()
                isCreateDialogOpen = false
            }
            is CalendarActionState.Error -> {
                Toast.makeText(context, (actionState as CalendarActionState.Error).message, Toast.LENGTH_LONG).show()
                viewModel.resetActionState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Schedule Calendar",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadEvents() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isCreateDialogOpen = true }
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create AMC Visit")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Filter Bar
            TabRow(selectedTabIndex = selectedFilter) {
                Tab(selected = selectedFilter == 0, onClick = { selectedFilter = 0 }, text = { Text("All visits") })
                Tab(selected = selectedFilter == 1, onClick = { selectedFilter = 1 }, text = { Text("AMC Cleanings") })
                Tab(selected = selectedFilter == 2, onClick = { selectedFilter = 2 }, text = { Text("Complaints") })
            }

            // Events List
            if (state is SubAdminCalendarState.Loading && events.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (filteredEvents.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "No scheduled events found.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            } else {
                // Group by date
                val groupedEvents = remember(filteredEvents) {
                    filteredEvents.groupBy { it.date }
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    groupedEvents.forEach { (date, dailyEvents) ->
                        item {
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.padding(bottom = 8.dp)
                            ) {
                                Text(
                                    text = date,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        items(dailyEvents, key = { it.id }) { event ->
                            CalendarEventItem(event = event)
                        }
                    }
                }
            }
        }

        // Create AMC Visit Dialog
        if (isCreateDialogOpen) {
            CreateAmcVisitDialog(
                onDismiss = { isCreateDialogOpen = false },
                onSubmit = { request ->
                    viewModel.createAmcVisit(request)
                },
                isLoading = actionState is CalendarActionState.Loading
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateAmcVisitDialog(
    onDismiss: () -> Unit,
    onSubmit: (CreateAmcVisitRequest) -> Unit,
    isLoading: Boolean
) {
    var customerId by remember { mutableStateOf("") }
    var scheduledDate by remember { mutableStateOf("") }
    var timeSlot by remember { mutableStateOf("") }
    var assignedEmployeeId by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Create AMC Visit",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(
                    value = customerId,
                    onValueChange = { customerId = it },
                    label = { Text("Customer ID") },
                    placeholder = { Text("Enter customer ID") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = scheduledDate,
                    onValueChange = { scheduledDate = it },
                    label = { Text("Scheduled Date (YYYY-MM-DD)") },
                    placeholder = { Text("e.g. 2026-07-15") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = timeSlot,
                    onValueChange = { timeSlot = it },
                    label = { Text("Time Slot (Optional)") },
                    placeholder = { Text("e.g. 10:00 AM - 12:00 PM") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = assignedEmployeeId,
                    onValueChange = { assignedEmployeeId = it },
                    label = { Text("Assign Employee ID (Optional)") },
                    placeholder = { Text("Enter employee ID") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") },
                    placeholder = { Text("Additional notes...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4
                )

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
                            val request = CreateAmcVisitRequest(
                                customerId = customerId.toIntOrNull() ?: 0,
                                scheduledDate = scheduledDate,
                                timeSlot = timeSlot.ifBlank { null },
                                assignedEmployeeId = assignedEmployeeId.ifBlank { null },
                                notes = notes.ifBlank { null }
                            )
                            onSubmit(request)
                        },
                        enabled = customerId.isNotBlank() && scheduledDate.isNotBlank() && !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        } else {
                            Text("Create Visit")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CalendarEventItem(event: CalendarEvent) {
    val isAmc = event.type.contains("AMC", ignoreCase = true)
    val (typeColor, typeBg) = if (isAmc) {
        Color(0xFF10B981) to Color(0xFFD1FAE5) // Green
    } else {
        Color(0xFF3B82F6) to Color(0xFFDBEAFE) // Blue
    }

    SwayogCard {
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
                Surface(
                    color = typeBg,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = event.type,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = typeColor
                    )
                }

                event.time?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = event.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = event.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = "Address",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = event.address,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1
                )
            }
        }
    }
}
