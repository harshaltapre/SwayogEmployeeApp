package com.swayog.employee.presentation.subadmin

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.swayog.employee.data.model.Employee
import com.swayog.employee.presentation.common.components.BeforeAfterImageSection

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcVisitDetailsModal(
    event: CalendarEvent,
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onLogCompletion: (visitId: String, notes: String, beforeImage: Uri?, afterImage: Uri?) -> Unit,
    isLoading: Boolean
) {
    val assignedEmployee = remember(event, employees) {
        employees.find { it.id.toString() == event.assignedEmployeeId }
    }

    var notes by remember { mutableStateOf("") }
    var beforeImageUri by remember { mutableStateOf<Uri?>(null) }
    var afterImageUri by remember { mutableStateOf<Uri?>(null) }

    val beforeImageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? -> beforeImageUri = uri }

    val afterImageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? -> afterImageUri = uri }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "AMC Visit Details",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Surface(
                        color = if (event.status == "COMPLETED") Color(0xFFD1FAE5) else Color(0xFFFEF3C7),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = event.status ?: "PENDING",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (event.status == "COMPLETED") Color(0xFF10B981) else Color(0xFFF59E0B)
                        )
                    }
                }

                Divider()

                // Read-only Details
                AmcVisitDetailRow("Customer", event.title)
                AmcVisitDetailRow("Address", event.address)
                AmcVisitDetailRow("Schedule", "${event.date} at ${event.time ?: "Any time"}")
                AmcVisitDetailRow("Assigned To", assignedEmployee?.fullName ?: "Unassigned")
                AmcVisitDetailRow("Notes", event.description)

                if (event.status != "COMPLETED") {
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text(
                        text = "Log Visit Completion",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Completion Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ImagePickerCard(
                            title = "Before Photo",
                            uri = beforeImageUri,
                            onClick = { beforeImageLauncher.launch("image/*") },
                            modifier = Modifier.weight(1f)
                        )
                        ImagePickerCard(
                            title = "After Photo",
                            uri = afterImageUri,
                            onClick = { afterImageLauncher.launch("image/*") },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

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
                            onClick = { onLogCompletion(event.rawId, notes, beforeImageUri, afterImageUri) },
                            enabled = !isLoading
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                            } else {
                                Text("Mark Completed")
                            }
                        }
                    }
                } else {
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text(
                        text = "Completion Details",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (!event.visitNotes.isNullOrEmpty()) {
                        AmcVisitDetailRow("Notes", event.visitNotes)
                    }

                    if (event.completedByEmployeeId != null) {
                        val completedByEmployee = employees.find { it.id.toString() == event.completedByEmployeeId }
                        AmcVisitDetailRow("Completed By", completedByEmployee?.fullName ?: "Unknown")
                    }
                    if (event.completedAt != null) {
                        AmcVisitDetailRow("Completed At", event.completedAt)
                    }

                    BeforeAfterImageSection(
                        beforeImageUrl = event.beforeImageUrl,
                        afterImageUrl = event.afterImageUrl
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = onDismiss) {
                            Text("Close")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AmcVisitDetailRow(label: String, value: String) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, style = MaterialTheme.typography.labelMedium, color = Color.Gray)
        Text(text = value, style = MaterialTheme.typography.bodyMedium)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ImagePickerCard(
    title: String,
    uri: Uri?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(100.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            if (uri != null) {
                AsyncImage(
                    model = uri,
                    contentDescription = title,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
