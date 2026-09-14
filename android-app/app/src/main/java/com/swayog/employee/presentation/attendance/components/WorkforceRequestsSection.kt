package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.SubmitAttendanceCorrectionRequest
import com.swayog.employee.data.model.UnifiedRequestDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkforceRequestsSection(
    requests: List<UnifiedRequestDto>,
    onRequestCorrectionClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("ALL") }
    val filters = listOf("ALL", "LEAVE", "OVERTIME", "CORRECTION", "ADVANCE")

    val filtered = remember(requests, selectedFilter) {
        if (selectedFilter == "ALL") requests else requests.filter { it.type == selectedFilter }
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header with Request Correction shortcut
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Unified Requests Center",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Leave, Overtime, Correction & Advance",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                OutlinedButton(
                    onClick = onRequestCorrectionClick,
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(15.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Correction", fontSize = 11.sp)
                }
            }

            // Filter Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                filters.forEach { f ->
                    FilterChip(
                        selected = selectedFilter == f,
                        onClick = { selectedFilter = f },
                        label = { Text(f, fontSize = 10.sp) }
                    )
                }
            }

            // Request Items
            if (filtered.isEmpty()) {
                Text(
                    text = "No requests found for this category.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    filtered.forEach { req ->
                        UnifiedRequestItemView(req)
                    }
                }
            }
        }
    }
}

@Composable
private fun UnifiedRequestItemView(req: UnifiedRequestDto) {
    val statusColor = when (req.status) {
        "APPROVED", "PAID", "FULLY_RECOVERED" -> Color(0xFF2E7D32)
        "REJECTED" -> Color(0xFFC62828)
        "CANCELLED" -> Color(0xFF757575)
        else -> Color(0xFFEF6C00) // PENDING
    }

    val typeColor = when (req.type) {
        "LEAVE" -> Color(0xFF7B1FA2)
        "OVERTIME" -> Color(0xFFE65100)
        "ADVANCE" -> Color(0xFF1565C0)
        else -> Color(0xFF00897B) // CORRECTION
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = typeColor.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = req.type,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = typeColor,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = req.title,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Date: ${req.date} • Submitted: ${req.submittedAt.take(10)}",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (req.details.isNotBlank()) {
                    Text(
                        text = req.details,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (req.reason.isNotBlank()) {
                    Text(
                        text = "Reason: ${req.reason}",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }
                if (!req.adminResponse.isNullOrBlank()) {
                    Text(
                        text = "Admin: ${req.adminResponse}",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF1565C0)
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = statusColor.copy(alpha = 0.12f)
            ) {
                Text(
                    text = req.status.replace("_", " "),
                    color = statusColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// ── Attendance Correction Dialog ───────────────────────────────────────────

@Composable
fun AttendanceCorrectionDialog(
    initialDate: String? = null,
    onDismiss: () -> Unit,
    onSubmit: (SubmitAttendanceCorrectionRequest) -> Unit
) {
    var date by remember { mutableStateOf(initialDate ?: java.time.LocalDate.now().toString()) }
    var requestedCheckIn by remember { mutableStateOf("09:15") }
    var requestedCheckOut by remember { mutableStateOf("18:15") }
    var reason by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Attendance Correction", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Request a correction for missed check-in/out or incorrect status. Cannot directly overwrite historical data.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = requestedCheckIn,
                        onValueChange = { requestedCheckIn = it },
                        label = { Text("Requested In") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = requestedCheckOut,
                        onValueChange = { requestedCheckOut = it },
                        label = { Text("Requested Out") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason for Correction") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (reason.length >= 5) {
                        isSubmitting = true
                        onSubmit(
                            SubmitAttendanceCorrectionRequest(
                                date = date.trim(),
                                requestedCheckIn = requestedCheckIn.trim().ifBlank { null },
                                requestedCheckOut = requestedCheckOut.trim().ifBlank { null },
                                reason = reason.trim()
                            )
                        )
                        onDismiss()
                    }
                },
                enabled = reason.length >= 5 && !isSubmitting
            ) {
                Text("Submit Correction")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
