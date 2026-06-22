package com.example.swayogemployeeapp.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InternDashboard(viewModel: MainViewModel) {
    val coroutineScope = rememberCoroutineScope()

    val context = androidx.compose.ui.platform.LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("intern_skills_prefs", Context.MODE_PRIVATE) }

    // Skills checklist progress stored in SharedPreferences
    var skillSurvey by remember { mutableStateOf(sharedPrefs.getBoolean("skill_survey", true)) }
    var skillDesign by remember { mutableStateOf(sharedPrefs.getBoolean("skill_design", false)) }
    var skillComm by remember { mutableStateOf(sharedPrefs.getBoolean("skill_comm", false)) }
    var skillRepair by remember { mutableStateOf(sharedPrefs.getBoolean("skill_repair", true)) }

    val mentorName by remember { mutableStateOf("Rajesh Kumar (Senior Design Eng)") }
    var shadowTaskType by remember { mutableStateOf("Site Surveying") }
    var achievementsText by remember { mutableStateOf("") }
    var hoursSpentStr by remember { mutableStateOf("6.5") }

    var logMessage by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    // Fetch supervisor feedback dynamically from backend
    val supervisorFeedback by viewModel.supervisorFeedback.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.fetchSupervisorFeedback()
    }

    val feedbackToDisplay = if (supervisorFeedback.isNotEmpty()) {
        supervisorFeedback.map { sub ->
            MockFeedback(
                mentor = sub.reviewedBy ?: "Supervisor",
                comment = sub.reviewNotes ?: "Reviewed: ${sub.title}",
                score = if (sub.reviewScore != null) "${sub.reviewScore}.0/5.0" else "Pending Rating"
            )
        }
    } else {
        // Fallback seed feedback
        listOf(
            MockFeedback("Rajesh Kumar", "Great work measuring John Doe's rooftop Concrete shading factors.", "4.5/5.0"),
            MockFeedback("Sanjay Mehta", "Review single line diagrams CAD constraints before commissioning.", "4.0/5.0")
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Mentor Card Profile
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = Icons.Default.School, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(36.dp))
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("ASSIGNED SENIOR MENTOR", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                    Text(mentorName, style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Daily Shadow Log Form
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("DAILY LEARNING SHADOW LOGS", style = Typography.labelSmall, color = EngineeringBlue, fontWeight = FontWeight.Bold)

                Text("Shadow Task Type:", color = NeutralText)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Site Surveying", "Layout CAD Drafting", "Repair Service").forEach { type ->
                        val active = shadowTaskType == type
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (active) PrimaryAmber else BackgroundDark)
                                .clickable { shadowTaskType = type }
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(type, color = if (active) BackgroundDark else NeutralText, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                OutlinedTextField(
                    value = achievementsText,
                    onValueChange = { achievementsText = it },
                    label = { Text("What did you shadow/learn today?", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth().height(80.dp)
                )

                OutlinedTextField(
                    value = hoursSpentStr,
                    onValueChange = { hoursSpentStr = it },
                    label = { Text("Decimal Hours Spent (e.g. 6.5)", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        val hours = hoursSpentStr.toDoubleOrNull() ?: 6.5
                        isSubmitting = true
                        viewModel.submitDailyWork(
                            title = "Shadowing Log: $shadowTaskType",
                            description = achievementsText,
                            hours = hours,
                            taskId = "intern_shadow"
                        ) {
                            coroutineScope.launch {
                                delay(1000)
                                isSubmitting = false
                                logMessage = "Shadow log successfully submitted to queue!"
                                achievementsText = ""
                                // Refresh ratings feed to see updates
                                viewModel.fetchSupervisorFeedback()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    enabled = achievementsText.isNotEmpty() && !isSubmitting
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
                    } else {
                        Text("SUBMIT SHADOW LOG", color = BackgroundDark, fontWeight = FontWeight.Bold)
                    }
                }

                if (logMessage.isNotEmpty()) {
                    Text(logMessage, color = SuccessGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Skills Matrix Checklist
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("FIELD SKILLS TIMELINE TRACKER", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = skillSurvey,
                        onCheckedChange = { checked ->
                            skillSurvey = checked
                            sharedPrefs.edit().putBoolean("skill_survey", checked).apply()
                            if (checked) {
                                viewModel.submitDailyWork(
                                    title = "Skill Checklist Progress",
                                    description = "Intern completed checkmark: Surveying (Rooftops & Shading)",
                                    hours = 0.0,
                                    taskId = "intern_skill_survey"
                                ) {}
                            }
                        },
                        colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber)
                    )
                    Text("Surveying (Rooftops & Shading)", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = skillDesign,
                        onCheckedChange = { checked ->
                            skillDesign = checked
                            sharedPrefs.edit().putBoolean("skill_design", checked).apply()
                            if (checked) {
                                viewModel.submitDailyWork(
                                    title = "Skill Checklist Progress",
                                    description = "Intern completed checkmark: CAD Design Layout drawings check",
                                    hours = 0.0,
                                    taskId = "intern_skill_design"
                                ) {}
                            }
                        },
                        colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber)
                    )
                    Text("CAD Design Layout drawings check", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = skillComm,
                        onCheckedChange = { checked ->
                            skillComm = checked
                            sharedPrefs.edit().putBoolean("skill_comm", checked).apply()
                            if (checked) {
                                viewModel.submitDailyWork(
                                    title = "Skill Checklist Progress",
                                    description = "Intern completed checkmark: Commissioning & Pit auditing checks",
                                    hours = 0.0,
                                    taskId = "intern_skill_comm"
                                ) {}
                            }
                        },
                        colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber)
                    )
                    Text("Commissioning & Pit auditing checks", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = skillRepair,
                        onCheckedChange = { checked ->
                            skillRepair = checked
                            sharedPrefs.edit().putBoolean("skill_repair", checked).apply()
                            if (checked) {
                                viewModel.submitDailyWork(
                                    title = "Skill Checklist Progress",
                                    description = "Intern completed checkmark: Diagnostic Inverter Repairs support",
                                    hours = 0.0,
                                    taskId = "intern_skill_repair"
                                ) {}
                            }
                        },
                        colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber)
                    )
                    Text("Diagnostic Inverter Repairs support", color = NeutralText)
                }
            }
        }

        // Supervisor review feed list
        Text("SUPERVISOR RATING & COMMENTS FEED", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        feedbackToDisplay.forEach { feed ->
            Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(feed.mentor, color = NeutralText, fontWeight = FontWeight.Bold)
                        Text(feed.score, color = SuccessGreen, fontWeight = FontWeight.Bold)
                    }
                    Text(feed.comment, fontSize = 12.sp, color = MutedText)
                }
            }
        }
    }
}

data class MockFeedback(
    val mentor: String,
    val comment: String,
    val score: String
)

