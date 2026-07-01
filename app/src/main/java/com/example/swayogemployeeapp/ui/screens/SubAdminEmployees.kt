package com.example.swayogemployeeapp.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.ui.theme.*

data class StaffItem(
    val id: String,
    val name: String,
    val jobRole: String,
    val email: String,
    val zone: String,
    val status: String,
    val activeTasks: Int,
    val rating: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminEmployees(viewModel: MainViewModel) {
    val tasksState by viewModel.tasks.collectAsState()
    val internalUsers by viewModel.internalUsers.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("All Roles") }
    var selectedEmployeeId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.EMPLOYEES)
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.TASKS)
        viewModel.fetchInternalUsers()
    }

    val staffList = remember(internalUsers, tasksState) {
        if (internalUsers.isNotEmpty()) {
            internalUsers.mapIndexed { index, u ->
                StaffItem(
                    id = u.id,
                    name = u.fullName,
                    jobRole = u.employeeProfile?.jobRole ?: u.designationTitle ?: u.role,
                    email = u.email,
                    zone = u.employeeProfile?.zone ?: "Head Office",
                    status = if (u.isActive) "Checked-In" else "Offline",
                    activeTasks = tasksState.count { it.status != "completed" },
                    rating = 4.8
                )
            }
        } else {
            listOf(
                StaffItem("1", "Shantanu Mahalle", "Solar Design Engineer", "shantanumahalle@gmail.com", "Pune Zone", "Checked-In", 3, 4.9),
                StaffItem("2", "Mohsin Ali", "Service Engineer", "mohsinali@gmail.com", "Mumbai Zone", "Checked-In", 2, 4.7),
                StaffItem("3", "Sagar Kinkar", "Site Survey Engineer", "sagarkinkar@gmail.com", "Nagpur Zone", "Offline", 1, 4.8),
                StaffItem("4", "Rohit Tripathi", "Electrical Engineer", "rohittripathi@gmail.com", "Delhi Zone", "Checked-In", 4, 4.6),
                StaffItem("5", "Harshal Tapre", "Intern", "harshaltapre26@gmail.com", "Pune Zone", "Checked-In", 3, 4.8),
                StaffItem("6", "Achal Wankar", "Service Coordinator", "achalwankar26@gmail.com", "Head Office", "Checked-In", 5, 5.0)
            )
        }
    }

    val filteredStaff = remember(searchQuery, selectedRole, staffList) {
        staffList.filter {
            val nameMatch = it.name.contains(searchQuery, ignoreCase = true) || it.email.contains(searchQuery, ignoreCase = true)
            val roleMatch = selectedRole == "All Roles" || it.jobRole.contains(selectedRole, ignoreCase = true)
            nameMatch && roleMatch
        }
    }

    val selectedEmployee = remember(selectedEmployeeId, staffList) {
        staffList.find { it.id == selectedEmployeeId }
    }

    if (selectedEmployee != null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundDark)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { selectedEmployeeId = null }) {
                    Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = PrimaryAmber)
                }
                Text("EMPLOYEE DETAILS", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
            }

            Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(selectedEmployee.name, color = NeutralText, fontWeight = FontWeight.Bold, style = Typography.titleMedium)
                    Text("Role: ${selectedEmployee.jobRole}", color = EngineeringBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("Email: ${selectedEmployee.email}", color = MutedText, fontSize = 13.sp)
                    Text("Zone: ${selectedEmployee.zone}", color = MutedText, fontSize = 13.sp)
                    Text("Status: ${selectedEmployee.status}", color = if (selectedEmployee.status == "Checked-In") SuccessGreen else MutedText, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("Performance Rating: ${selectedEmployee.rating} / 5.0", color = PrimaryAmber, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            Text("ASSIGNED TASKS LOG", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
            tasksState.take(3).forEach { task ->
                Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark), shape = RoundedCornerShape(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(task.jobType, color = PrimaryAmber, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(task.customerName, color = NeutralText, fontSize = 12.sp)
                        }
                        Text(task.status.uppercase(), color = if (task.status == "completed") SuccessGreen else EngineeringBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundDark)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text("EMPLOYEE SECTION", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

            // Search and Role Filters
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search staff name or email...", color = MutedText) },
                leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = MutedText) },
                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("All Roles", "Engineer", "Technician", "Intern").forEach { role ->
                    val isSelected = selectedRole == role
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) PrimaryAmber else SurfaceDark)
                            .clickable { selectedRole = role }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(role, color = if (isSelected) BackgroundDark else NeutralText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Text("STAFF DIRECTORY (${filteredStaff.size})", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(filteredStaff) { staff ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedEmployeeId = staff.id }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(EngineeringBlue.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(staff.name.take(1), color = EngineeringBlue, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(staff.name, color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("${staff.jobRole} • ${staff.zone}", color = MutedText, fontSize = 12.sp)
                                }
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(staff.status, color = if (staff.status == "Checked-In") SuccessGreen else MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("${staff.rating} ★", color = PrimaryAmber, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
