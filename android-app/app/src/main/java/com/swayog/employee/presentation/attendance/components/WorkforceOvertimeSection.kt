package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.layout.*
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
import com.swayog.employee.data.model.OvertimeRequestDto
import com.swayog.employee.data.model.OvertimeSessionDto
import com.swayog.employee.data.model.OvertimeSummaryResponse
import com.swayog.employee.data.model.SubmitOvertimeRequest

@Composable
fun WorkforceOvertimeSection(
    overtimeSummary: OvertimeSummaryResponse?,
    overtimeHistory: List<OvertimeRequestDto>,
    activeSession: OvertimeSessionDto?,
    liveDurationText: String,
    onRequestOvertimeClick: () -> Unit,
    onStartSessionClick: () -> Unit,
    onStopSessionClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isSessionActive = activeSession != null && activeSession.status == "ACTIVE"

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
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Overtime Management",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Policy Eligible & Approved Overtime",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = onRequestOvertimeClick,
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Request OT", fontSize = 12.sp)
                }
            }

            // Live Overtime Session Card
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = if (isSessionActive) Color(0xFFFFF3E0) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (isSessionActive) Icons.Default.Timelapse else Icons.Default.Schedule,
                                contentDescription = null,
                                tint = if (isSessionActive) Color(0xFFE65100) else MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = if (isSessionActive) "Live Overtime Session" else "Overtime Session",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Supports midnight-crossing sessions safely",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        if (isSessionActive) {
                            Text(
                                text = liveDurationText,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFD84315)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (isSessionActive) {
                        Button(
                            onClick = onStopSessionClick,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD84315)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Stop OT Session")
                        }
                    } else {
                        OutlinedButton(
                            onClick = onStartSessionClick,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Start Live OT Session")
                        }
                    }
                }
            }

            // Summary Metrics Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFE8F5E9),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Approved OT", fontSize = 11.sp, color = Color(0xFF2E7D32))
                        Text(
                            text = "${overtimeSummary?.approvedOvertimeHours ?: 0.0}h",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1B5E20)
                        )
                        Text("Payable", fontSize = 10.sp, color = Color(0xFF388E3C))
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFFFF8E1),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        val pendingCount = overtimeHistory.count { it.status == "PENDING" }
                        Text("Pending Review", fontSize = 11.sp, color = Color(0xFFF57F17))
                        Text(
                            text = "$pendingCount",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFE65100)
                        )
                        Text("Requests", fontSize = 10.sp, color = Color(0xFFF57F17))
                    }
                }
            }

            // OT History
            Text(
                text = "Recent Overtime Requests",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (overtimeHistory.isEmpty()) {
                Text(
                    text = "No overtime requests found.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 6.dp)
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    overtimeHistory.take(5).forEach { ot ->
                        OvertimeHistoryItem(ot)
                    }
                }
            }
        }
    }
}

@Composable
private fun OvertimeHistoryItem(ot: OvertimeRequestDto) {
    val statusColor = when (ot.status) {
        "APPROVED" -> Color(0xFF2E7D32)
        "REJECTED" -> Color(0xFFC62828)
        else -> Color(0xFFEF6C00)
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
                Text(
                    text = "${ot.overtimeType.replace("_", " ")} OT",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${ot.date} • ${ot.durationMinutes / 60}h ${ot.durationMinutes % 60}m (Multiplier ${ot.rateMultiplier}x)",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (ot.reason.isNotBlank()) {
                    Text(
                        text = ot.reason,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                        maxLines = 1
                    )
                }
                if (!ot.reviewerNotes.isNullOrBlank()) {
                    Text(
                        text = "Admin: ${ot.reviewerNotes}",
                        fontSize = 10.sp,
                        color = Color(0xFF1565C0)
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = statusColor.copy(alpha = 0.12f)
            ) {
                Text(
                    text = ot.status,
                    color = statusColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// ── Request Overtime Dialog ────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestOvertimeDialog(
    initialDate: String? = null,
    onDismiss: () -> Unit,
    onSubmit: (SubmitOvertimeRequest) -> Unit
) {
    var date by remember { mutableStateOf(initialDate ?: java.time.LocalDate.now().toString()) }
    var otType by remember { mutableStateOf("AFTER_SHIFT") }
    var startTime by remember { mutableStateOf("18:00") }
    var durationHours by remember { mutableStateOf("2") }
    var reason by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    val types = listOf("AFTER_SHIFT", "SUNDAY", "WEEKLY_OFF", "HOLIDAY", "NIGHT")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Overtime", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // OT Type Chips
                Text("Overtime Type", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    types.take(3).forEach { t ->
                        FilterChip(
                            selected = otType == t,
                            onClick = { otType = t },
                            label = { Text(t.replace("_", " "), fontSize = 10.sp) }
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    types.drop(3).forEach { t ->
                        FilterChip(
                            selected = otType == t,
                            onClick = { otType = t },
                            label = { Text(t.replace("_", " "), fontSize = 10.sp) }
                        )
                    }
                }

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
                        value = startTime,
                        onValueChange = { startTime = it },
                        label = { Text("Start Time") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = durationHours,
                        onValueChange = { durationHours = it },
                        label = { Text("Duration (Hours)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason for Overtime") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val durationMins = (durationHours.toDoubleOrNull() ?: 1.0) * 60
                    if (reason.isNotBlank()) {
                        isSubmitting = true
                        onSubmit(
                            SubmitOvertimeRequest(
                                date = date.trim(),
                                overtimeType = otType,
                                startTime = startTime.trim(),
                                durationMinutes = durationMins.toInt(),
                                reason = reason.trim()
                            )
                        )
                        onDismiss()
                    }
                },
                enabled = reason.isNotBlank() && !isSubmitting
            ) {
                Text("Submit OT Request")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
