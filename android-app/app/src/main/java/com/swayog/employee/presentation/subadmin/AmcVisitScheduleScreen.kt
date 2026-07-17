package com.swayog.employee.presentation.subadmin

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.AmcVisit
import com.swayog.employee.presentation.common.components.SwayogButton
import com.swayog.employee.presentation.common.components.SwayogTextField
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcVisitScheduleScreen(
    customerId: Int?,
    customerName: String?,
    onClearCustomer: () -> Unit,
    viewModel: AmcManagementViewModel = hiltViewModel()
) {
    val amcVisits by viewModel.amcVisits.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    
    var selectedMonth by remember { mutableStateOf(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"))) }
    var showCompletionLogs by remember { mutableStateOf(false) }
    
    var selectedVisitForAction by remember { mutableStateOf<AmcVisit?>(null) }
    var actionType by remember { mutableStateOf<String?>(null) } // "EDIT" or "MARK_DONE"
    
    LaunchedEffect(customerId) {
        viewModel.loadAmcVisits(customerId)
    }
    
    // Derived stats
    val pendingVisits = amcVisits.filter { it.status == "PENDING" }
    val completedVisits = amcVisits.filter { it.status == "COMPLETED" }
    
    // Basic overdue logic: pending + scheduledDate is before today
    val today = LocalDate.now()
    val overdueVisits = pendingVisits.filter {
        try {
            val date = LocalDate.parse(it.scheduledDate.take(10))
            date.isBefore(today)
        } catch (e: Exception) {
            false
        }
    }
    
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        // Active Filter Header
        if (customerId != null) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Viewing schedule for: ${customerName ?: "Customer"}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.SemiBold
                    )
                    IconButton(onClick = onClearCustomer, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Clear filter", tint = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
            }
        }
        
        // KPI Cards Row
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            StatCard(title = "Total", value = amcVisits.size.toString(), color = Color(0xFF6366F1), modifier = Modifier.weight(1f))
            StatCard(title = "Completed", value = completedVisits.size.toString(), color = Color(0xFF10B981), modifier = Modifier.weight(1f))
            StatCard(title = "Pending", value = pendingVisits.size.toString(), color = Color(0xFFF59E0B), modifier = Modifier.weight(1f))
            StatCard(title = "Overdue", value = overdueVisits.size.toString(), color = Color(0xFFEF4444), modifier = Modifier.weight(1f))
        }
        
        // Controls Row
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.FilterList, contentDescription = "Filter")
                Spacer(modifier = Modifier.width(4.dp))
                Text("Month: $selectedMonth", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            }
            
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { showCompletionLogs = !showCompletionLogs }) {
                Text("Completion Logs", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                Switch(checked = showCompletionLogs, onCheckedChange = { showCompletionLogs = it }, modifier = Modifier.padding(start = 8.dp))
            }
        }
        
        if (errorMessage != null) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer), modifier = Modifier.padding(16.dp)) {
                Text(text = errorMessage ?: "", color = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.padding(16.dp))
            }
        }
        
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            val displayList = if (showCompletionLogs) completedVisits else pendingVisits
            
            if (displayList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(if (showCompletionLogs) "No completed visits found." else "No pending visits found.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(displayList) { visit ->
                        AmcVisitCard(
                            visit = visit,
                            onEdit = { 
                                selectedVisitForAction = visit
                                actionType = "EDIT"
                            },
                            onMarkDone = {
                                selectedVisitForAction = visit
                                actionType = "MARK_DONE"
                            }
                        )
                    }
                }
            }
        }
    }
    
    // Action Dialogs
    if (selectedVisitForAction != null) {
        if (actionType == "MARK_DONE") {
            MarkDoneDialog(
                visit = selectedVisitForAction!!,
                onDismiss = { selectedVisitForAction = null },
                onSave = { notes, beforeImg, afterImg ->
                    viewModel.markAmcVisitDone(selectedVisitForAction!!.id, notes, beforeImg, afterImg) {
                        selectedVisitForAction = null
                    }
                }
            )
        } else if (actionType == "EDIT") {
            // Placeholder for Edit Dialog
            EditVisitDialog(
                visit = selectedVisitForAction!!,
                onDismiss = { selectedVisitForAction = null },
                onSave = { request ->
                    viewModel.updateAmcVisit(selectedVisitForAction!!.id, request) {
                        selectedVisitForAction = null
                    }
                }
            )
        }
    }
}

