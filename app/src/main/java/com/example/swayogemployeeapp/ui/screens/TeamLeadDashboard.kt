package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeamLeadDashboard(viewModel: MainViewModel) {
    val session by viewModel.session.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val internalUsers by viewModel.internalUsers.collectAsState()
    val teamSubmissions by viewModel.teamSubmissions.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.fetchInternalUsers()
        viewModel.fetchTeamSubmissions()
    }

    // Helper for recursive lookup
    fun getRecursiveReportees(managerId: String, allUsers: List<com.example.swayogemployeeapp.data.remote.InternalUserDto>): List<com.example.swayogemployeeapp.data.remote.InternalUserDto> {
        val direct = allUsers.filter { it.reportingManagerId == managerId }
        val result = mutableListOf<com.example.swayogemployeeapp.data.remote.InternalUserDto>()
        result.addAll(direct)
        for (d in direct) {
            result.addAll(getRecursiveReportees(d.id, allUsers))
        }
        return result.distinctBy { it.id }
    }

    val reportees = remember(session, internalUsers) {
        session?.id?.let { managerId ->
            getRecursiveReportees(managerId, internalUsers)
        } ?: emptyList()
    }

    val teamMembers = remember(reportees) {
        reportees.map { user ->
            MockTeamMember(
                id = user.id,
                name = user.fullName,
                role = user.employeeProfile?.jobRole ?: user.designationTitle ?: "Employee",
                status = if (user.isActive) "Checked-In" else "Checked-Out",
                location = user.employeeProfile?.zone ?: "Head Office",
                currentTask = "None"
            )
        }
    }

    val reporteeIds = remember(reportees) { reportees.map { it.id }.toSet() }

    val pendingSubmissions = remember(teamSubmissions, reporteeIds, internalUsers) {
        teamSubmissions.filter { it.employeeId in reporteeIds }.map { sub ->
            val empName = internalUsers.find { it.id == sub.employeeId }?.fullName ?: "Employee"
            MockSubmission(
                id = sub.id,
                employeeName = empName,
                title = sub.title,
                description = sub.description,
                hours = sub.hoursSpent,
                status = sub.status.lowercase()
            )
        }
    }

    var showAssignDialog by remember { mutableStateOf(false) }
    var showReviewDialog by remember { mutableStateOf(false) }
    var selectedMember by remember { mutableStateOf<MockTeamMember?>(null) }
    var selectedSubmission by remember { mutableStateOf<MockSubmission?>(null) }
    var reviewActionStatus by remember { mutableStateOf("APPROVED") }
    var reviewScoreVal by remember { mutableIntStateOf(5) }
    var reviewNotesVal by remember { mutableStateOf("") }

    val checkedInCount = teamMembers.count { it.status == "Checked-In" }
    val totalCount = teamMembers.size

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Team Overview Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Groups,
                        contentDescription = null,
                        tint = EngineeringBlue,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "TEAM ATTENDANCE TODAY",
                            style = Typography.labelSmall,
                            color = MutedText,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "$checkedInCount / $totalCount Members Active",
                            style = Typography.titleLarge,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Attendance progress bar
                LinearProgressIndicator(
                    progress = { checkedInCount.toFloat() / totalCount.toFloat() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = SuccessGreen,
                    trackColor = BorderGray
                )
            }
        }

        // Team Members List
        Text(
            text = "TEAM MEMBERS",
            style = Typography.titleMedium,
            color = NeutralText,
            fontWeight = FontWeight.Bold
        )

        teamMembers.forEach { member ->
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.clickable { selectedMember = member }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Avatar with status indicator
                    Box {
                        Surface(
                            shape = CircleShape,
                            color = EngineeringBlue.copy(alpha = 0.15f),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = member.name.first().uppercase(),
                                    style = Typography.titleMedium,
                                    color = EngineeringBlue,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        // Status dot
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(if (member.status == "Checked-In") SuccessGreen else MutedText)
                                .border(2.dp, SurfaceDark, CircleShape)
                                .align(Alignment.BottomEnd)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = member.name,
                            style = Typography.bodyLarge,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = member.role,
                            style = Typography.bodyMedium,
                            color = MutedText
                        )
                        if (member.currentTask != "None") {
                            Text(
                                text = "▸ ${member.currentTask}",
                                style = Typography.labelSmall,
                                color = EngineeringBlue
                            )
                        }
                    }

                    AssistChip(
                        onClick = {},
                        label = { Text(member.status, fontSize = 10.sp) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = if (member.status == "Checked-In")
                                SuccessGreen.copy(alpha = 0.15f) else MutedText.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }

        // Task Distribution Panel
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "TASK DISTRIBUTION",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                teamMembers.forEach { member ->
                    val memberTaskCount = when (member.role) {
                        "O&M Technician" -> 4
                        "Service Engineer" -> 3
                        else -> 2
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(member.name, style = Typography.bodyMedium, color = NeutralText, modifier = Modifier.weight(1f))
                        Text("$memberTaskCount tasks", style = Typography.bodyMedium, color = EngineeringBlue, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(8.dp))
                        LinearProgressIndicator(
                            progress = { memberTaskCount / 6f },
                            modifier = Modifier
                                .width(80.dp)
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp)),
                            color = if (memberTaskCount > 4) Color(0xFFEF4444) else EngineeringBlue,
                            trackColor = BorderGray
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { showAssignDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.AddTask, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("ASSIGN NEW TASK TO MEMBER", fontWeight = FontWeight.Bold)
                }
            }
        }

        // Work Submission Reviews
        Text(
            text = "PENDING SUBMISSION REVIEWS (${pendingSubmissions.size})",
            style = Typography.titleMedium,
            color = PrimaryAmber,
            fontWeight = FontWeight.Bold
        )

        pendingSubmissions.forEach { sub ->
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryAmber.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = sub.title,
                                style = Typography.bodyLarge,
                                color = NeutralText,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "By: ${sub.employeeName} • ${sub.hours}h",
                                style = Typography.bodyMedium,
                                color = MutedText
                            )
                        }
                        AssistChip(
                            onClick = {},
                            label = { Text("Pending", fontSize = 10.sp) },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = PrimaryAmber.copy(alpha = 0.15f)
                            )
                        )
                    }
                    Text(
                        text = sub.description,
                        style = Typography.bodyMedium,
                        color = MutedText,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                selectedSubmission = sub
                                reviewActionStatus = "APPROVED"
                                reviewScoreVal = 5
                                reviewNotesVal = ""
                                showReviewDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(8.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Approve", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = {
                                selectedSubmission = sub
                                reviewActionStatus = "REVISION"
                                reviewScoreVal = 0
                                reviewNotesVal = ""
                                showReviewDialog = true
                            },
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryAmber)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Revise", fontSize = 12.sp, color = PrimaryAmber, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = {
                                selectedSubmission = sub
                                reviewActionStatus = "REJECTED"
                                reviewScoreVal = 0
                                reviewNotesVal = ""
                                showReviewDialog = true
                            },
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444))
                        ) {
                            Icon(Icons.Default.Cancel, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Reject", fontSize = 12.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Performance Review Widget
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "TEAM PERFORMANCE REVIEWS",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                teamMembers.forEach { member ->
                    var rating by remember { mutableIntStateOf(4) }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = member.name,
                            style = Typography.bodyMedium,
                            color = NeutralText,
                            modifier = Modifier.weight(1f)
                        )
                        Row {
                            (1..5).forEach { star ->
                                IconButton(
                                    onClick = { rating = star },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = if (star <= rating) Icons.Default.Star else Icons.Default.StarBorder,
                                        contentDescription = "Rate $star",
                                        tint = if (star <= rating) PrimaryAmber else MutedText,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            text = "$rating/5",
                            style = Typography.bodyMedium,
                            color = PrimaryAmber,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        Toast.makeText(context, "Performance reviews submitted", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("SUBMIT PERFORMANCE REVIEWS", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }

    // Assign Task Dialog
    if (showAssignDialog) {
        var targetMember by remember { mutableStateOf(teamMembers.first().name) }
        var taskType by remember { mutableStateOf("Survey") }
        var taskDesc by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAssignDialog = false },
            title = { Text("Assign Task to Team Member", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Member selector
                    var expanded by remember { mutableStateOf(false) }
                    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                        OutlinedTextField(
                            value = targetMember,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Assign To", color = MutedText) },
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
                            teamMembers.forEach { member ->
                                DropdownMenuItem(
                                    text = { Text("${member.name} (${member.role})") },
                                    onClick = {
                                        targetMember = member.name
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Task type chips
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Survey", "Complaint", "AMC Visit", "Service").forEach { type ->
                            FilterChip(
                                selected = taskType == type,
                                onClick = { taskType = type },
                                label = { Text(type, fontSize = 11.sp) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = taskDesc,
                        onValueChange = { taskDesc = it },
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
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.assignTaskLocally(
                            EmployeeTaskEntity(
                                id = (System.currentTimeMillis() % 100000).toInt(),
                                jobType = taskType,
                                description = taskDesc,
                                scheduledTime = "2026-06-24T09:00:00Z",
                                status = "assigned",
                                customerName = "Assigned by Team Lead",
                                customerPhone = "",
                                address = "TBD",
                                latitude = null,
                                longitude = null,
                                completionMessage = null,
                                completionDocumentUrl = null,
                                completedAt = null
                            )
                        )
                        Toast.makeText(context, "Task assigned to $targetMember", Toast.LENGTH_SHORT).show()
                        showAssignDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    enabled = taskDesc.isNotBlank()
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

    // Review Submission Dialog
    if (showReviewDialog && selectedSubmission != null) {
        val sub = selectedSubmission!!
        AlertDialog(
            onDismissRequest = { showReviewDialog = false },
            title = {
                Text(
                    text = when (reviewActionStatus) {
                        "APPROVED" -> "Approve Submission"
                        "REVISION" -> "Request Revision"
                        else -> "Reject Submission"
                    },
                    color = when (reviewActionStatus) {
                        "APPROVED" -> SuccessGreen
                        "REVISION" -> PrimaryAmber
                        else -> Color(0xFFEF4444)
                    },
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Submission: ${sub.title}\nBy: ${sub.employeeName}",
                        style = Typography.bodyMedium,
                        color = NeutralText
                    )
                    
                    if (reviewActionStatus == "APPROVED") {
                        Text(
                            text = "Score: $reviewScoreVal/5",
                            style = Typography.bodyMedium,
                            color = PrimaryAmber,
                            fontWeight = FontWeight.Bold
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            (1..5).forEach { star ->
                                IconButton(
                                    onClick = { reviewScoreVal = star },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = if (star <= reviewScoreVal) Icons.Default.Star else Icons.Default.StarBorder,
                                        contentDescription = "Rate $star",
                                        tint = if (star <= reviewScoreVal) PrimaryAmber else MutedText,
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                            }
                        }
                    }
                    
                    OutlinedTextField(
                        value = reviewNotesVal,
                        onValueChange = { reviewNotesVal = it },
                        label = {
                            Text(
                                text = when (reviewActionStatus) {
                                    "APPROVED" -> "Notes (Optional)"
                                    "REVISION" -> "Revision Instructions (Required)"
                                    else -> "Rejection Reason (Required)"
                                },
                                color = MutedText
                            )
                        },
                        maxLines = 4,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = when (reviewActionStatus) {
                                "APPROVED" -> SuccessGreen
                                "REVISION" -> PrimaryAmber
                                else -> Color(0xFFEF4444)
                            },
                            unfocusedBorderColor = BorderGray
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val isNotesValid = reviewActionStatus == "APPROVED" || reviewNotesVal.isNotBlank()
                        if (isNotesValid) {
                            viewModel.reviewSubmission(
                                id = sub.id,
                                status = reviewActionStatus,
                                score = if (reviewActionStatus == "APPROVED") reviewScoreVal else null,
                                notes = reviewNotesVal.ifBlank { null }
                            ) { result ->
                                if (result.isSuccess) {
                                    Toast.makeText(context, "Submission updated successfully", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                                }
                            }
                            showReviewDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when (reviewActionStatus) {
                            "APPROVED" -> SuccessGreen
                            "REVISION" -> PrimaryAmber
                            else -> Color(0xFFEF4444)
                        }
                    ),
                    enabled = reviewActionStatus == "APPROVED" || reviewNotesVal.isNotBlank()
                ) {
                    Text("CONFIRM", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showReviewDialog = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

private data class MockTeamMember(
    val id: String,
    val name: String,
    val role: String,
    val status: String,
    val location: String,
    val currentTask: String
)

private data class MockSubmission(
    val id: String,
    val employeeName: String,
    val title: String,
    val description: String,
    val hours: Double,
    val status: String
)
