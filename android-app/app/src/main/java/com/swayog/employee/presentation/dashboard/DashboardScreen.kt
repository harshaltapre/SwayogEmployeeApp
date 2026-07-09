package com.swayog.employee.presentation.dashboard

import android.widget.Toast
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.common.components.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToAttendance: () -> Unit,
    onNavigateToTasks: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    val userName by viewModel.userName.collectAsState()
    val userRole by viewModel.userRole.collectAsState()
    val jobRole by viewModel.jobRole.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val performance by viewModel.performance.collectAsState()
    
    var workDescription by remember { mutableStateOf("") }
    
    val activeTasks = tasks.filter { it.status != "completed" }
    val completedTasks = tasks.filter { it.status == "completed" }
    
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Dashboard",
                actions = {
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(Icons.Default.Person, contentDescription = "Profile")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        }
    ) { paddingValues ->
        when (dashboardState) {
            is DashboardState.Loading -> {
                LoadingScreen(
                    modifier = Modifier.padding(paddingValues),
                    message = "Loading dashboard..."
                )
            }
            
            is DashboardState.Error -> {
                ErrorScreen(
                    message = (dashboardState as DashboardState.Error).message,
                    onRetry = viewModel::retryLoading,
                    modifier = Modifier.padding(paddingValues)
                )
            }
            
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Welcome Section
                    item {
                        Column {
                            Text(
                                text = "Hi, ${userName ?: "User"} 👋",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold
                            )
                            val displayRole = jobRole ?: when (userRole?.uppercase()) {
                                "SUPER_ADMIN" -> "Super Admin"
                                "ADMIN" -> "Admin"
                                "SUB_ADMIN" -> "Service Coordinator"
                                else -> "Employee"
                            }
                            Text(
                                text = "Role: $displayRole",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Here's your overview for today",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    
                    // Stats Cards
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            SwayogStatCard(
                                title = "Active",
                                value = activeTasks.size.toString(),
                                modifier = Modifier.weight(1f),
                                backgroundColor = MaterialTheme.colorScheme.primary
                            )
                            SwayogStatCard(
                                title = "Completed",
                                value = completedTasks.size.toString(),
                                contentColor = MaterialTheme.colorScheme.onSecondary,
                                modifier = Modifier.weight(1f),
                                backgroundColor = MaterialTheme.colorScheme.secondary
                            )
                            SwayogStatCard(
                                title = "Total",
                                value = tasks.size.toString(),
                                modifier = Modifier.weight(1f),
                                backgroundColor = MaterialTheme.colorScheme.tertiary
                            )
                        }
                    }
                    
                    // Attendance Card
                    item {
                        SwayogCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Today's Attendance",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    val attendance = todayAttendance
                                    if (attendance != null) {
                                        Text(
                                            text = if (attendance.checkInTime != null) {
                                                "Checked in at ${attendance.checkInTime}"
                                            } else {
                                                "Not checked in yet"
                                            },
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    } else {
                                        Text(
                                            text = "No attendance record",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                }
                                Button(onClick = onNavigateToAttendance) {
                                    Text("View Details")
                                }
                            }
                        }
                    }
                    
                    // Performance Card
                    item {
                        val perf = performance
                        if (perf != null) {
                            SwayogCard {
                                Column {
                                    Text(
                                        text = "Performance Score",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(24.dp)
                                    ) {
                                        Column {
                                            Text(
                                                text = "${perf.performanceScore}/5",
                                                style = MaterialTheme.typography.headlineMedium,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = "Score",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                            )
                                        }
                                        Column {
                                            Text(
                                                text = "${perf.attendancePercent}%",
                                                style = MaterialTheme.typography.headlineMedium,
                                                color = MaterialTheme.colorScheme.secondary
                                            )
                                            Text(
                                                text = "Attendance",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Dynamic Workspace Cards for all 9 Employee roles
                    val currentJobRole = jobRole?.trim() ?: ""
                    val isSubAdmin = userRole?.uppercase() == "SUB_ADMIN" || userRole?.uppercase() == "SUPER_ADMIN"
                    
                    when {
                        isSubAdmin || currentJobRole.contains("Service Coordinator", ignoreCase = true) -> {
                            item { ServiceCoordinatorWorkspace() }
                        }
                        currentJobRole.contains("Site Survey", ignoreCase = true) -> {
                            item { SiteSurveyWorkspace() }
                        }
                        currentJobRole.contains("Design", ignoreCase = true) -> {
                            item { SolarDesignWorkspace() }
                        }
                        currentJobRole.contains("Electrical", ignoreCase = true) -> {
                            item { ElectricalEngineerWorkspace() }
                        }
                        currentJobRole.contains("Inventory", ignoreCase = true) -> {
                            item { InventoryExecutiveWorkspace() }
                        }
                        currentJobRole.contains("O&M", ignoreCase = true) || currentJobRole.contains("Maintenance", ignoreCase = true) -> {
                            item { OmTechnicianWorkspace() }
                        }
                        currentJobRole.contains("Service Engineer", ignoreCase = true) -> {
                            item { ServiceEngineerWorkspace() }
                        }
                        currentJobRole.contains("Monitoring", ignoreCase = true) || currentJobRole.contains("Analyst", ignoreCase = true) -> {
                            item { MonitoringAnalystWorkspace() }
                        }
                        currentJobRole.contains("Intern", ignoreCase = true) -> {
                            item { InternWorkspace() }
                        }
                    }
                    
                    // Active Tasks
                    item {
                        SwayogCard {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "My Tasks",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    TextButton(onClick = onNavigateToTasks) {
                                        Text("View All")
                                    }
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                if (activeTasks.isEmpty()) {
                                    Text(
                                        text = "No active tasks",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                } else {
                                    activeTasks.take(3).forEach { task ->
                                        TaskItem(task = task)
                                        Spacer(modifier = Modifier.height(8.dp))
                                    }
                                }
                            }
                        }
                    }
                    
                    // Quick Work Update
                    item {
                        SwayogCard {
                            Column {
                                Text(
                                    text = "Quick Work Update",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                OutlinedTextField(
                                    value = workDescription,
                                    onValueChange = { workDescription = it },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(120.dp),
                                    placeholder = {
                                        Text("What are you working on right now?")
                                    },
                                    minLines = 3,
                                    maxLines = 5
                                )
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                SwayogButton(
                                    text = "Send Update",
                                    onClick = {
                                        if (workDescription.isNotBlank()) {
                                            viewModel.saveWorkDescription(workDescription)
                                            workDescription = ""
                                        }
                                    },
                                    enabled = workDescription.isNotBlank()
                                )
                            }
                        }
                    }
                    
                    // Logout Button
                    item {
                        SwayogButton(
                            text = "Logout",
                            onClick = onLogout,
                            variant = ButtonVariant.Secondary
                        )
                    }
                    
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun TaskItem(task: com.swayog.employee.data.model.Task) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = task.jobType,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = task.customerName,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Text(
                    text = task.scheduledTime,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
        }
    }
}

// ─── Workspace Sub-Composables for 9 Job Roles ───────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceCoordinatorWorkspace() {
    val context = LocalContext.current
    var selectedTech by remember { mutableStateOf("Nishank Zade") }
    var selectedTicket by remember { mutableStateOf("Growatt Inverter fault at Baner") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Map, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Service Coordinator Desk",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Live Inverters: 12 Active | 1 Faulty",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            Text("Assign Crew Ticket:", style = MaterialTheme.typography.bodySmall)
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = selectedTech,
                onValueChange = { selectedTech = it },
                label = { Text("Technician") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = selectedTicket,
                onValueChange = { selectedTicket = it },
                label = { Text("Complaint Ticket") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Dispatch Crew",
                onClick = {
                    Toast.makeText(context, "Dispatched $selectedTech to $selectedTicket", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun SiteSurveyWorkspace() {
    val context = LocalContext.current
    var widthStr by remember { mutableStateOf("30") }
    var lengthStr by remember { mutableStateOf("20") }
    var roofType by remember { mutableStateOf("Concrete") }
    
    val calculatedKw = remember(widthStr, lengthStr) {
        val w = widthStr.toDoubleOrNull() ?: 0.0
        val l = lengthStr.toDoubleOrNull() ?: 0.0
        (w * l * 10.0) / 1000.0
    }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Roofing, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Rooftop Survey Intake",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = widthStr,
                    onValueChange = { widthStr = it },
                    label = { Text("Width (ft)") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = lengthStr,
                    onValueChange = { lengthStr = it },
                    label = { Text("Length (ft)") },
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Estimated System Size: ${"%.2f".format(calculatedKw)} KW",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.secondary
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = roofType,
                onValueChange = { roofType = it },
                label = { Text("Roof Structure Type") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Save Rooftop Survey",
                onClick = {
                    Toast.makeText(context, "Survey details saved. Capacity: $calculatedKw KW", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun SolarDesignWorkspace() {
    val context = LocalContext.current
    var panelCount by remember { mutableStateOf("16") }
    var inverterModel by remember { mutableStateOf("Growatt 6000-TL") }
    var tiltAngle by remember { mutableStateOf("15") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.DesignServices, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Technical Drawing Desks",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = panelCount,
                onValueChange = { panelCount = it },
                label = { Text("Panel Quantity") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = inverterModel,
                onValueChange = { inverterModel = it },
                label = { Text("Inverter Model Specs") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = tiltAngle,
                onValueChange = { tiltAngle = it },
                label = { Text("Tilt Angle (Degrees)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Upload CAD Blueprint & SLD",
                onClick = {
                    Toast.makeText(context, "Blueprints uploaded successfully", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun ElectricalEngineerWorkspace() {
    val context = LocalContext.current
    var pitResistance by remember { mutableStateOf("1.8") }
    var meggerInsulation by remember { mutableStateOf("500") }
    var netMeterId by remember { mutableStateOf("MTR-SW-90242") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "System Commissioning Desk",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = pitResistance,
                onValueChange = { pitResistance = it },
                label = { Text("Earthing Pit Resistance (Ohms)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = meggerInsulation,
                onValueChange = { meggerInsulation = it },
                label = { Text("Megger Insulation (MΩ)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = netMeterId,
                onValueChange = { netMeterId = it },
                label = { Text("Net-Meter Serial Number") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Verify & Grid Sync System",
                onClick = {
                    val ohms = pitResistance.toDoubleOrNull() ?: 0.0
                    if (ohms >= 2.0) {
                        Toast.makeText(context, "Warning: Earthing resistance is high (>2.0 Ohms)!", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(context, "Electrical commissioning checks complete. System synced!", Toast.LENGTH_LONG).show()
                    }
                }
            )
        }
    }
}

@Composable
fun InventoryExecutiveWorkspace() {
    val context = LocalContext.current
    var itemCode by remember { mutableStateOf("GW-INV-6K-408") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Inventory, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Warehouse Terminal",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "STOCK ALERT:",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error
            )
            Text(
                text = "• Solar Panels: 120 Units (Normal)\n• Inverters: 3 Units (Critical Low!)\n• ACDB Boxes: 2 Units (Low)",
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = itemCode,
                onValueChange = { itemCode = it },
                label = { Text("QR Serial / Barcode") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Dispatch & Adjust Stock",
                onClick = {
                    Toast.makeText(context, "Item $itemCode dispatched to coordinator", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun OmTechnicianWorkspace() {
    val context = LocalContext.current
    var beforePhoto by remember { mutableStateOf(false) }
    var afterPhoto by remember { mutableStateOf(false) }
    var washed by remember { mutableStateOf(false) }
    var clampsTightened by remember { mutableStateOf(false) }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Build, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "O&M Cleaning Checklist",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { beforePhoto = true },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (beforePhoto) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.surfaceVariant
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(if (beforePhoto) "Before Photo Captured" else "Take Before Photo")
                }
                Button(
                    onClick = { afterPhoto = true },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (afterPhoto) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.surfaceVariant
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(if (afterPhoto) "After Photo Captured" else "Take After Photo")
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = washed, onCheckedChange = { washed = it })
                Text("Dust & Dirt Washed Thoroughly", style = MaterialTheme.typography.bodySmall)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = clampsTightened, onCheckedChange = { clampsTightened = it })
                Text("Structural Clamps Tightened", style = MaterialTheme.typography.bodySmall)
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Submit AMC Wash Report",
                enabled = beforePhoto && afterPhoto && washed && clampsTightened,
                onClick = {
                    Toast.makeText(context, "AMC Washing site submission completed successfully!", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun ServiceEngineerWorkspace() {
    val context = LocalContext.current
    var summary by remember { mutableStateOf("") }
    var partsUsed by remember { mutableStateOf("Growatt Fuse 15A") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Engineering, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Resolution Desk & Repair Guides",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Growatt Error 117 Guide: Check AC output voltage. If >253V, contact grid coordinator.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = summary,
                onValueChange = { summary = it },
                label = { Text("Repair Summary notes") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = partsUsed,
                onValueChange = { partsUsed = it },
                label = { Text("Spare Parts Exchanged") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Sign-off & Resolve Complaint",
                onClick = {
                    Toast.makeText(context, "Customer signed off. Spare parts logged: $partsUsed", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun MonitoringAnalystWorkspace() {
    val context = LocalContext.current
    var whatsappNumber by remember { mutableStateOf("+91 9988776655") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.MonitorHeart, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Generation Telemetry Alert Desk",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "SYSTEM ALERT: growatt-baner generation drop > 25% today.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = whatsappNumber,
                onValueChange = { whatsappNumber = it },
                label = { Text("Notify Client via Phone") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Open WhatsApp Alert Message",
                onClick = {
                    Toast.makeText(context, "Drafting alert link to client phone $whatsappNumber", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}

@Composable
fun InternWorkspace() {
    val context = LocalContext.current
    var learningReport by remember { mutableStateOf("") }
    var mentorName by remember { mutableStateOf("Senior Eng. Mayur") }
    var shadowHours by remember { mutableStateOf("4.5") }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.School, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Internship Log Desk",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = learningReport,
                onValueChange = { learningReport = it },
                label = { Text("Skills Shadowed & Learnings") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = mentorName,
                onValueChange = { mentorName = it },
                label = { Text("Assigned Senior Mentor") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            
            OutlinedTextField(
                value = shadowHours,
                onValueChange = { shadowHours = it },
                label = { Text("Shadow Hours Worked") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            SwayogButton(
                text = "Submit Shadow Log",
                onClick = {
                    Toast.makeText(context, "Log sent to $mentorName for review", Toast.LENGTH_LONG).show()
                }
            )
        }
    }
}
