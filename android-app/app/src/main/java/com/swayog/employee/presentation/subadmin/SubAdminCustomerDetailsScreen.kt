package com.swayog.employee.presentation.subadmin

import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.*
import com.swayog.employee.presentation.common.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminCustomerDetailsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SubAdminCustomerDetailsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val summaryState by viewModel.summaryState.collectAsState()
    val generationState by viewModel.generationState.collectAsState()
    val historyState by viewModel.historyState.collectAsState()
    val updateState by viewModel.credentialsUpdateState.collectAsState()
    val scheduleState by viewModel.scheduleActionState.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    var isEditOpen by remember { mutableStateOf(false) }
    var isScheduleDialogOpen by remember { mutableStateOf(false) }

    LaunchedEffect(updateState) {
        when (updateState) {
            is CredentialsUpdateState.Success -> {
                Toast.makeText(context, "Credentials updated successfully!", Toast.LENGTH_SHORT).show()
                isEditOpen = false
                viewModel.resetUpdateState()
            }
            is CredentialsUpdateState.Error -> {
                Toast.makeText(context, (updateState as CredentialsUpdateState.Error).message, Toast.LENGTH_LONG).show()
                viewModel.resetUpdateState()
            }
            else -> {}
        }
    }

    LaunchedEffect(scheduleState) {
        when (scheduleState) {
            is ScheduleActionState.Success -> {
                Toast.makeText(context, (scheduleState as ScheduleActionState.Success).message, Toast.LENGTH_SHORT).show()
                isScheduleDialogOpen = false
                viewModel.resetScheduleActionState()
            }
            is ScheduleActionState.Error -> {
                Toast.makeText(context, (scheduleState as ScheduleActionState.Error).message, Toast.LENGTH_LONG).show()
                viewModel.resetScheduleActionState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Customer Details",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        when (val state = summaryState) {
            is CustomerDetailsState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is CustomerDetailsState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = state.message, color = MaterialTheme.colorScheme.error)
                }
            }
            is CustomerDetailsState.Success -> {
                val customerSummary = state.data
                val customer = customerSummary.customer
                
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // Header Card
                    CustomerHeader(customer = customer)

                    // Tabs
                    TabRow(selectedTabIndex = selectedTab) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("Overview") }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = { Text("Inverter") }
                        )
                        Tab(
                            selected = selectedTab == 2,
                            onClick = { selectedTab = 2 },
                            text = { Text("AMC") }
                        )
                    }

                    // Content Area
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                    ) {
                        when (selectedTab) {
                            0 -> OverviewTabContent(
                                customerSummary = customerSummary,
                                onEditClick = { isEditOpen = true }
                            )
                            1 -> InverterTabContent(
                                generationState = generationState,
                                historyState = historyState,
                                onPeriodChange = { viewModel.loadHistory(it) }
                            )
                            2 -> AmcTabContent(
                                customer = customer,
                                onScheduleClick = { isScheduleDialogOpen = true }
                            )
                        }
                    }
                }

                if (isEditOpen) {
                    EditCredentialsDialog(
                        customer = customer,
                        onDismiss = { isEditOpen = false },
                        onSubmit = { brand, user, pass, api, sn, city, addr, stage ->
                            viewModel.updateCredentials(
                                inverterBrand = brand,
                                inverterLoginId = user,
                                inverterPassword = pass,
                                inverterApiKey = api,
                                inverterDeviceSn = sn,
                                city = city,
                                address = addr,
                                projectStage = stage
                            )
                        },
                        isLoading = updateState is CredentialsUpdateState.Loading
                    )
                }

                if (isScheduleDialogOpen) {
                    val employees by viewModel.employees.collectAsState()
                    ScheduleAmcVisitDialog(
                        customer = customer,
                        employees = employees,
                        onDismiss = { isScheduleDialogOpen = false },
                        onSubmit = { date, time, employee, notes ->
                            viewModel.scheduleAmcVisit(date, time, employee, notes)
                        },
                        isLoading = scheduleState is ScheduleActionState.Loading
                    )
                }
            }
        }
    }
}

@Composable
fun CustomerHeader(customer: Customer) {
    Surface(
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = customer.fullName,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = customer.customerCode,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Surface(
                    color = Color(0xFFF59E0B).copy(alpha = 0.15f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "Stage ${customer.projectStage}",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFD97706)
                    )
                }
            }
        }
    }
}

