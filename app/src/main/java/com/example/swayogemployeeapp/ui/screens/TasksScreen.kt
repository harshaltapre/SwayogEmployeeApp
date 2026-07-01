package com.example.swayogemployeeapp.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UnifiedTasksScreen(viewModel: MainViewModel) {
    val tasks by viewModel.tasks.collectAsState()
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Today", "Upcoming", "Completed")
    val context = LocalContext.current

    val currentDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

    // Split tasks
    val todayTasks = remember(tasks) {
        tasks.filter { task ->
            task.status != "completed" && task.scheduledTime.startsWith(currentDateStr)
        }
    }
    val upcomingTasks = remember(tasks) {
        tasks.filter { task ->
            task.status != "completed" && !task.scheduledTime.startsWith(currentDateStr) &&
                    task.scheduledTime > currentDateStr
        }
    }
    val completedTasks = remember(tasks) {
        tasks.filter { task -> task.status == "completed" }
    }

    val displayTasks = when (selectedTabIndex) {
        0 -> todayTasks
        1 -> upcomingTasks
        else -> completedTasks
    }

    var showCompleteDialogForTask by remember { mutableStateOf<EmployeeTaskEntity?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "ASSIGNED TASKS WORKSPACE",
            style = Typography.titleMedium,
            color = NeutralText,
            fontWeight = FontWeight.Bold
        )

        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = SurfaceDark,
            contentColor = PrimaryAmber,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = PrimaryAmber
                )
            }
        ) {
            tabs.forEachIndexed { index, title ->
                val count = when (index) {
                    0 -> todayTasks.size
                    1 -> upcomingTasks.size
                    else -> completedTasks.size
                }
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Text(
                            text = "$title ($count)",
                            fontWeight = FontWeight.Bold,
                            color = if (selectedTabIndex == index) PrimaryAmber else MutedText
                        )
                    }
                )
            }
        }

        if (displayTasks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No tasks found in this category.",
                    color = MutedText,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(displayTasks) { task ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = task.jobType.uppercase(),
                                    fontWeight = FontWeight.ExtraBold,
                                    color = when (task.jobType) {
                                        "Survey" -> EngineeringBlue
                                        "Installation" -> SuccessGreen
                                        "AMC Visit" -> PrimaryAmber
                                        else -> Color(0xFFEF4444)
                                    },
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "Status: ${task.status.uppercase()}",
                                    color = if (task.status == "completed") SuccessGreen else if (task.status == "in_progress") PrimaryAmber else MutedText,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                )
                            }

                            Text(
                                text = task.description,
                                color = NeutralText,
                                style = Typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )

                            Divider(color = BorderGray)

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = MutedText, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = task.customerName, color = NeutralText, fontSize = 13.sp)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = MutedText, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = task.customerPhone,
                                    color = EngineeringBlue,
                                    fontSize = 13.sp,
                                    modifier = Modifier.clickable {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${task.customerPhone}"))
                                        context.startActivity(intent)
                                    }
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, tint = MutedText, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = task.address,
                                        color = MutedText,
                                        fontSize = 12.sp,
                                        maxLines = 2
                                    )
                                }
                                if (task.latitude != null && task.longitude != null) {
                                    IconButton(
                                        onClick = {
                                            val gmmIntentUri = Uri.parse("geo:0,0?q=${task.latitude},${task.longitude}(${Uri.encode(task.customerName)})")
                                            val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri).apply {
                                                setPackage("com.google.android.apps.maps")
                                            }
                                            context.startActivity(mapIntent)
                                        }
                                    ) {
                                        Icon(imageVector = Icons.Default.Directions, contentDescription = "Navigate", tint = EngineeringBlue)
                                    }
                                }
                            }

                            if (task.status != "completed") {
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    if (task.status == "assigned") {
                                        Button(
                                            onClick = {
                                                viewModel.updateTaskStatus(task.id, "in_progress")
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(38.dp)
                                        ) {
                                            Text("START TASK", color = BackgroundDark, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        }
                                    } else if (task.status == "in_progress") {
                                        Button(
                                            onClick = {
                                                showCompleteDialogForTask = task
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(38.dp)
                                        ) {
                                            Text("COMPLETE TASK", color = BackgroundDark, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCompleteDialogForTask != null) {
        val task = showCompleteDialogForTask!!
        var completionMsg by remember { mutableStateOf("") }
        var errorMsg by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { showCompleteDialogForTask = null },
            title = { Text("Complete Task", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Describe what actions were completed for ${task.customerName}.", color = NeutralText)
                    OutlinedTextField(
                        value = completionMsg,
                        onValueChange = { completionMsg = it },
                        label = { Text("Completion Message", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    errorMsg?.let {
                        Text(text = it, color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (completionMsg.isBlank()) {
                            errorMsg = "Please describe the completion status."
                            return@Button
                        }
                        viewModel.completeTask(task.id, completionMsg, null)
                        showCompleteDialogForTask = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                ) {
                    Text("COMPLETE", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCompleteDialogForTask = null }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}
