package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OtherPositionDashboard(viewModel: MainViewModel) {
    val session by viewModel.session.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val commits by viewModel.commits.collectAsState()
    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val activeTasks = tasks.filter { it.status != "completed" }
    val completedTasks = tasks.filter { it.status == "completed" }

    var showSubmitDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Profile Info Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = EngineeringBlue,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = session?.name ?: "Employee",
                        style = Typography.titleLarge,
                        color = NeutralText,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${session?.jobRole ?: "Other Position"} • ${session?.employeeCode ?: "—"}",
                        style = Typography.bodyMedium,
                        color = MutedText
                    )
                }
                // Attendance status badge
                val isCheckedIn = todayAttendance?.checkInTime != null && todayAttendance?.checkOutTime == null
                AssistChip(
                    onClick = {},
                    label = { Text(if (isCheckedIn) "Active" else "Offline", fontSize = 10.sp) },
                    leadingIcon = {
                        Icon(
                            imageVector = if (isCheckedIn) Icons.Default.Circle else Icons.Default.RadioButtonUnchecked,
                            contentDescription = null,
                            tint = if (isCheckedIn) SuccessGreen else MutedText,
                            modifier = Modifier.size(10.dp)
                        )
                    },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = if (isCheckedIn) SuccessGreen.copy(alpha = 0.1f) else MutedText.copy(alpha = 0.1f)
                    )
                )
            }
        }

        // Quick Stats Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OtherPosStatCard("Assigned", activeTasks.size.toString(), Icons.Default.Assignment, EngineeringBlue, Modifier.weight(1f))
            OtherPosStatCard("Completed", completedTasks.size.toString(), Icons.Default.CheckCircle, SuccessGreen, Modifier.weight(1f))
            OtherPosStatCard("Commits", commits.size.toString(), Icons.Default.NoteAlt, PrimaryAmber, Modifier.weight(1f))
        }

        // Task List
        Text(
            text = "ASSIGNED TASKS",
            style = Typography.titleMedium,
            color = NeutralText,
            fontWeight = FontWeight.Bold
        )

        if (activeTasks.isEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.TaskAlt,
                        contentDescription = null,
                        tint = MutedText,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No active tasks assigned",
                        style = Typography.bodyLarge,
                        color = MutedText,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Contact your supervisor for task assignments",
                        style = Typography.bodyMedium,
                        color = MutedText.copy(alpha = 0.7f),
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            activeTasks.forEach { task ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = task.description,
                                    style = Typography.bodyLarge,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${task.jobType} • ${task.customerName}",
                                    style = Typography.bodyMedium,
                                    color = MutedText
                                )
                            }
                            AssistChip(
                                onClick = {},
                                label = { Text(task.status.replaceFirstChar { it.uppercase() }, fontSize = 10.sp) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = when (task.status) {
                                        "assigned" -> EngineeringBlue.copy(alpha = 0.15f)
                                        "in-progress" -> PrimaryAmber.copy(alpha = 0.15f)
                                        else -> MutedText.copy(alpha = 0.15f)
                                    }
                                )
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (task.status == "assigned") {
                                Button(
                                    onClick = { viewModel.updateTaskStatus(task.id, "in-progress") },
                                    colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Start", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            if (task.status == "in-progress") {
                                Button(
                                    onClick = {
                                        viewModel.completeTask(task.id, "Task completed", null)
                                        Toast.makeText(context, "Task marked as completed", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Complete", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Daily Log Submission
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "DAILY WORK LOG",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "You have logged ${commits.size} work commits so far.",
                    style = Typography.bodyMedium,
                    color = MutedText
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Recent commits
                commits.take(3).forEach { commit ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(BackgroundDark)
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Article,
                            contentDescription = null,
                            tint = EngineeringBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = commit.taskDescription,
                                style = Typography.bodyMedium,
                                color = NeutralText,
                                maxLines = 1
                            )
                            Text(
                                text = "${commit.date} • ${commit.hoursSpent}h",
                                style = Typography.labelSmall,
                                color = MutedText
                            )
                        }
                        if (commit.isSynced) {
                            Icon(Icons.Default.CloudDone, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(16.dp))
                        } else {
                            Icon(Icons.Default.CloudOff, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(16.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { showSubmitDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.NoteAdd, contentDescription = null, tint = BackgroundDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("LOG DAILY WORK", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }

    // Daily Work Submit Dialog
    if (showSubmitDialog) {
        var title by remember { mutableStateOf("") }
        var desc by remember { mutableStateOf("") }
        var hours by remember { mutableStateOf("") }
        var error by remember { mutableStateOf<String?>(null) }
        var submitting by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showSubmitDialog = false },
            title = { Text("Log Today's Work", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Task Title", color = MutedText) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        )
                    )
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description (≥10 chars)", color = MutedText) },
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        )
                    )
                    OutlinedTextField(
                        value = hours,
                        onValueChange = { hours = it },
                        label = { Text("Hours Spent (0.25–24.0)", color = MutedText) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        )
                    )
                    error?.let {
                        Text(it, color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val h = hours.toDoubleOrNull()
                        when {
                            title.isBlank() -> error = "Title is required."
                            desc.length < 10 -> error = "Description must be at least 10 characters."
                            h == null || h < 0.25 || h > 24.0 -> error = "Hours must be between 0.25 and 24.0."
                            else -> {
                                error = null
                                submitting = true
                                viewModel.submitDailyWork(title, desc, h, "local_task") {
                                    submitting = false
                                    showSubmitDialog = false
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
                ) {
                    if (submitting) {
                        CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(16.dp))
                    } else {
                        Text("SUBMIT", color = BackgroundDark, fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showSubmitDialog = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

@Composable
private fun OtherPosStatCard(
    label: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = Typography.titleLarge,
                color = NeutralText,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = Typography.labelSmall,
                color = MutedText
            )
        }
    }
}
