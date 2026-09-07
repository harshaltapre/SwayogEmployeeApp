package com.swayog.employee.presentation.subadmin

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.swayog.employee.data.model.AmcVisit
import com.swayog.employee.data.model.CreateAmcVisitRequest
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.UpdateAmcVisitRequest
import com.swayog.employee.presentation.common.components.FullScreenImageDialog
import com.swayog.employee.presentation.common.components.SwayogButton
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTextField
import com.swayog.employee.presentation.common.utils.ImageUtils
import java.io.ByteArrayOutputStream
import java.time.LocalDate
import java.time.format.DateTimeFormatter

val TIME_SLOTS = listOf(
    "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM",
    "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
)

val MONTHS_NAMES = listOf(
    "All Months", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcVisitScheduleScreen(
    customerId: Int?,
    customerName: String?,
    onClearCustomer: () -> Unit,
    viewModel: AmcManagementViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val amcVisits by viewModel.amcVisits.collectAsState()
    val customers by viewModel.customers.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    // Filters
    var selectedMonthIndex by remember { mutableIntStateOf(0) } // 0: All Months, 1..12
    var filterDate by remember { mutableStateOf("") }
    var searchQuery by remember { mutableStateOf("") }
    var selectedStatusFilter by remember { mutableStateOf<String?>("ALL") } // "ALL", "COMPLETED", "PENDING", "OVERDUE"
    var showCompletionLogsOnly by remember { mutableStateOf(false) }

    // Dialog state
    var selectedVisitForAction by remember { mutableStateOf<AmcVisit?>(null) }
    var actionType by remember { mutableStateOf<String?>(null) } // "EDIT", "MARK_DONE", "VIEW_PHOTOS"
    var isCreateVisitOpen by remember { mutableStateOf(false) }
    var previewImageUrl by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(customerId) {
        viewModel.loadAmcVisits(customerId)
    }

    // Today reference
    val today = remember { LocalDate.now() }

    // Overdue logic
    fun isVisitOverdue(visit: AmcVisit): Boolean {
        if (visit.status.equals("COMPLETED", ignoreCase = true)) return false
        return try {
            val date = LocalDate.parse(visit.scheduledDate.take(10))
            date.isBefore(today)
        } catch (_: Exception) {
            false
        }
    }

    // Compute derived KPI numbers
    val totalCount = amcVisits.size
    val completedCount = amcVisits.count { it.status.equals("COMPLETED", ignoreCase = true) }
    val pendingCount = amcVisits.count { !it.status.equals("COMPLETED", ignoreCase = true) }
    val overdueCount = amcVisits.count { isVisitOverdue(it) }

    // Filtered list
    val filteredVisits = remember(
        amcVisits,
        selectedMonthIndex,
        filterDate,
        searchQuery,
        selectedStatusFilter,
        showCompletionLogsOnly
    ) {
        amcVisits.filter { visit ->
            // Filter by Completion Logs toggle
            if (showCompletionLogsOnly && !visit.status.equals("COMPLETED", ignoreCase = true)) {
                return@filter false
            }

            // Status filter from KPI tap
            when (selectedStatusFilter) {
                "COMPLETED" -> if (!visit.status.equals("COMPLETED", ignoreCase = true)) return@filter false
                "PENDING" -> if (visit.status.equals("COMPLETED", ignoreCase = true)) return@filter false
                "OVERDUE" -> if (!isVisitOverdue(visit)) return@filter false
            }

            // Month filter
            if (selectedMonthIndex > 0) {
                try {
                    val date = LocalDate.parse(visit.scheduledDate.take(10))
                    if (date.monthValue != selectedMonthIndex) return@filter false
                } catch (_: Exception) {
                    return@filter false
                }
            }

            // Exact date filter
            if (filterDate.isNotBlank()) {
                val visitDateStr = visit.scheduledDate.take(10)
                if (visitDateStr != filterDate) return@filter false
            }

            // Search query
            if (searchQuery.isNotBlank()) {
                val q = searchQuery.lowercase()
                val custName = visit.customer?.fullName?.lowercase() ?: ""
                val city = visit.customer?.city?.lowercase() ?: ""
                val phone = visit.customer?.phoneNumber?.lowercase() ?: ""
                val assignedEmp = employees.find { it.id.toString() == visit.assignedEmployeeId }?.fullName?.lowercase() ?: ""
                if (!custName.contains(q) && !city.contains(q) && !phone.contains(q) && !assignedEmp.contains(q)) {
                    return@filter false
                }
            }

            true
        }.sortedWith(compareBy<AmcVisit> {
            it.status.equals("COMPLETED", ignoreCase = true)
        }.thenBy {
            it.scheduledDate
        })
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
    ) {
        // Active Customer Filter Banner
        if (customerId != null) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Filter: ${customerName ?: "Customer #$customerId"}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    IconButton(
                        onClick = onClearCustomer,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Clear Customer Filter",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }

        // Interactive KPI Cards Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            InteractiveStatCard(
                title = "Total",
                value = totalCount.toString(),
                color = Color(0xFF6366F1),
                isSelected = selectedStatusFilter == "ALL" && !showCompletionLogsOnly,
                onClick = {
                    showCompletionLogsOnly = false
                    selectedStatusFilter = "ALL"
                },
                modifier = Modifier.weight(1f)
            )
            InteractiveStatCard(
                title = "Completed",
                value = completedCount.toString(),
                color = Color(0xFF10B981),
                isSelected = selectedStatusFilter == "COMPLETED" || showCompletionLogsOnly,
                onClick = {
                    selectedStatusFilter = "COMPLETED"
                },
                modifier = Modifier.weight(1f)
            )
            InteractiveStatCard(
                title = "Pending",
                value = pendingCount.toString(),
                color = Color(0xFFF59E0B),
                isSelected = selectedStatusFilter == "PENDING" && !showCompletionLogsOnly,
                onClick = {
                    showCompletionLogsOnly = false
                    selectedStatusFilter = "PENDING"
                },
                modifier = Modifier.weight(1f)
            )
            InteractiveStatCard(
                title = "Overdue",
                value = overdueCount.toString(),
                color = Color(0xFFEF4444),
                isSelected = selectedStatusFilter == "OVERDUE" && !showCompletionLogsOnly,
                onClick = {
                    showCompletionLogsOnly = false
                    selectedStatusFilter = "OVERDUE"
                },
                modifier = Modifier.weight(1f)
            )
        }

        // Search Bar and Schedule Button Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Search visits by customer, tech...", fontSize = 13.sp) },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search", modifier = Modifier.size(18.dp))
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Button(
                onClick = { isCreateVisitOpen = true },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
                modifier = Modifier.height(56.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Schedule Visit", modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Schedule", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Month Selector Pills Row
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(MONTHS_NAMES.indices.toList()) { idx ->
                val name = MONTHS_NAMES[idx]
                val isSelected = selectedMonthIndex == idx
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedMonthIndex = idx },
                    label = { Text(name, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Color(0xFF6366F1).copy(alpha = 0.15f),
                        selectedLabelColor = Color(0xFF6366F1)
                    )
                )
            }
        }

        // Exact Date Filter and Logs Toggle Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                if (filterDate.isNotBlank()) {
                    Text(
                        text = "Date: $filterDate",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF6366F1)
                    )
                    IconButton(onClick = { filterDate = "" }, modifier = Modifier.size(20.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Clear Date", modifier = Modifier.size(14.dp))
                    }
                } else {
                    Text(
                        text = "All Dates",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable { showCompletionLogsOnly = !showCompletionLogsOnly }
            ) {
                Text(
                    text = "Logs Only",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium,
                    color = if (showCompletionLogsOnly) Color(0xFF10B981) else Color.Gray
                )
                Switch(
                    checked = showCompletionLogsOnly,
                    onCheckedChange = { showCompletionLogsOnly = it },
                    modifier = Modifier.padding(start = 6.dp)
                )
            }
        }

        // Error message if any
        if (errorMessage != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
            ) {
                Text(
                    text = errorMessage ?: "",
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(12.dp),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }

        // Visits Content
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF6366F1))
            }
        } else if (filteredVisits.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.CalendarToday,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = Color.Gray.copy(alpha = 0.4f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = if (showCompletionLogsOnly) "No completed AMC visit logs found." else "No matching AMC visits found.",
                        color = Color.Gray,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = {
                        selectedStatusFilter = "ALL"
                        selectedMonthIndex = 0
                        filterDate = ""
                        searchQuery = ""
                        showCompletionLogsOnly = false
                        viewModel.loadAmcVisits(customerId)
                    }) {
                        Text("Reset Filters")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredVisits, key = { it.id }) { visit ->
                    val isOverdue = isVisitOverdue(visit)
                    val assignedEmployee = employees.find { it.id.toString() == visit.assignedEmployeeId }

                    AmcVisitCardItem(
                        visit = visit,
                        assignedEmployee = assignedEmployee,
                        isOverdue = isOverdue,
                        onEdit = {
                            selectedVisitForAction = visit
                            actionType = "EDIT"
                        },
                        onMarkDone = {
                            selectedVisitForAction = visit
                            actionType = "MARK_DONE"
                        },
                        onViewPhotos = {
                            selectedVisitForAction = visit
                            actionType = "VIEW_PHOTOS"
                        },
                        onCallCustomer = {
                            val phone = visit.customer?.phoneNumber
                            if (!phone.isNullOrBlank()) {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                context.startActivity(intent)
                            } else {
                                Toast.makeText(context, "No phone number available", Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }
            }
        }
    }

    // Schedule New AMC Visit Dialog
    if (isCreateVisitOpen) {
        CreateAmcVisitDialog(
            customers = customers,
            employees = employees,
            initialCustomerId = customerId,
            onDismiss = { isCreateVisitOpen = false },
            onSave = { request ->
                viewModel.createAmcVisit(request) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "AMC Visit scheduled successfully", Toast.LENGTH_SHORT).show()
                        isCreateVisitOpen = false
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to schedule visit", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Reschedule / Edit Visit Dialog
    if (selectedVisitForAction != null && actionType == "EDIT") {
        EditAmcVisitDialog(
            visit = selectedVisitForAction!!,
            allVisits = amcVisits,
            employees = employees,
            onDismiss = {
                selectedVisitForAction = null
                actionType = null
            },
            onSave = { updateReq ->
                viewModel.updateAmcVisit(selectedVisitForAction!!.id, updateReq) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "Visit rescheduled successfully", Toast.LENGTH_SHORT).show()
                        selectedVisitForAction = null
                        actionType = null
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to update visit", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Mark Done Dialog
    if (selectedVisitForAction != null && actionType == "MARK_DONE") {
        MarkAmcVisitDoneDialog(
            visit = selectedVisitForAction!!,
            onDismiss = {
                selectedVisitForAction = null
                actionType = null
            },
            onSave = { notes, beforeBase64, afterBase64 ->
                viewModel.markAmcVisitDone(
                    visitId = selectedVisitForAction!!.id,
                    visitNotes = notes,
                    beforeImageUrl = beforeBase64,
                    afterImageUrl = afterBase64
                ) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "Visit marked as completed!", Toast.LENGTH_SHORT).show()
                        selectedVisitForAction = null
                        actionType = null
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to complete visit", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // View Proof Photos Dialog
    if (selectedVisitForAction != null && actionType == "VIEW_PHOTOS") {
        ViewAmcProofPhotosDialog(
            visit = selectedVisitForAction!!,
            employees = employees,
            onDismiss = {
                selectedVisitForAction = null
                actionType = null
            },
            onZoomImage = { url ->
                previewImageUrl = url
            }
        )
    }

    // Full Screen Lightbox Preview
    if (previewImageUrl != null) {
        FullScreenImageDialog(
            imageModel = previewImageUrl!!,
            onDismiss = { previewImageUrl = null }
        )
    }
}

@Composable
fun InteractiveStatCard(
    title: String,
    value: String,
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) color.copy(alpha = 0.1f) else Color.White
        ),
        border = BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) color else Color(0xFFE2E8F0)
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isSelected) 3.dp else 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = if (isSelected) color else Color.Gray,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                color = color
            )
        }
    }
}

