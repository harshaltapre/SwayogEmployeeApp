package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DepartmentHeadDashboard(viewModel: MainViewModel) {
    val session by viewModel.session.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    // Mock department data
    val departmentName = "Solar Operations"
    val totalTeams = 4
    val totalMembers = 18
    val activeTasks = 32
    val completedTasks = 156
    val pendingEscalations = 3

    val teamStats = listOf(
        MockTeamStat("Installation Team", "Vijay Patil", 5, 87, 12, 3),
        MockTeamStat("Survey & Design Team", "Rajesh Kumar", 4, 92, 8, 1),
        MockTeamStat("Service & Maintenance Team", "Suresh Sawant", 5, 78, 15, 5),
        MockTeamStat("Monitoring & Support Team", "Priya Nair", 4, 95, 6, 0)
    )

    val escalations = listOf(
        MockEscalation("ESC-001", "Critical stock shortage on Mono PERC Panels", "Installation Team", "High", "2026-06-23"),
        MockEscalation("ESC-002", "Customer SW-302 inverter offline for 72 hours", "Monitoring & Support Team", "Critical", "2026-06-22"),
        MockEscalation("ESC-003", "Delayed commissioning report for project SW-415", "Survey & Design Team", "Medium", "2026-06-24")
    )

    var showAssignDialog by remember { mutableStateOf(false) }
    var selectedTeam by remember { mutableStateOf<MockTeamStat?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Department Overview Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Business,
                        contentDescription = null,
                        tint = PrimaryAmber,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "DEPARTMENT OVERVIEW",
                            style = Typography.labelSmall,
                            color = MutedText,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = departmentName,
                            style = Typography.titleLarge,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    DeptKpiMini("Teams", totalTeams.toString(), Icons.Default.Groups, EngineeringBlue)
                    DeptKpiMini("Members", totalMembers.toString(), Icons.Default.People, SuccessGreen)
                    DeptKpiMini("Active", activeTasks.toString(), Icons.Default.Assignment, PrimaryAmber)
                    DeptKpiMini("Done", completedTasks.toString(), Icons.Default.CheckCircle, SuccessGreen)
                }
            }
        }

        // Escalation Queue
        if (escalations.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.5f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = Color(0xFFEF4444),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "ESCALATION QUEUE ($pendingEscalations PENDING)",
                            style = Typography.titleMedium,
                            color = Color(0xFFEF4444),
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    escalations.forEach { esc ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(BackgroundDark)
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(
                                        when (esc.priority) {
                                            "Critical" -> Color(0xFFEF4444)
                                            "High" -> PrimaryAmber
                                            else -> EngineeringBlue
                                        }
                                    )
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${esc.id}: ${esc.description}",
                                    style = Typography.bodyMedium,
                                    color = NeutralText,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "${esc.team} • ${esc.date}",
                                    style = Typography.labelSmall,
                                    color = MutedText
                                )
                            }
                            AssistChip(
                                onClick = {
                                    Toast.makeText(context, "Escalation ${esc.id} acknowledged", Toast.LENGTH_SHORT).show()
                                },
                                label = { Text(esc.priority, fontSize = 10.sp) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = when (esc.priority) {
                                        "Critical" -> Color(0xFFEF4444).copy(alpha = 0.15f)
                                        "High" -> PrimaryAmber.copy(alpha = 0.15f)
                                        else -> EngineeringBlue.copy(alpha = 0.15f)
                                    }
                                )
                            )
                        }
                    }
                }
            }
        }

        // Team Performance Grid
        Text(
            text = "TEAM PERFORMANCE GRID",
            style = Typography.titleMedium,
            color = NeutralText,
            fontWeight = FontWeight.Bold
        )

        teamStats.forEach { team ->
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.clickable { selectedTeam = team }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = team.name,
                                style = Typography.titleMedium,
                                color = NeutralText,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Lead: ${team.leadName} • ${team.memberCount} members",
                                style = Typography.bodyMedium,
                                color = MutedText
                            )
                        }
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(24.dp))
                                .background(
                                    if (team.attendancePercent >= 90) SuccessGreen.copy(alpha = 0.15f)
                                    else if (team.attendancePercent >= 80) PrimaryAmber.copy(alpha = 0.15f)
                                    else Color(0xFFEF4444).copy(alpha = 0.15f)
                                )
                        ) {
                            Text(
                                text = "${team.attendancePercent}%",
                                style = Typography.labelSmall,
                                color = if (team.attendancePercent >= 90) SuccessGreen
                                else if (team.attendancePercent >= 80) PrimaryAmber
                                else Color(0xFFEF4444),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Resource allocation bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Active", style = Typography.labelSmall, color = MutedText)
                            Text(
                                "${team.activeTasks}",
                                style = Typography.titleMedium,
                                color = EngineeringBlue,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Pending", style = Typography.labelSmall, color = MutedText)
                            Text(
                                "${team.pendingTasks}",
                                style = Typography.titleMedium,
                                color = if (team.pendingTasks > 3) Color(0xFFEF4444) else PrimaryAmber,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Attendance", style = Typography.labelSmall, color = MutedText)
                            Text(
                                "${team.attendancePercent}%",
                                style = Typography.titleMedium,
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Workload progress bar
                    Spacer(modifier = Modifier.height(8.dp))
                    val workloadFraction = team.activeTasks.toFloat() / (team.activeTasks + team.pendingTasks).coerceAtLeast(1).toFloat()
                    LinearProgressIndicator(
                        progress = { workloadFraction },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = EngineeringBlue,
                        trackColor = BorderGray
                    )
                    Text(
                        text = "Workload: ${(workloadFraction * 100).toInt()}% active",
                        style = Typography.labelSmall,
                        color = MutedText,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Department KPI Summary
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "DEPARTMENT KPI SUMMARY",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                DeptKpiRow("Monthly Installations", "Target: 25", "Actual: 22", 0.88f, SuccessGreen)
                DeptKpiRow("AMC Visits Completed", "Target: 60", "Actual: 54", 0.90f, EngineeringBlue)
                DeptKpiRow("Customer Complaints Resolved", "Target: 15", "Actual: 12", 0.80f, PrimaryAmber)
                DeptKpiRow("Survey Submissions", "Target: 20", "Actual: 19", 0.95f, SuccessGreen)
            }
        }

        // Quick Actions
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "QUICK ACTIONS",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { showAssignDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.AssignmentInd, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Assign Task", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            Toast.makeText(context, "Department report generating...", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Summarize, contentDescription = null, tint = BackgroundDark, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Generate Report", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = BackgroundDark)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }

    // Assign Task Dialog
    if (showAssignDialog) {
        var selectedTeamName by remember { mutableStateOf(teamStats.first().name) }
        var taskDescription by remember { mutableStateOf("") }
        var taskPriority by remember { mutableStateOf("Medium") }

        AlertDialog(
            onDismissRequest = { showAssignDialog = false },
            title = { Text("Assign Task Across Teams", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Distribute a task to a specific team lead.", color = NeutralText)

                    // Team selector
                    var expanded by remember { mutableStateOf(false) }
                    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                        OutlinedTextField(
                            value = selectedTeamName,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Target Team", color = MutedText) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = NeutralText,
                                unfocusedTextColor = NeutralText,
                                focusedBorderColor = PrimaryAmber,
                                unfocusedBorderColor = BorderGray
                            )
                        )
                        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                            teamStats.forEach { team ->
                                DropdownMenuItem(
                                    text = { Text(team.name) },
                                    onClick = {
                                        selectedTeamName = team.name
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = taskDescription,
                        onValueChange = { taskDescription = it },
                        label = { Text("Task Description", color = MutedText) },
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        )
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Low", "Medium", "High", "Critical").forEach { priority ->
                            FilterChip(
                                selected = taskPriority == priority,
                                onClick = { taskPriority = priority },
                                label = { Text(priority, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = when (priority) {
                                        "Critical" -> Color(0xFFEF4444).copy(alpha = 0.2f)
                                        "High" -> PrimaryAmber.copy(alpha = 0.2f)
                                        "Medium" -> EngineeringBlue.copy(alpha = 0.2f)
                                        else -> SuccessGreen.copy(alpha = 0.2f)
                                    }
                                )
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        Toast.makeText(context, "Task assigned to $selectedTeamName", Toast.LENGTH_SHORT).show()
                        showAssignDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    enabled = taskDescription.isNotBlank()
                ) {
                    Text("ASSIGN", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAssignDialog = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

@Composable
private fun DeptKpiMini(label: String, value: String, icon: ImageVector, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(20.dp)
        )
        Text(
            text = value,
            style = Typography.titleMedium,
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

@Composable
private fun DeptKpiRow(title: String, target: String, actual: String, progress: Float, color: Color) {
    Column(modifier = Modifier.padding(vertical = 6.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, style = Typography.bodyMedium, color = NeutralText, fontWeight = FontWeight.Medium)
            Text("${(progress * 100).toInt()}%", style = Typography.bodyMedium, color = color, fontWeight = FontWeight.Bold)
        }
        Text("$target | $actual", style = Typography.labelSmall, color = MutedText)
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp)),
            color = color,
            trackColor = BorderGray
        )
    }
}

private data class MockTeamStat(
    val name: String,
    val leadName: String,
    val memberCount: Int,
    val attendancePercent: Int,
    val activeTasks: Int,
    val pendingTasks: Int
)

private data class MockEscalation(
    val id: String,
    val description: String,
    val team: String,
    val priority: String,
    val date: String
)
