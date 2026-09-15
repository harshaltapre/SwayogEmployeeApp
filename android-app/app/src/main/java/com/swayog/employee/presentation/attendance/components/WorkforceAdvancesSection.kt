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
import com.swayog.employee.data.model.AdvanceRecordDto
import com.swayog.employee.data.model.AdvanceSummaryDto

@Composable
fun WorkforceAdvancesSection(
    advances: AdvanceSummaryDto?,
    onRequestAdvanceClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val data = advances ?: AdvanceSummaryDto()

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
                        text = "Salary Advances",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Disbursed & Active Recoveries",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = onRequestAdvanceClick,
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Request Advance", fontSize = 12.sp)
                }
            }

            // Summary Metrics
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AdvanceMetricBox(label = "Total Received", amount = "₹${formatCurrency(data.totalReceived)}", color = Color(0xFF1565C0), modifier = Modifier.weight(1f))
                AdvanceMetricBox(label = "Recovered", amount = "₹${formatCurrency(data.totalRecovered)}", color = Color(0xFF2E7D32), modifier = Modifier.weight(1f))
                AdvanceMetricBox(label = "Remaining", amount = "₹${formatCurrency(data.remainingAdvance)}", color = Color(0xFFC62828), modifier = Modifier.weight(1f))
                AdvanceMetricBox(label = "Monthly", amount = "₹${formatCurrency(data.currentMonthDeduction)}", color = Color(0xFFE65100), modifier = Modifier.weight(1f))
            }

            // Advance Records History
            if (data.records.isNotEmpty()) {
                Text(
                    text = "Advance History",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    data.records.forEach { adv ->
                        AdvanceItemView(adv)
                    }
                }
            }
        }
    }
}

@Composable
private fun AdvanceMetricBox(
    label: String,
    amount: String,
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
            Text(text = amount, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
private fun AdvanceItemView(adv: AdvanceRecordDto) {
    val statusColor = when (adv.status) {
        "FULLY_RECOVERED" -> Color(0xFF2E7D32)
        "PAID", "PARTIALLY_RECOVERED" -> Color(0xFF1565C0)
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
                    text = "₹${formatCurrency(adv.amount)}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Requested: ${adv.requestedDate} • Deduction: ₹${formatCurrency(adv.monthlyDeduction)}/mo",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (adv.reason.isNotBlank()) {
                    Text(
                        text = adv.reason,
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
                    text = adv.status.replace("_", " "),
                    color = statusColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// ── Request Advance Dialog ─────────────────────────────────────────────────

@Composable
fun RequestAdvanceDialog(
    onDismiss: () -> Unit,
    onSubmit: (Double, String) -> Unit
) {
    var amountText by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Salary Advance", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Amount (₹)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason for Advance") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: 0.0
                    if (amount > 0 && reason.isNotBlank()) {
                        isSubmitting = true
                        onSubmit(amount, reason.trim())
                        onDismiss()
                    }
                },
                enabled = (amountText.toDoubleOrNull() ?: 0.0) > 0 && reason.isNotBlank() && !isSubmitting
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

private fun formatCurrency(amount: Double): String {
    return String.format(java.util.Locale.getDefault(), "%,.0f", amount)
}