@Composable
fun StatCard(title: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(title, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
fun AmcVisitCard(
    visit: AmcVisit,
    onEdit: () -> Unit,
    onMarkDone: () -> Unit
) {
    val isCompleted = visit.status == "COMPLETED"
    val dateColor = if (isCompleted) Color(0xFF10B981) else Color(0xFF6366F1)
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(RoundedCornerShape(8.dp)).background(dateColor.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Event, contentDescription = "Date", tint = dateColor)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(visit.customer?.fullName ?: "Customer #${visit.customerId}", fontWeight = FontWeight.Bold)
                        Text(visit.customer?.city ?: "Unknown City", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    }
                }
                Box(
                    modifier = Modifier
                        .background(if (isCompleted) Color(0xFFD1FAE5) else Color(0xFFFEF3C7), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = visit.status,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isCompleted) Color(0xFF065F46) else Color(0xFF92400E),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Divider(modifier = Modifier.padding(vertical = 12.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Date", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(visit.scheduledDate.take(10), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                }
                Column {
                    Text("Time", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(visit.timeSlot ?: "N/A", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                }
                Column {
                    Text("Cleaning #", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(visit.cleaningNumber?.toString() ?: "N/A", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                }
            }
            
            if (!isCompleted) {
                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    OutlinedButton(onClick = onEdit, modifier = Modifier.padding(end = 8.dp)) {
                        Text("Edit")
                    }
                    Button(onClick = onMarkDone, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))) {
                        Icon(Icons.Default.Check, contentDescription = "Mark Done", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Mark Done")
                    }
                }
            } else {
                Spacer(modifier = Modifier.height(12.dp))
                Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFF3F4F6), RoundedCornerShape(8.dp)).padding(8.dp)) {
                    Text("Completed On: ${visit.completedAt?.take(10) ?: "N/A"}", style = MaterialTheme.typography.bodySmall, color = Color.DarkGray)
                    if (!visit.visitNotes.isNullOrBlank()) {
                        Text("Notes: ${visit.visitNotes}", style = MaterialTheme.typography.bodySmall, color = Color.DarkGray)
                    }
                }
            }
        }
    }
}

@Composable
fun MarkDoneDialog(
    visit: AmcVisit,
    onDismiss: () -> Unit,
    onSave: (notes: String?, beforeImg: String?, afterImg: String?) -> Unit
) {
    var notes by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Complete AMC Visit") },
        text = {
            Column {
                Text("Marking visit for ${visit.customer?.fullName ?: "Customer"} as completed.")
                Spacer(modifier = Modifier.height(8.dp))
                SwayogTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = "Visit Notes (Optional)",
                    modifier = Modifier.fillMaxWidth()
                )
                // In a real app, you'd add Image Picker for before/after photos here.
            }
        },
        confirmButton = {
            Button(onClick = { onSave(notes, null, null) }) {
                Text("Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun EditVisitDialog(
    visit: AmcVisit,
    onDismiss: () -> Unit,
    onSave: (com.swayog.employee.data.model.UpdateAmcVisitRequest) -> Unit
) {
    var date by remember { mutableStateOf(visit.scheduledDate.take(10)) }
    var time by remember { mutableStateOf(visit.timeSlot ?: "") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Visit") },
        text = {
            Column {
                SwayogTextField(value = date, onValueChange = { date = it }, label = "Scheduled Date", modifier = Modifier.fillMaxWidth())
                SwayogTextField(value = time, onValueChange = { time = it }, label = "Time Slot", modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(onClick = {
                onSave(com.swayog.employee.data.model.UpdateAmcVisitRequest(
                    scheduledDate = date,
                    timeSlot = time
                ))
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