@Composable
fun OverviewTabContent(
    customerSummary: CustomerSummary,
    onEditClick: () -> Unit
) {
    val customer = customerSummary.customer
    val stats = customerSummary.serviceRequestStats

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Contact Details Card
        SwayogCard {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Contact Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                DetailRow(icon = Icons.Default.Email, label = "Email", value = customer.email)
                DetailRow(icon = Icons.Default.Phone, label = "Phone", value = customer.phoneNumber)
                DetailRow(icon = Icons.Default.LocationOn, label = "Address", value = "${customer.address}, ${customer.city}")
            }
        }

        // Service Stats Card
        SwayogCard {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Service Ticket Analytics",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatBox(label = "Total Issues", value = stats.total.toString(), color = MaterialTheme.colorScheme.primary)
                    StatBox(label = "Pending", value = stats.pending.toString(), color = Color(0xFFEF4444))
                    StatBox(label = "Scheduled", value = stats.inProgress.toString(), color = Color(0xFF3B82F6))
                    StatBox(label = "Resolved", value = stats.completed.toString(), color = Color(0xFF10B981))
                }
            }
        }

        // Credentials Card
        SwayogCard {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Inverter Credentials",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onEditClick) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Credentials", tint = MaterialTheme.colorScheme.primary)
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))

                DetailRow(icon = Icons.Default.Settings, label = "Brand", value = customer.inverterBrand ?: "Not Specified")
                DetailRow(icon = Icons.Default.QrCode, label = "Device SN", value = customer.inverterDeviceSn ?: "Not Linked")
                DetailRow(icon = Icons.Default.VpnKey, label = "API Key", value = customer.inverterApiKey ?: "Not Configured")
                DetailRow(icon = Icons.Default.AccountCircle, label = "Login ID", value = customer.inverterLoginId ?: "Not Configured")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InverterTabContent(
    generationState: CustomerDetailsState<InverterGeneration>,
    historyState: CustomerDetailsState<List<GenerationHistory>>,
    onPeriodChange: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live Telemetry Card
        when (val gen = generationState) {
            is CustomerDetailsState.Loading -> {
                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is CustomerDetailsState.Error -> {
                Text(text = "Failed to load telemetry data.", color = MaterialTheme.colorScheme.error)
            }
            is CustomerDetailsState.Success -> {
                val data = gen.data
                val statusColor = if (data.status.lowercase() == "online") Color(0xFF10B981) else Color(0xFFEF4444)
                
                SwayogCard {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Live Generation Status",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .background(statusColor, CircleShape)
                                )
                                Text(
                                    text = data.status.uppercase(),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = statusColor
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            TelemetryBox(label = "Current Power", value = "${data.currentPower} kW", modifier = Modifier.weight(1f))
                            TelemetryBox(label = "Today", value = "${data.todayGeneration} kWh", modifier = Modifier.weight(1f))
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            TelemetryBox(label = "This Month", value = "${data.monthlyGeneration} kWh", modifier = Modifier.weight(1f))
                            TelemetryBox(label = "Total Life", value = "${data.totalGeneration} kWh", modifier = Modifier.weight(1f))
                        }
                    }
                }

            }
        }

        // History Chart Card
        SwayogCard {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Generation History",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    var periodSelected by remember { mutableStateOf("monthly") }
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        FilterChip(
                            selected = periodSelected == "daily",
                            onClick = { periodSelected = "daily"; onPeriodChange("daily") },
                            label = { Text("Day") }
                        )
                        FilterChip(
                            selected = periodSelected == "monthly",
                            onClick = { periodSelected = "monthly"; onPeriodChange("monthly") },
                            label = { Text("Month") }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                when (val hist = historyState) {
                    is CustomerDetailsState.Loading -> {
                        Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is CustomerDetailsState.Error -> {
                        Text(text = "Failed to load history list.")
                    }
                    is CustomerDetailsState.Success -> {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            hist.data.take(10).forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(text = item.label.ifBlank { item.date }, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(text = "${item.generation} kWh", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp)
                                        if (item.power != null) {
                                            Text(text = "Power: ${item.power} kW", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), fontSize = 10.sp)
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
}

@Composable
fun AmcTabContent(
    customer: Customer,
    onScheduleClick: () -> Unit
) {
    val statusUpper = customer.amcStatus.uppercase()
    val (statusColor, statusBg) = when (statusUpper) {
        "ACTIVE" -> Color(0xFF10B981) to Color(0xFFD1FAE5)
        "EXPIRED" -> Color(0xFFEF4444) to Color(0xFFFEE2E2)
        else -> Color(0xFF6B7280) to Color(0xFFF3F4F6)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        SwayogCard {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "AMC Contract Summary",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Contract Status", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    Surface(color = statusBg, shape = RoundedCornerShape(8.dp)) {
                        Text(
                            text = customer.amcStatus.replaceFirstChar { it.uppercase() },
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                }

                DetailRow(icon = Icons.Default.CalendarToday, label = "AMC Expiry Date", value = customer.amcExpiryDate ?: "No Contract Listed")
                DetailRow(icon = Icons.Default.Construction, label = "Installation Date", value = customer.installationDate)
                DetailRow(icon = Icons.Default.Event, label = "Warranty Expiry", value = customer.warrantyExpiry ?: "Expired / Out of Warranty")

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = onScheduleClick,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.CalendarToday, contentDescription = "Schedule Visit")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Schedule AMC Visit")
                }
            }
        }
    }
}

@Composable
fun DetailRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.7f), modifier = Modifier.size(20.dp))
        Column {
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            Text(text = value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun StatBox(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = color)
        Text(text = label, style = MaterialTheme.typography.labelSmall, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
    }
}

@Composable
fun TelemetryBox(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditCredentialsDialog(
    customer: Customer,
    onDismiss: () -> Unit,
    onSubmit: (String?, String?, String?, String?, String?, String?, String?, Int?) -> Unit,
    isLoading: Boolean
) {
    var brand by remember { mutableStateOf(customer.inverterBrand ?: "") }
    var sn by remember { mutableStateOf(customer.inverterDeviceSn ?: "") }
    var apiKey by remember { mutableStateOf(customer.inverterApiKey ?: "") }
    var loginId by remember { mutableStateOf(customer.inverterLoginId ?: "") }
    var password by remember { mutableStateOf(customer.inverterPassword ?: "") }
    var city by remember { mutableStateOf(customer.city) }
    var address by remember { mutableStateOf(customer.address) }
    var stage by remember { mutableIntStateOf(customer.projectStage) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Edit Credentials",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(value = brand, onValueChange = { brand = it }, label = { Text("Inverter Brand") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = sn, onValueChange = { sn = it }, label = { Text("Device SN") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = apiKey, onValueChange = { apiKey = it }, label = { Text("API Key") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = loginId, onValueChange = { loginId = it }, label = { Text("Login ID") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Address") }, modifier = Modifier.fillMaxWidth())
                
                Column {
                    Text(text = "Project Stage: $stage", style = MaterialTheme.typography.labelMedium)
                    Slider(
                        value = stage.toFloat(),
                        onValueChange = { stage = it.toInt() },
                        valueRange = 0f..4f,
                        steps = 3
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isLoading) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            onSubmit(
                                brand.ifBlank { null },
                                loginId.ifBlank { null },
                                password.ifBlank { null },
                                apiKey.ifBlank { null },
                                sn.ifBlank { null },
                                city,
                                address,
                                stage
                            )
                        },
                        enabled = !isLoading
                    ) {
                        if (isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                        else Text("Save Changes")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleAmcVisitDialog(
    customer: Customer,
    employees: List<User>,
    onDismiss: () -> Unit,
    onSubmit: (String, String?, String?, String?) -> Unit,
    isLoading: Boolean
) {
    var scheduledDate by remember { mutableStateOf("") }
    var timeSlot by remember { mutableStateOf("") }
    var assignedEmployeeId by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    var isEmployeeDropdownExpanded by remember { mutableStateOf(false) }
    var selectedEmployeeName by remember { mutableStateOf("") }
    var isDatePickerOpen by remember { mutableStateOf(false) }

    if (isDatePickerOpen) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { isDatePickerOpen = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).apply {
                                timeZone = java.util.TimeZone.getTimeZone("UTC")
                            }
                            scheduledDate = sdf.format(java.util.Date(millis))
                        }
                        isDatePickerOpen = false
                    }
                ) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { isDatePickerOpen = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Schedule AMC Visit",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "Customer: ${customer.fullName} (${customer.customerCode})",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(4.dp))

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = scheduledDate,
                        onValueChange = {},
                        label = { Text("Scheduled Date (YYYY-MM-DD)") },
                        placeholder = { Text("Select date...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isDatePickerOpen = true },
                        enabled = false,
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        trailingIcon = {
                            IconButton(onClick = { isDatePickerOpen = true }) {
                                Icon(Icons.Default.CalendarToday, contentDescription = "Select Date")
                            }
                        }
                    )
                }

                OutlinedTextField(
                    value = timeSlot,
                    onValueChange = { timeSlot = it },
                    label = { Text("Time Slot (Optional)") },
                    placeholder = { Text("e.g. 10:00 AM") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = if (selectedEmployeeName.isNotBlank()) "$selectedEmployeeName (${assignedEmployeeId})" else "",
                        onValueChange = {},
                        label = { Text("Assign Employee (Optional)") },
                        placeholder = { Text("Select employee...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isEmployeeDropdownExpanded = true },
                        enabled = false,
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        trailingIcon = {
                            IconButton(onClick = { isEmployeeDropdownExpanded = true }) {
                                Icon(
                                    imageVector = if (isEmployeeDropdownExpanded) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                                    contentDescription = "Toggle Dropdown"
                                )
                            }
                        }
                    )

                    DropdownMenu(
                        expanded = isEmployeeDropdownExpanded,
                        onDismissRequest = { isEmployeeDropdownExpanded = false },
                        modifier = Modifier.fillMaxWidth(0.9f)
                    ) {
                        DropdownMenuItem(
                            text = { Text("Unassigned") },
                            onClick = {
                                assignedEmployeeId = ""
                                selectedEmployeeName = ""
                                isEmployeeDropdownExpanded = false
                            }
                        )
                        employees.forEach { employee ->
                            DropdownMenuItem(
                                text = { Text("${employee.fullName} (${employee.employeeCode ?: "No Code"})") },
                                onClick = {
                                    assignedEmployeeId = employee.id
                                    selectedEmployeeName = employee.fullName
                                    isEmployeeDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") },
                    placeholder = { Text("Additional notes...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isLoading) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            onSubmit(
                                scheduledDate,
                                timeSlot.ifBlank { null },
                                assignedEmployeeId.ifBlank { null },
                                notes.ifBlank { null }
                            )
                        },
                        enabled = scheduledDate.isNotBlank() && !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        } else {
                            Text("Schedule")
                        }
                    }
                }
            }
        }
    }
}
