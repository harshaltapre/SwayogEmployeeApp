package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyCommitScreen(viewModel: MainViewModel) {
    val context = LocalContext.current
    val todayStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) }

    var commitDate by remember { mutableStateOf(todayStr) }
    var taskWorkedOn by remember { mutableStateOf("") }
    var workSummary by remember { mutableStateOf("") }
    var hoursSpent by remember { mutableStateOf("8.0") }
    var issuesBlockers by remember { mutableStateOf("") }
    var tomorrowPlan by remember { mutableStateOf("") }
    
    var isSubmitting by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf("") }

    val commits by viewModel.commits.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "DAILY WORK COMMIT",
            style = Typography.titleMedium,
            color = NeutralText,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Text(
            text = "Record what you worked on today. This feeds monthly performance reports for your team.",
            style = Typography.bodyMedium,
            color = MutedText
        )

        // Form Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "SUBMIT DAILY COMMIT",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )

                // Date Field
                OutlinedTextField(
                    value = commitDate,
                    onValueChange = { commitDate = it },
                    label = { Text("Date (YYYY-MM-DD)", color = MutedText) },
                    trailingIcon = { Icon(imageVector = Icons.Default.CalendarToday, contentDescription = null, tint = PrimaryAmber) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText, unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Task Worked On
                OutlinedTextField(
                    value = taskWorkedOn,
                    onValueChange = { taskWorkedOn = it },
                    label = { Text("Task Worked On", color = MutedText) },
                    placeholder = { Text("e.g. Rooftop site inspection & shading analysis", color = MutedText.copy(alpha = 0.5f)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText, unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Work Summary
                OutlinedTextField(
                    value = workSummary,
                    onValueChange = { workSummary = it },
                    label = { Text("Work Summary", color = MutedText) },
                    placeholder = { Text("Describe what you accomplished today in detail...", color = MutedText.copy(alpha = 0.5f)) },
                    minLines = 3,
                    maxLines = 5,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText, unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Hours Spent
                OutlinedTextField(
                    value = hoursSpent,
                    onValueChange = { hoursSpent = it },
                    label = { Text("Hours Spent (Decimal)", color = MutedText) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText, unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Issues / Blockers
                OutlinedTextField(
                    value = issuesBlockers,
                    onValueChange = { issuesBlockers = it },
                    label = { Text("Issues / Blockers (Optional)", color = MutedText) },
                    placeholder = { Text("Any technical or logistics blockers faced...", color = MutedText.copy(alpha = 0.5f)) },
                    minLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText, unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Tomorrow's Plan
                OutlinedTextField(
                    value = tomorrowPlan,
                    onValueChange = { tomorrowPlan = it },
                    label = { Text("Tomorrow's Plan (Optional)", color = MutedText) },
                    placeholder = { Text("What you plan to work on next...", color = MutedText.copy(alpha = 0.5f)) },
                    minLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText, unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        val hours = hoursSpent.toDoubleOrNull()
                        if (taskWorkedOn.isBlank()) {
                            Toast.makeText(context, "Please enter the task worked on", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (workSummary.length < 10) {
                            Toast.makeText(context, "Work summary must be at least 10 characters", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (hours == null || hours < 0.25 || hours > 24.0) {
                            Toast.makeText(context, "Hours spent must be between 0.25 and 24", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        isSubmitting = true
                        viewModel.submitDailyCommit(
                            date = commitDate,
                            taskWorkedOn = taskWorkedOn,
                            workSummary = workSummary,
                            hoursSpent = hours,
                            issuesBlockers = issuesBlockers.ifBlank { null },
                            tomorrowPlan = tomorrowPlan.ifBlank { null }
                        ) { result ->
                            isSubmitting = false
                            if (result.isSuccess) {
                                statusMessage = "Daily commit submitted successfully!"
                                taskWorkedOn = ""
                                workSummary = ""
                                issuesBlockers = ""
                                tomorrowPlan = ""
                            } else {
                                statusMessage = "Queued offline in outbox queue."
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    enabled = !isSubmitting
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                    } else {
                        Icon(imageVector = Icons.AutoMirrored.Filled.Send, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("SUBMIT DAILY COMMIT", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }

                if (statusMessage.isNotEmpty()) {
                    Text(
                        text = statusMessage,
                        color = SuccessGreen,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Recent History Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "MY COMMIT HISTORY",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )

                if (commits.isEmpty()) {
                    Text("No local commit records found yet.", color = MutedText, fontSize = 13.sp)
                } else {
                    commits.forEach { commit ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(BackgroundDark)
                                .padding(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = commit.date, color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text(text = "${commit.hoursSpent}h logged", color = EngineeringBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = commit.taskDescription, color = NeutralText, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}
