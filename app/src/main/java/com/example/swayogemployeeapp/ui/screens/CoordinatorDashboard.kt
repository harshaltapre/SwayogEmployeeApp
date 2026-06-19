package com.example.swayogemployeeapp.ui.screens

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

    var searchQuery by remember { mutableStateOf("") }
    var selectedCity by remember { mutableStateOf("All Cities") }
    var selectedCustomerName by remember { mutableStateOf("John Doe") }
    var systemSize by remember { mutableStateOf("5.4 kW") }
    var inverterBrand by remember { mutableStateOf("Growatt") }
    var liveGeneration by remember { mutableStateOf(3.2) }
    var dailyYield by remember { mutableStateOf(18.4) }
    var statusOnline by remember { mutableStateOf(true) }

    var showCredentialsModal by remember { mutableStateOf(false) }
    var showAssignModal by remember { mutableStateOf(false) }

    // Mock Customer Data List
    val customersList = listOf(
        MockCustomer("John Doe", "SW-101", "Mumbai", "5.4 kW", "Growatt", "Online", 3.2, 18.4),
        MockCustomer("Jane Smith", "SW-204", "Delhi", "10.0 kW", "FoxESS", "Online", 6.8, 41.2),
        MockCustomer("Rajesh Kumar", "SW-302", "Mumbai", "3.3 kW", "UTL", "Offline", 0.0, 0.0),
        MockCustomer("Amit Patel", "SW-415", "Pune", "7.5 kW", "ShineMonitor", "Online", 4.5, 29.8)
    )

    // Filtered Customers
    val filteredCustomers = customersList.filter {
        (selectedCity == "All Cities" || it.city == selectedCity) &&
        (it.name.contains(searchQuery, ignoreCase = true) || it.code.contains(searchQuery, ignoreCase = true))
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
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
                    Text(selectedCustomerName, style = Typography.titleLarge, color = NeutralText, fontWeight = FontWeight.Bold)
                    Divider(color = BorderGray)
                    Text("System Size: $systemSize", style = Typography.bodyMedium, color = NeutralText)
                    Text("Inverter Brand: $inverterBrand", style = Typography.bodyMedium, color = NeutralText)
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
                            text = "${liveGeneration} kW",
                            style = Typography.displayLarge,
                            color = NeutralText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp
                        )
                    }
                    Text("Daily Yield: ${dailyYield} kWh", style = Typography.bodyMedium, color = MutedText)
                    Button(
                        onClick = {
                            // Simulate live generation fluctuation
                            liveGeneration = Math.round((2.8 + Math.random() * 2.0) * 10.0) / 10.0
                            dailyYield = Math.round((dailyYield + 0.5) * 10.0) / 10.0
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

        // Customer Search Directory Result List
        Text("CUSTOMER SEARCH DIRECTORY", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.weight(1f).fillMaxWidth()
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
                            .background(if (selectedCustomerName == customer.name) BackgroundDark else Color.Transparent)
                            .clickable {
                                selectedCustomerName = customer.name
                                systemSize = customer.size
                                inverterBrand = customer.brand
                                statusOnline = customer.status == "Online"
                                liveGeneration = customer.liveGen
                                dailyYield = customer.yield
                            }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(customer.name, color = NeutralText, fontWeight = FontWeight.Bold)
                            Text("${customer.code} • ${customer.city}", fontSize = 12.sp, color = MutedText)
                        }
                        Text(
                            text = customer.size,
                            color = PrimaryAmber,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }

    // Modal: Credentials Manager
    if (showCredentialsModal) {
        var userLoginId by remember { mutableStateOf("growatt_client_j") }
        var password by remember { mutableStateOf("••••••••") }
        var deviceSn by remember { mutableStateOf("SN-GWT98273") }
        var syncSuccess by remember { mutableStateOf<Boolean?>(null) }
        var testSyncing by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showCredentialsModal = false },
            title = { Text("Update Inverter Cloud Credentials", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Configure telemetry API settings for $inverterBrand cloud access.", color = NeutralText)
                    OutlinedTextField(
                        value = userLoginId,
                        onValueChange = { userLoginId = it },
                        label = { Text("API Login ID", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("API Password", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = deviceSn,
                        onValueChange = { deviceSn = it },
                        label = { Text("Inverter Serial Number (Datalogger SN)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    testSyncing.let {
                        if (it) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(color = PrimaryAmber, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Testing API connectivity...", color = MutedText, fontSize = 12.sp)
                            }
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
                        // Simulate credentials test-sync
                        coroutineScope.launch {
                            delay(1000)
                            testSyncing = false
                            syncSuccess = true
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

    // Modal: Task Assigner
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
