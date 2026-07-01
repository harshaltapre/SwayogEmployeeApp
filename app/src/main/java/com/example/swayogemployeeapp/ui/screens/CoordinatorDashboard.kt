package com.example.swayogemployeeapp.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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
fun CoordinatorDashboard(viewModel: MainViewModel) {
    val tasksState by viewModel.tasks.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    val customers by viewModel.customers.collectAsState()
    val customersLoading by viewModel.customersLoading.collectAsState()
    val inverterGeneration by viewModel.inverterGeneration.collectAsState()
    val inverterError by viewModel.inverterError.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedCity by remember { mutableStateOf("All Cities") }
    var selectedCustomerId by remember { mutableStateOf<Int?>(null) }

    var showCredentialsModal by remember { mutableStateOf(false) }
    var showAssignModal by remember { mutableStateOf(false) }
    var showVisitLogModal by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.fetchCustomers()
    }

    LaunchedEffect(customers) {
        if (selectedCustomerId == null && customers.isNotEmpty()) {
            selectedCustomerId = customers.first().id
        }
    }

    val selectedCustomer = remember(selectedCustomerId, customers) {
        customers.find { it.id == selectedCustomerId } ?: customers.firstOrNull()
    }

    LaunchedEffect(selectedCustomer?.id) {
        selectedCustomer?.id?.let { id ->
            viewModel.fetchCustomerSummary(id)
            viewModel.fetchInverterGeneration(id)
        }
    }

    // Filtered Customers
    val filteredCustomers = remember(customers, searchQuery, selectedCity) {
        customers.filter {
            val nameMatch = it.name?.contains(searchQuery, ignoreCase = true) == true ||
                    it.fullName?.contains(searchQuery, ignoreCase = true) == true ||
                    it.customerCode?.contains(searchQuery, ignoreCase = true) == true
            val cityMatch = selectedCity == "All Cities" || it.city?.equals(selectedCity, ignoreCase = true) == true
            nameMatch && cityMatch
        }
    }

    // Analytics derived from tasks
    val amcTasks = tasksState.filter { it.jobType == "AMC Visit" }
    val completedAmc = amcTasks.count { it.status == "completed" }
    val totalAmc = amcTasks.size.coerceAtLeast(1)
    val amcProgressPercent = if (totalAmc > 0) (completedAmc * 100 / totalAmc) else 0

    val complaintTasks = tasksState.filter { it.jobType == "Complaint" }
    val resolvedComplaints = complaintTasks.count { it.status == "completed" }
    val pendingComplaints = complaintTasks.count { it.status != "completed" }
    val totalComplaints = complaintTasks.size.coerceAtLeast(1)

    // Mock visit log entries
    val visitLogEntries = listOf(
        VisitLogEntry("Jun 18", "SW-101", "John Doe", "AMC Cleaning", "Completed", "Rajesh K."),
        VisitLogEntry("Jun 17", "SW-204", "Jane Smith", "Complaint #117", "Resolved", "Deepak R."),
        VisitLogEntry("Jun 16", "SW-302", "Rajesh Kumar", "Survey", "Pending Review", "Survey Team"),
        VisitLogEntry("Jun 15", "SW-415", "Amit Patel", "Installation", "Completed", "Electrical Team"),
        VisitLogEntry("Jun 14", "SW-101", "John Doe", "AMC Cleaning", "Completed", "Rajesh K."),
        VisitLogEntry("Jun 13", "SW-204", "Jane Smith", "Service", "Completed", "Deepak R.")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // ── Analytics Summary Row ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // AMC Progress Card
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier.weight(1f)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("AMC PROGRESS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                    Text(
                        text = "$completedAmc / $totalAmc Visits",
                        style = Typography.bodyMedium,
                        color = if (amcProgressPercent >= 80) SuccessGreen else PrimaryAmber,
                        fontWeight = FontWeight.Bold
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(50.dp)) {
                            CircularProgressIndicator(
                                progress = amcProgressPercent / 100f,
                                modifier = Modifier.fillMaxSize(),
                                color = if (amcProgressPercent >= 80) SuccessGreen else PrimaryAmber,
                                strokeWidth = 5.dp,
                                trackColor = BackgroundDark
                            )
                            Text(
                                text = "$amcProgressPercent%",
                                color = NeutralText,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column {
                            Text(
                                text = "$completedAmc Done",
                                color = SuccessGreen,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${(totalAmc - completedAmc).coerceAtLeast(0)} Pending",
                                color = if (totalAmc - completedAmc > 0) PrimaryAmber else MutedText,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Complaints Analytics Card
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier.weight(1f)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("COMPLAINTS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(SuccessGreen)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Resolved: $resolvedComplaints", fontSize = 12.sp, color = SuccessGreen, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color.Red)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Pending: $pendingComplaints", fontSize = 12.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                            }
                        }
                        // Mini resolution ratio
                        Text(
                            text = "${if (totalComplaints > 0) resolvedComplaints * 100 / totalComplaints else 0}%",
                            style = Typography.headlineMedium,
                            color = SuccessGreen,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Search and Filter Bar
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search customer name or code...", color = MutedText) },
                    leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("All Cities", "Mumbai", "Delhi", "Pune").forEach { city ->
                        val isSelected = selectedCity == city
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) PrimaryAmber else BackgroundDark)
                                .border(1.dp, if (isSelected) PrimaryAmber else BorderGray, RoundedCornerShape(8.dp))
                                .clickable { selectedCity = city }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = city,
                                color = if (isSelected) BackgroundDark else NeutralText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }

        // Selected Customer Info and Inverter Panel Row
        val statusOnline = inverterGeneration != null && inverterError == null
        val liveGen = inverterGeneration?.peakPower ?: 0.0
        val yieldGen = inverterGeneration?.dailyGeneration ?: 0.0

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Left Card: Customer Details
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier.weight(1f)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("SELECTED CUSTOMER INFO", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                    Text(selectedCustomer?.displayName() ?: "No Selection", style = Typography.titleLarge, color = NeutralText, fontWeight = FontWeight.Bold)
                    Divider(color = BorderGray)
                    Text("System Size: ${selectedCustomer?.systemSizeKw?.let { "$it kW" } ?: "N/A"}", style = Typography.bodyMedium, color = NeutralText)
                    Text("Inverter Brand: ${selectedCustomer?.inverterBrand ?: "N/A"}", style = Typography.bodyMedium, color = NeutralText)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Status: ", style = Typography.bodyMedium, color = MutedText)
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (statusOnline) SuccessGreen else Color.Red)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (statusOnline) "Online" else "Offline",
                            style = Typography.bodyMedium,
                            color = if (statusOnline) SuccessGreen else Color.Red,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Right Card: Telemetry API Stats
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier.weight(1.2f)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("LIVE INVERTER GENERATION", style = Typography.labelSmall, color = EngineeringBlue, fontWeight = FontWeight.Bold)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(28.dp))
                        Text(
                            text = "${liveGen} kW",
                            style = Typography.displayLarge,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp
                        )
                    }
                    Text("Daily Yield: ${yieldGen} kWh", style = Typography.bodyMedium, color = MutedText)
                    
                    if (inverterError != null) {
                        Text(inverterError!!, color = Color.Red, fontSize = 10.sp)
                    }

                    Button(
                        onClick = {
                            selectedCustomer?.id?.let { id ->
                                viewModel.fetchInverterGeneration(id)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BackgroundDark),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth().height(36.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Refresh", color = PrimaryAmber, fontSize = 11.sp)
                    }
                }
            }
        }

        // Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { showCredentialsModal = true },
                colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Icon(imageVector = Icons.Default.Key, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Edit Credentials", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { showAssignModal = true },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Icon(imageVector = Icons.Default.PersonAdd, contentDescription = null, tint = BackgroundDark)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Assign Field Task", color = BackgroundDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Visit Log Button
        Button(
            onClick = { showVisitLogModal = true },
            colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(44.dp)
        ) {
            Icon(imageVector = Icons.Default.TableChart, contentDescription = null, tint = EngineeringBlue)
            Spacer(modifier = Modifier.width(8.dp))
            Text("View Visit Log Table", color = NeutralText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        // Customer Search Directory Result List
        Text("CUSTOMER SEARCH DIRECTORY", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth().height(220.dp)
        ) {
            LazyColumn(
                modifier = Modifier.padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredCustomers) { customer ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (selectedCustomerId == customer.id) BackgroundDark else Color.Transparent)
                            .clickable {
                                selectedCustomerId = customer.id
                            }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(customer.displayName(), color = NeutralText, fontWeight = FontWeight.Bold)
                            Text("${customer.customerCode ?: "SW"} • ${customer.city ?: ""}", fontSize = 12.sp, color = MutedText)
                        }
                        Text(
                            text = customer.systemSizeKw?.let { "$it kW" } ?: "TBD",
                            color = PrimaryAmber,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }

    // ── Modal: Credentials Manager with Copy Buttons ──
    if (showCredentialsModal && selectedCustomer != null) {
        var selectedBrand by remember { mutableStateOf(selectedCustomer.inverterBrand ?: "Growatt") }
        var userLoginId by remember { mutableStateOf(selectedCustomer.inverterLoginId ?: "") }
        var password by remember { mutableStateOf(selectedCustomer.inverterPassword ?: "") }
        var deviceSn by remember { mutableStateOf(selectedCustomer.inverterDeviceSn ?: "") }
        var apiKey by remember { mutableStateOf(selectedCustomer.inverterApiKey ?: "") }
        var syncSuccess by remember { mutableStateOf<Boolean?>(null) }
        var testSyncing by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showCredentialsModal = false },
            title = { Text("Update Inverter Cloud Credentials", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Configure telemetry API settings for ${selectedCustomer.displayName()} cloud access.", color = NeutralText)

                    // Brand Selection
                    OutlinedTextField(
                        value = selectedBrand,
                        onValueChange = { selectedBrand = it },
                        label = { Text("Inverter Brand (e.g. Growatt, FoxESS)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Login ID
                    OutlinedTextField(
                        value = userLoginId,
                        onValueChange = { userLoginId = it },
                        label = { Text("API Login ID / Username", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Password
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("API Password", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Device SN
                    OutlinedTextField(
                        value = deviceSn,
                        onValueChange = { deviceSn = it },
                        label = { Text("Datalogger SN / Inverter Serial No.", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // API Key / Portal URL
                    OutlinedTextField(
                        value = apiKey,
                        onValueChange = { apiKey = it },
                        label = { Text("API Key / Developer Key (Optional)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (testSyncing) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(color = PrimaryAmber, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Testing API connectivity...", color = MutedText, fontSize = 12.sp)
                        }
                    }
                    syncSuccess?.let {
                        Text(
                            text = if (it) "Connection successful! Telemetry API is active." else "Connection failed. Please check inputs.",
                            color = if (it) SuccessGreen else Color.Red,
                            fontSize = 12.sp
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        testSyncing = true
                        syncSuccess = null
                        viewModel.updateCustomerCredentials(
                            customerId = selectedCustomer.id,
                            brand = selectedBrand.ifBlank { null },
                            loginId = userLoginId.ifBlank { null },
                            password = password.ifBlank { null },
                            apiKey = apiKey.ifBlank { null },
                            deviceSn = deviceSn.ifBlank { null }
                        ) { success, errorMsg ->
                            testSyncing = false
                            syncSuccess = success
                            if (success) {
                                Toast.makeText(context, "Credentials updated and verified!", Toast.LENGTH_SHORT).show()
                                showCredentialsModal = false
                            } else {
                                Toast.makeText(context, errorMsg ?: "Verification failed", Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                ) {
                    Text("TEST & SAVE", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCredentialsModal = false }) {
                    Text("CLOSE", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }

    // ── Modal: Visit Log Table ──
    if (showVisitLogModal) {
        AlertDialog(
            onDismissRequest = { showVisitLogModal = false },
            title = { Text("Field Visit Log", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth().height(300.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Table Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BackgroundDark)
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Date", color = PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.8f))
                        Text("Code", color = PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.7f))
                        Text("Type", color = PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text("Status", color = PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.9f))
                        Text("Crew", color = PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.9f))
                    }
                    Divider(color = BorderGray)

                    // Table Rows
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        items(visitLogEntries) { entry ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(entry.date, color = NeutralText, fontSize = 10.sp, modifier = Modifier.weight(0.8f))
                                Text(entry.code, color = MutedText, fontSize = 10.sp, modifier = Modifier.weight(0.7f))
                                Text(entry.visitType, color = NeutralText, fontSize = 10.sp, modifier = Modifier.weight(1f))
                                Text(
                                    entry.status,
                                    color = if (entry.status == "Completed" || entry.status == "Resolved") SuccessGreen else PrimaryAmber,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.weight(0.9f)
                                )
                                Text(entry.crew, color = MutedText, fontSize = 10.sp, modifier = Modifier.weight(0.9f))
                            }
                            Divider(color = BorderGray.copy(alpha = 0.3f))
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { showVisitLogModal = false },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
                ) {
                    Text("CLOSE", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = SurfaceDark
        )
    }

    // ── Modal: Task Assigner ──
    if (showAssignModal) {
        var jobType by remember { mutableStateOf("Survey") }
        var description by remember { mutableStateOf("Perform roof shading analysis and take surface photos.") }
        var targetName by remember { mutableStateOf("John Doe") }
        var targetPhone by remember { mutableStateOf("+91 98765 43210") }
        var address by remember { mutableStateOf("402 Apex Towers, Andheri, Mumbai") }
        var selectedRoleName by remember { mutableStateOf("Site Survey Engineer") }

        AlertDialog(
            onDismissRequest = { showAssignModal = false },
            title = { Text("Assign Task to Crew", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Deploy a task locally to Room to populate lists for specific engineers.", color = MutedText)

                    // Job Type Selection
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Survey", "Complaint", "AMC Visit", "Service").forEach { type ->
                            val active = jobType == type
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (active) PrimaryAmber else BackgroundDark)
                                    .clickable { jobType = type }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(type, color = if (active) BackgroundDark else NeutralText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    OutlinedTextField(
                        value = targetName,
                        onValueChange = { targetName = it },
                        label = { Text("Customer Name", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Task Description", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Site Address", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val generatedId = (1000 + Math.random() * 9000).toInt()
                        val newTask = EmployeeTaskEntity(
                            id = generatedId,
                            jobType = jobType,
                            description = description,
                            scheduledTime = java.time.Instant.now().toString(),
                            status = "assigned",
                            customerName = targetName,
                            customerPhone = targetPhone,
                            address = address,
                            latitude = 19.123456,
                            longitude = 72.890123,
                            completionMessage = null,
                            completionDocumentUrl = null,
                            completedAt = null
                        )
                        viewModel.assignTaskLocally(newTask)
                        showAssignModal = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
                ) {
                    Text("DEPLOY TASK", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAssignModal = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

/** Copies text to system clipboard and shows a Toast. */
private fun copyToClipboard(context: Context, label: String, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, text))
    Toast.makeText(context, "$label copied to clipboard", Toast.LENGTH_SHORT).show()
}

data class MockCustomer(
    val name: String,
    val code: String,
    val city: String,
    val size: String,
    val brand: String,
    val status: String,
    val liveGen: Double,
    val yield: Double
)

data class VisitLogEntry(
    val date: String,
    val code: String,
    val customer: String,
    val visitType: String,
    val status: String,
    val crew: String
)