@Composable
fun AmcVisitCardItem(
    visit: AmcVisit,
    assignedEmployee: Employee?,
    isOverdue: Boolean,
    onEdit: () -> Unit,
    onMarkDone: () -> Unit,
    onViewPhotos: () -> Unit,
    onCallCustomer: () -> Unit
) {
    val isCompleted = visit.status.equals("COMPLETED", ignoreCase = true)
    val statusBg = if (isCompleted) Color(0xFFD1FAE5) else if (isOverdue) Color(0xFFFFE4E6) else Color(0xFFFEF3C7)
    val statusTextColor = if (isCompleted) Color(0xFF065F46) else if (isOverdue) Color(0xFFE11D48) else Color(0xFF92400E)

    val hasPhotos = !visit.beforeImageUrl.isNullOrBlank() ||
            !visit.afterImageUrl.isNullOrBlank() ||
            (!visit.sitePhotos.isNullOrEmpty())

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(
            1.dp,
            if (isOverdue) Color(0xFFFDA4AF) else Color(0xFFE2E8F0)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Customer Name & Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isCompleted) Color(0xFF10B981).copy(alpha = 0.12f) else Color(0xFF6366F1).copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (visit.cleaningNumber != null) "#${visit.cleaningNumber}" else "📋",
                            fontWeight = FontWeight.Bold,
                            color = if (isCompleted) Color(0xFF10B981) else Color(0xFF6366F1),
                            fontSize = 13.sp
                        )
                    }

                    Column {
                        Text(
                            text = visit.customer?.fullName ?: "Customer #${visit.customerId}",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                            Text(
                                text = visit.customer?.city ?: "N/A",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray,
                                maxLines = 1
                            )
                        }
                    }
                }

                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = if (isOverdue) "OVERDUE" else visit.status.uppercase(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusTextColor
                    )
                }
            }

            Divider(modifier = Modifier.padding(vertical = 10.dp), color = Color(0xFFF1F5F9))

            // Details Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Scheduled Date", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        text = visit.scheduledDate.take(10),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Column {
                    Text("Time Slot", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        text = visit.timeSlot ?: "09:00 AM",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                Column {
                    Text("Assigned To", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        text = assignedEmployee?.fullName ?: "Unassigned",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = if (assignedEmployee != null) Color(0xFF059669) else Color.Gray,
                        maxLines = 1
                    )
                }
            }

            // Completed metadata
            if (isCompleted) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = Color(0xFFF8FAFC),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text(
                            text = "Completed by: ${visit.completedByName ?: assignedEmployee?.fullName ?: "Technician"} on ${visit.completedAt?.take(10) ?: visit.scheduledDate.take(10)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF334155),
                            fontWeight = FontWeight.Medium
                        )
                        if (!visit.visitNotes.isNullOrBlank() || !visit.notes.isNullOrBlank()) {
                            val notes = visit.visitNotes ?: visit.notes ?: ""
                            Text(
                                text = "\"$notes\"",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.DarkGray,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Call Button
                IconButton(
                    onClick = onCallCustomer,
                    modifier = Modifier
                        .size(34.dp)
                        .background(Color(0xFFF1F5F9), CircleShape)
                ) {
                    Icon(
                        Icons.Default.Phone,
                        contentDescription = "Call Customer",
                        modifier = Modifier.size(16.dp),
                        tint = Color(0xFF0284C7)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!isCompleted) {
                        OutlinedButton(
                            onClick = onEdit,
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Icon(Icons.Default.EditCalendar, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Reschedule", fontSize = 12.sp)
                        }

                        Button(
                            onClick = onMarkDone,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Mark Done", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        if (hasPhotos) {
                            Button(
                                onClick = onViewPhotos,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(34.dp)
                            ) {
                                Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("View Proof", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

// Dialog: Schedule New AMC Visit
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateAmcVisitDialog(
    customers: List<Customer>,
    employees: List<Employee>,
    initialCustomerId: Int?,
    onDismiss: () -> Unit,
    onSave: (CreateAmcVisitRequest) -> Unit
) {
    var selectedCustomerId by remember {
        mutableStateOf(initialCustomerId ?: customers.firstOrNull()?.id ?: 0)
    }
    var scheduledDate by remember {
        mutableStateOf(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
    }
    var timeSlot by remember { mutableStateOf("09:00 AM") }
    var selectedEmployeeId by remember { mutableStateOf<String?>(null) }
    var notes by remember { mutableStateOf("") }

    val selectedCustomer = customers.find { it.id == selectedCustomerId }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Schedule AMC Visit", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                // Customer Selector
                Text("Select Customer", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                AmcDropdown(
                    selectedOption = selectedCustomer?.fullName ?: "Select Customer",
                    options = customers.map { it.fullName ?: "Customer #${it.id}" },
                    onOptionSelected = { name ->
                        customers.find { it.fullName == name }?.let {
                            selectedCustomerId = it.id ?: 0
                        }
                    },
                    label = "Customer"
                )

                // Date
                SwayogTextField(
                    value = scheduledDate,
                    onValueChange = { scheduledDate = it },
                    label = "Scheduled Date (YYYY-MM-DD)",
                    placeholder = "2026-09-15",
                    modifier = Modifier.fillMaxWidth()
                )

                // Time Slot Dropdown
                AmcDropdown(
                    selectedOption = timeSlot,
                    options = TIME_SLOTS,
                    onOptionSelected = { timeSlot = it },
                    label = "Time Slot"
                )

                // Assigned Technician
                val employeeOptions = listOf("Unassigned") + employees.map { it.fullName }
                val selectedEmployeeName = employees.find { it.id.toString() == selectedEmployeeId }?.fullName ?: "Unassigned"

                AmcDropdown(
                    selectedOption = selectedEmployeeName,
                    options = employeeOptions,
                    onOptionSelected = { name ->
                        selectedEmployeeId = if (name == "Unassigned") null else employees.find { it.fullName == name }?.id?.toString()
                    },
                    label = "Assigned Technician"
                )

                // Notes
                SwayogTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = "Visit Notes / Instructions (Optional)",
                    placeholder = "e.g. Regular monthly cleaning",
                    modifier = Modifier.fillMaxWidth()
                )

                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            if (selectedCustomerId == 0) return@Button
                            onSave(
                                CreateAmcVisitRequest(
                                    customerId = selectedCustomerId,
                                    scheduledDate = scheduledDate,
                                    timeSlot = timeSlot,
                                    assignedEmployeeId = selectedEmployeeId,
                                    notes = notes.ifBlank { null }
                                )
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Schedule")
                    }
                }
            }
        }
    }
}

// Dialog: Reschedule AMC Visit with Excess Cleanings Limit Warning
@Composable
fun EditAmcVisitDialog(
    visit: AmcVisit,
    allVisits: List<AmcVisit>,
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onSave: (UpdateAmcVisitRequest) -> Unit
) {
    var scheduledDate by remember { mutableStateOf(visit.scheduledDate.take(10)) }
    var timeSlot by remember { mutableStateOf(visit.timeSlot ?: "09:00 AM") }
    var selectedEmployeeId by remember { mutableStateOf(visit.assignedEmployeeId) }
    var showExcessWarning by remember { mutableStateOf(false) }

    fun checkExcessAndProceed() {
        try {
            val targetDate = LocalDate.parse(scheduledDate.take(10))
            val targetMonth = targetDate.monthValue
            val targetYear = targetDate.year
            val visitsInMonth = allVisits.count { v ->
                v.id != visit.id &&
                v.customerId == visit.customerId &&
                try {
                    val d = LocalDate.parse(v.scheduledDate.take(10))
                    d.monthValue == targetMonth && d.year == targetYear
                } catch (_: Exception) {
                    false
                }
            }
            // If customer has a limit and this exceeds it
            if (visitsInMonth >= 2) {
                showExcessWarning = true
                return
            }
        } catch (_: Exception) {}

        onSave(
            UpdateAmcVisitRequest(
                scheduledDate = scheduledDate,
                timeSlot = timeSlot,
                assignedEmployeeId = selectedEmployeeId
            )
        )
    }

    if (showExcessWarning) {
        AlertDialog(
            onDismissRequest = { showExcessWarning = false },
            icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFF59E0B)) },
            title = { Text("Excess Cleanings Limit Reached") },
            text = {
                Text("This customer is allotted regular monthly cleanings. The customer already has scheduled or completed cleaning visits for this month. Do you want to schedule an additional visit?")
            },
            confirmButton = {
                Button(
                    onClick = {
                        showExcessWarning = false
                        onSave(
                            UpdateAmcVisitRequest(
                                scheduledDate = scheduledDate,
                                timeSlot = timeSlot,
                                assignedEmployeeId = selectedEmployeeId
                            )
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                ) {
                    Text("Continue & Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showExcessWarning = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Reschedule Visit", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text(
                            text = visit.customer?.fullName ?: "Customer #${visit.customerId}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                SwayogTextField(
                    value = scheduledDate,
                    onValueChange = { scheduledDate = it },
                    label = "New Scheduled Date (YYYY-MM-DD)",
                    placeholder = "2026-09-20",
                    modifier = Modifier.fillMaxWidth()
                )

                AmcDropdown(
                    selectedOption = timeSlot,
                    options = TIME_SLOTS,
                    onOptionSelected = { timeSlot = it },
                    label = "Visit Time Slot"
                )

                val employeeOptions = listOf("Unassigned") + employees.map { it.fullName }
                val selectedEmployeeName = employees.find { it.id.toString() == selectedEmployeeId }?.fullName ?: "Unassigned"

                AmcDropdown(
                    selectedOption = selectedEmployeeName,
                    options = employeeOptions,
                    onOptionSelected = { name ->
                        selectedEmployeeId = if (name == "Unassigned") null else employees.find { it.fullName == name }?.id?.toString()
                    },
                    label = "Assigned Technician"
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = { checkExcessAndProceed() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Confirm")
                    }
                }
            }
        }
    }
}

// Dialog: Mark AMC Visit Complete with Proof Photos
@Composable
fun MarkAmcVisitDoneDialog(
    visit: AmcVisit,
    onDismiss: () -> Unit,
    onSave: (notes: String?, beforeBase64: String?, afterBase64: String?) -> Unit
) {
    val context = LocalContext.current
    var notes by remember { mutableStateOf("") }
    var beforeImageUri by remember { mutableStateOf<Uri?>(null) }
    var afterImageUri by remember { mutableStateOf<Uri?>(null) }
    var isProcessing by remember { mutableStateOf(false) }

    val beforePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? -> beforeImageUri = uri }

    val afterPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? -> afterImageUri = uri }

    fun submitCompletion() {
        isProcessing = true
        var beforeBase64: String? = null
        var afterBase64: String? = null

        beforeImageUri?.let { uri ->
            beforeBase64 = uriToBase64(context, uri)
        }
        afterImageUri?.let { uri ->
            afterBase64 = uriToBase64(context, uri)
        }

        onSave(notes.ifBlank { null }, beforeBase64, afterBase64)
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                            Text("Complete AMC Visit", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            text = "Visit #${visit.cleaningNumber ?: 1} - ${visit.customer?.fullName ?: "Customer"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                Text("Proof Photos (Mandatory)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(
                    text = "Upload before and after cleaning site photos for customer verification.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                // Before and After Photo Pickers
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Before Image Box
                    ProofPhotoPickerBox(
                        title = "Before Cleaning",
                        imageUri = beforeImageUri,
                        onSelectClick = { beforePickerLauncher.launch("image/*") },
                        onRemoveClick = { beforeImageUri = null },
                        modifier = Modifier.weight(1f)
                    )

                    // After Image Box
                    ProofPhotoPickerBox(
                        title = "After Cleaning",
                        imageUri = afterImageUri,
                        onSelectClick = { afterPickerLauncher.launch("image/*") },
                        onRemoveClick = { afterImageUri = null },
                        modifier = Modifier.weight(1f)
                    )
                }

                // Completion Notes
                SwayogTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = "Completion Remarks / Observation",
                    placeholder = "e.g. Panels cleaned with RO water, no dust spots remaining.",
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        enabled = !isProcessing
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = { submitCompletion() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        modifier = Modifier.weight(1f),
                        enabled = !isProcessing
                    ) {
                        if (isProcessing) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Submit & Log", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProofPhotoPickerBox(
    title: String,
    imageUri: Uri?,
    onSelectClick: () -> Unit,
    onRemoveClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(130.dp)
            .clickable(enabled = imageUri == null) { onSelectClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, if (imageUri != null) Color(0xFF10B981) else Color(0xFFCBD5E1))
    ) {
        if (imageUri != null) {
            Box(modifier = Modifier.fillMaxSize()) {
                AsyncImage(
                    model = imageUri,
                    contentDescription = title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                IconButton(
                    onClick = onRemoveClick,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(4.dp)
                        .size(24.dp)
                        .background(Color.Black.copy(alpha = 0.6f), CircleShape)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.White, modifier = Modifier.size(14.dp))
                }
                Surface(
                    color = Color.Black.copy(alpha = 0.6f),
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                ) {
                    Text(
                        text = title,
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        maxLines = 1
                    )
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    Icons.Default.CameraAlt,
                    contentDescription = "Upload",
                    tint = Color(0xFF6366F1),
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF334155)
                )
                Text(
                    text = "Tap to upload",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray,
                    fontSize = 10.sp
                )
            }
        }
    }
}

// Dialog: View Proof Photos & Details
@Composable
fun ViewAmcProofPhotosDialog(
    visit: AmcVisit,
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onZoomImage: (String) -> Unit
) {
    val assignedEmployee = employees.find { it.id.toString() == visit.assignedEmployeeId }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("AMC Visit Proof", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text(
                            text = "Visit #${visit.cleaningNumber ?: 1} - ${visit.customer?.fullName ?: "Customer"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                // Metadata Card
                Surface(
                    color = Color(0xFFF8FAFC),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text("Completed By:", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text(
                                text = visit.completedByName ?: assignedEmployee?.fullName ?: "Technician",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text("Completed At:", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text(
                                text = visit.completedAt ?: visit.scheduledDate,
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        if (!visit.visitNotes.isNullOrBlank() || !visit.notes.isNullOrBlank()) {
                            val notes = visit.visitNotes ?: visit.notes ?: ""
                            Text("Remarks:", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text(
                                text = "\"$notes\"",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF1E293B)
                            )
                        }
                    }
                }

                Text("Before & After Photos (Tap to Zoom)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Before Photo
                    val beforeUrl = visit.beforeImageUrl ?: visit.sitePhotos?.getOrNull(0)
                    ProofImageViewerBox(
                        title = "Before Work",
                        imageUrl = beforeUrl,
                        onClick = { beforeUrl?.let { onZoomImage(it) } },
                        modifier = Modifier.weight(1f)
                    )

                    // After Photo
                    val afterUrl = visit.afterImageUrl ?: visit.sitePhotos?.getOrNull(1)
                    ProofImageViewerBox(
                        title = "After Work",
                        imageUrl = afterUrl,
                        onClick = { afterUrl?.let { onZoomImage(it) } },
                        modifier = Modifier.weight(1f)
                    )
                }

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                ) {
                    Text("Close")
                }
            }
        }
    }
}

@Composable
fun ProofImageViewerBox(
    title: String,
    imageUrl: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(130.dp)
            .clickable(enabled = !imageUrl.isNullOrBlank()) { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9))
    ) {
        if (!imageUrl.isNullOrBlank()) {
            Box(modifier = Modifier.fillMaxSize()) {
                AsyncImage(
                    model = ImageUtils.resolveImageModel(LocalContext.current, imageUrl),
                    contentDescription = title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Surface(
                    color = Color.Black.copy(alpha = 0.6f),
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                ) {
                    Text(
                        text = "$title 🔍",
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
        } else {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = "No $title",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
        }
    }
}

// Convert Uri to Base64 data string
fun uriToBase64(context: Context, uri: Uri): String? {
    return try {
        val inputStream = context.contentResolver.openInputStream(uri) ?: return null
        val bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 70, outputStream)
        "data:image/jpeg;base64," + Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
    } catch (_: Exception) {
        null
    }
}
