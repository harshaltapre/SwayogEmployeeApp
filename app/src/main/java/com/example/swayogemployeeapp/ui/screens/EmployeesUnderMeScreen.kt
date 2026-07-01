package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.automirrored.filled.*
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
import androidx.compose.ui.text.style.TextAlign
import com.example.swayogemployeeapp.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeesUnderMeScreen(viewModel: MainViewModel) {
    val session by viewModel.session.collectAsState()
    val context = LocalContext.current

    val internalUsers by viewModel.internalUsers.collectAsState()
    val isLoadingUsers by viewModel.internalUsersLoading.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.fetchInternalUsers()
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
            getRecursiveReportees(managerId, internalUsers).map { user ->
                MockReportee(
                    id = user.id,
                    name = user.fullName,
                    designation = user.employeeProfile?.jobRole ?: user.designationTitle ?: "Employee",
                    status = if (user.isActive) "Checked-In" else "Checked-Out",
                    location = user.employeeProfile?.zone ?: "Head Office",
                    averageRating = 4.2,
                    latestComment = "Active workforce member."
                )
            }
        } ?: emptyList()
    }

    var selectedReportee by remember { mutableStateOf<MockReportee?>(null) }
    var ratingStr by remember { mutableStateOf("") }
    var reviewComment by remember { mutableStateOf("") }
    var submittingReview by remember { mutableStateOf(false) }

    if (selectedReportee == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "TEAM HIERARCHY & MENTORING DESK",
                style = Typography.titleMedium,
                color = NeutralText,
                fontWeight = FontWeight.Bold
            )

            if (isLoadingUsers) {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PrimaryAmber)
                }
            } else if (reportees.isEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, BorderGray),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(BackgroundDark),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Group,
                                contentDescription = null,
                                tint = MutedText,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Text(
                            text = "No Direct Reports Yet",
                            style = Typography.titleMedium,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "You do not have any employees assigned to report directly to you. Please ask Superadmin or Admin to assign team members under your supervision.",
                            style = Typography.bodyMedium,
                            color = MutedText,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(reportees) { reportee ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                selectedReportee = reportee
                                ratingStr = ""
                                reviewComment = ""
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (reportee.designation == "Intern") Icons.Default.School else Icons.Default.Engineering,
                                    contentDescription = null,
                                    tint = PrimaryAmber,
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text(text = reportee.name, color = NeutralText, fontWeight = FontWeight.Bold)
                                    Text(text = "${reportee.designation} • ${reportee.status}", color = if (reportee.status == "Checked-In") SuccessGreen else MutedText, fontSize = 12.sp)
                                }
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Star, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = reportee.averageRating.toString(), color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }
    }
    return

    val reportee = selectedReportee!!

    val checkedInDays = remember(reportee.id) {
        when (reportee.id) {
            "usr_intern_01" -> setOf(1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18, 22, 23, 24)
            "usr_intern_02" -> setOf(1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 22, 23)
            "usr_tech_01" -> setOf(1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24)
            "usr_eng_01" -> setOf(1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18, 22, 23, 24)
            else -> setOf(1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18, 22, 23)
        }
    }

    val mockCommits = remember(reportee.id) {
        when (reportee.id) {
            "usr_intern_01" -> listOf(
                MockCommit("2026-06-23", "Completed AutoCAD floorplan for Juhu site", 6.0),
                MockCommit("2026-06-22", "Drafted electrical room layout", 5.5)
            )
            "usr_intern_02" -> listOf(
                MockCommit("2026-06-23", "Single line diagram revisions phase 1", 7.5),
                MockCommit("2026-06-22", "Cable sizing calculation sheet", 4.0)
            )
            "usr_tech_01" -> listOf(
                MockCommit("2026-06-23", "Panel washing at Juhu Bungalow", 8.0),
                MockCommit("2026-06-22", "Inverter connection inspection", 7.0)
            )
            "usr_eng_01" -> listOf(
                MockCommit("2026-06-23", "Debugged Growatt Inverter Voc High", 8.0),
                MockCommit("2026-06-22", "Grid synchronization test", 6.5)
            )
            else -> listOf(
                MockCommit("2026-06-23", "Standard site checks and cleaning support", 7.0),
                MockCommit("2026-06-22", "Daily site report compile", 5.0)
            )
        }
    }

    val mockTasks = remember(reportee.id) {
        when (reportee.id) {
            "usr_intern_01" -> listOf(
                MockTask("Update structural load calculations", "in-progress"),
                MockTask("Submit shadow scan photos", "assigned")
            )
            "usr_intern_02" -> listOf(
                MockTask("Correct voltage drop calculation in layout", "assigned")
            )
            "usr_tech_01" -> listOf(
                MockTask("Tighten DC clamp structures", "assigned")
            )
            "usr_eng_01" -> listOf(
                MockTask("Replace faulty AC SPD module", "in-progress")
            )
            else -> listOf(
                MockTask("Awaiting direct dispatch instructions", "assigned")
            )
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { selectedReportee = null }) {
                Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = PrimaryAmber)
            }
            Text(text = "EVALUATE REPORTING TEAM", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // Selected reportee summary card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = reportee.name, color = NeutralText, fontWeight = FontWeight.Bold, style = Typography.titleMedium)
                Text(text = "Designation: ${reportee.designation}", color = MutedText, fontSize = 13.sp)
                Text(
                    text = "Status: ${reportee.status}",
                    color = if (reportee.status == "Checked-In") SuccessGreen else MutedText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(text = "Current Site Location: ${reportee.location}", color = NeutralText, fontSize = 13.sp)
                HorizontalDivider(color = BorderGray, modifier = Modifier.padding(vertical = 4.dp))
                Text(text = "Latest Supervisor Feedback:", color = PrimaryAmber, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                Text(text = "\"${reportee.latestComment}\"", color = MutedText, fontSize = 13.sp)
            }
        }

        // Attendance History Calendar Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "ATTENDANCE CALENDAR (JUNE 2026)",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )
                
                val daysInMonth = 30
                val cols = 7
                val chunkedDays = (1..daysInMonth).toList().chunked(cols)
                
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        listOf("M", "T", "W", "T", "F", "S", "S").forEach {
                            Text(
                                text = it,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center,
                                color = MutedText,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    
                    chunkedDays.forEach { week ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            week.forEach { day ->
                                val present = checkedInDays.contains(day)
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .padding(2.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(if (present) SuccessGreen.copy(alpha = 0.2f) else Color.Transparent)
                                        .border(1.dp, if (present) SuccessGreen else BorderGray.copy(alpha = 0.3f), RoundedCornerShape(4.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = day.toString(),
                                        color = if (present) SuccessGreen else MutedText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            if (week.size < cols) {
                                repeat(cols - week.size) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            }
        }

        // Daily Commits Summary Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "DAILY WORK COMMITS",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )
                
                mockCommits.forEach { commit ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(BackgroundDark)
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = commit.date, color = MutedText, fontSize = 11.sp)
                            Text(text = "${commit.hoursSpent}h spent", color = EngineeringBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = commit.taskDescription, color = NeutralText, fontSize = 13.sp)
                    }
                }
            }
        }

        // Pending Tasks Queue Card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "PENDING / ACTIVE TASKS QUEUE",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )
                
                mockTasks.forEach { task ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(BackgroundDark)
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = task.description, color = NeutralText, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        AssistChip(
                            onClick = {},
                            label = { Text(task.status.uppercase(), fontSize = 9.sp) },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (task.status == "in-progress") PrimaryAmber.copy(alpha = 0.15f) else EngineeringBlue.copy(alpha = 0.15f)
                            )
                        )
                    }
                }
            }
        }

        // Submitting score/feedback card
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "SUBMIT NEW PERFORMANCE EVALUATION",
                    color = PrimaryAmber,
                    fontWeight = FontWeight.Bold,
                    style = Typography.labelSmall
                )

                OutlinedTextField(
                    value = ratingStr,
                    onValueChange = { ratingStr = it },
                    label = { Text("Score Rating (1.0 - 5.0)", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = reviewComment,
                    onValueChange = { reviewComment = it },
                    label = { Text("Mentoring feedback notes & reviews", color = MutedText) },
                    maxLines = 4,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        val score = ratingStr.toDoubleOrNull()
                        if (score == null || score < 1.0 || score > 5.0 || reviewComment.isBlank()) {
                            Toast.makeText(context, "Please enter a valid rating (1-5) and feedback comment", Toast.LENGTH_LONG).show()
                            return@Button
                        }
                        submittingReview = true
                        Toast.makeText(context, "Performance review submitted successfully to outbox!", Toast.LENGTH_SHORT).show()
                        selectedReportee = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                ) {
                    Icon(imageVector = Icons.Default.RateReview, contentDescription = null, tint = BackgroundDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SUBMIT PERFORMANCE RATING", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
}

data class MockCommit(
    val date: String,
    val taskDescription: String,
    val hoursSpent: Double
)

data class MockTask(
    val description: String,
    val status: String
)

data class MockReportee(
    val id: String,
    val name: String,
    val designation: String,
    val status: String,
    val location: String,
    val averageRating: Double,
    val latestComment: String
)
