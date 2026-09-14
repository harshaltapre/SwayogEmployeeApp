package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.LeaveBalanceResponse
import com.swayog.employee.data.model.LeaveRequestDto
import com.swayog.employee.data.model.SubmitLeaveRequest

@Composable
fun WorkforceLeaveSection(
    leaveBalance: LeaveBalanceResponse?,
    leaveHistory: List<LeaveRequestDto>,
    onRequestLeaveClick: () -> Unit,
    modifier: Modifier = Modifier
) {
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
            // Header with Request Leave Action
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Leave Management",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Company Allowance & Concession",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = onRequestLeaveClick,
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Request Leave", fontSize = 12.sp)
                }
            }

            // Balance Summary Metrics
            val balance = leaveBalance ?: LeaveBalanceResponse()
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BalanceMetricBox(label = "Allowance", count = "${balance.annualAllowance.toInt()}", sub = "Annual", color = Color(0xFF1565C0), modifier = Modifier.weight(1f))
                BalanceMetricBox(label = "Used", count = "${balance.used}", sub = "Approved", color = Color(0xFFC62828), modifier = Modifier.weight(1f))
                BalanceMetricBox(label = "Pending", count = "${balance.pending}", sub = "Awaiting", color = Color(0xFFEF6C00), modifier = Modifier.weight(1f))
                BalanceMetricBox(label = "Remaining", count = "${balance.remaining}", sub = "Available", color = Color(0xFF2E7D32), modifier = Modifier.weight(1f))
            }

            // Leave History
            Text(
                text = "Recent Leave Requests",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (leaveHistory.isEmpty()) {
                Text(
                    text = "No leave requests submitted yet.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    leaveHistory.take(5).forEach { req ->
                        LeaveHistoryItem(req)
                    }
                }
            }
        }
    }
}

@Composable
private fun BalanceMetricBox(
    label: String,
    count: String,
    sub: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.08f)
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, fontSize = 10.sp, color = color, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = count, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
            Text(text = sub, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun LeaveHistoryItem(req: LeaveRequestDto) {
    val statusColor = when (req.status) {
        "APPROVED" -> Color(0xFF2E7D32)
        "REJECTED" -> Color(0xFFC62828)
        "CANCELLED" -> Color(0xFF757575)
        else -> Color(0xFFEF6C00) // PENDING
    }

    Surface(
        shape = RoundedCornerShape(10.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
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
                    Text(
                        text = "${req.leaveType} Leave",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (req.isHalfDay) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFFFFF3E0)) {
                            Text(
                                text = "Half Day",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE65100),
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = if (req.startDate == req.endDate) req.startDate else "${req.startDate} to ${req.endDate}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (req.reason.isNotBlank()) {
                    Text(
                        text = req.reason,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                        maxLines = 1
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = statusColor.copy(alpha = 0.12f)
            ) {
                Text(
                    text = req.status,
                    color = statusColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// ── Request Leave Dialog ───────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestLeaveDialog(
    onDismiss: () -> Unit,
    onSubmit: (SubmitLeaveRequest) -> Unit
) {
    var leaveType by remember { mutableStateOf("PAID") }
    var startDate by remember { mutableStateOf(java.time.LocalDate.now().toString()) }
    var endDate by remember { mutableStateOf(java.time.LocalDate.now().toString()) }
    var isHalfDay by remember { mutableStateOf(false) }
    var halfDayPeriod by remember { mutableStateOf("FIRST_HALF") }
    var reason by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    val leaveTypes = listOf("PAID", "UNPAID", "SICK", "CASUAL", "EMERGENCY")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Leave", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Leave Type Selection
                Text("Leave Type", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    leaveTypes.take(3).forEach { type ->
                        FilterChip(
                            selected = leaveType == type,
                            onClick = { leaveType = type },
                            label = { Text(type, fontSize = 11.sp) }
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    leaveTypes.drop(3).forEach { type ->
                        FilterChip(
                            selected = leaveType == type,
                            onClick = { leaveType = type },
                            label = { Text(type, fontSize = 11.sp) }
                        )
                    }
                }

                // Dates
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Start Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("End Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Half day option
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(checked = isHalfDay, onCheckedChange = { isHalfDay = it })
                    Text("Half Day Leave", fontSize = 13.sp)
                }

                // Reason
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason for Leave") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (reason.isNotBlank()) {
                        isSubmitting = true
                        onSubmit(
                            SubmitLeaveRequest(
                                leaveType = leaveType,
                                startDate = startDate.trim(),
                                endDate = endDate.trim(),
                                isHalfDay = isHalfDay,
                                halfDayPeriod = if (isHalfDay) halfDayPeriod else null,
                                reason = reason.trim()
                            )
                        )
                        onDismiss()
                    }
                },
                enabled = reason.isNotBlank() && !isSubmitting
            ) {
                Text("Submit Request")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
