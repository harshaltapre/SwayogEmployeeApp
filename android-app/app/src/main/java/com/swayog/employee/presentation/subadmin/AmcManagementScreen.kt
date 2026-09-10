package com.swayog.employee.presentation.subadmin

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.ApartmentAmcSettingsRequest
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.UpdateAmcSettingsRequest
import com.swayog.employee.presentation.common.components.SwayogButton
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTopBar

val CLIENT_TYPE_FILTERS = listOf(
    "ALL" to "All",
    "corporate" to "Corporate",
    "post_paid" to "Post Paid",
    "pre_paid" to "Pre Paid",
    "free_service" to "Free Service",
    "on_call" to "On Call"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: AmcManagementViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val customers by viewModel.customers.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Customers, 1: Visit Schedule
    var searchQuery by remember { mutableStateOf("") }
    var selectedClientTypeFilter by remember { mutableStateOf("ALL") }
    var selectedCustomer by remember { mutableStateOf<Customer?>(null) }
    var selectedApartment by remember { mutableStateOf<ApartmentGroup?>(null) }

    var isAmcSettingsOpen by remember { mutableStateOf(false) }
    var isApartmentSettingsOpen by remember { mutableStateOf(false) }
    var isExcelImportOpen by remember { mutableStateOf(false) }

    // Filter customers by search and client type
    val filteredCustomers = remember(customers, searchQuery, selectedClientTypeFilter) {
        customers.filter { cust ->
            // Client type filter
            if (selectedClientTypeFilter != "ALL") {
                val ct = cust.clientType?.lowercase() ?: ""
                if (ct != selectedClientTypeFilter.lowercase()) return@filter false
            }

            // Search query filter
            if (searchQuery.isNotBlank()) {
                val q = searchQuery.lowercase()
                val name = cust.fullName?.lowercase() ?: ""
                val code = cust.customerCode?.lowercase() ?: ""
                val phone = cust.phoneNumber?.lowercase() ?: ""
                val city = cust.city?.lowercase() ?: ""
                val apt = cust.apartment?.name?.lowercase() ?: ""
                val consumer = cust.consumerNumber?.lowercase() ?: ""
                val tech = employees.find { it.id.toString() == cust.assignedEmployeeId }?.fullName?.lowercase() ?: ""

                if (!name.contains(q) && !code.contains(q) && !phone.contains(q) &&
                    !city.contains(q) && !apt.contains(q) && !consumer.contains(q) && !tech.contains(q)
                ) {
                    return@filter false
                }
            }

            true
        }
    }

    // Group customers by apartment
    val (apartmentsList, individualCustomers) = remember(filteredCustomers) {
        val apartmentsMap = mutableMapOf<Int, ApartmentGroup>()
        val individuals = mutableListOf<Customer>()

        filteredCustomers.forEach { cust ->
            if (cust.apartmentId != null && cust.apartment != null) {
                if (!apartmentsMap.containsKey(cust.apartmentId)) {
                    apartmentsMap[cust.apartmentId!!] = ApartmentGroup(
                        id = cust.apartmentId!!,
                        name = cust.apartment?.name ?: "",
                        address = cust.apartment?.address ?: "",
                        city = cust.apartment?.city ?: cust.city ?: "",
                        customers = mutableListOf()
                    )
                }
                apartmentsMap[cust.apartmentId!!]?.customers?.add(cust)
            } else {
                individuals.add(cust)
            }
        }

        Pair(apartmentsMap.values.toList(), individuals)
    }

    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    val windowSize = com.swayog.employee.presentation.common.responsive.LocalWindowSizeInfo.current

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "AMC Management",
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.TopCenter
        ) {
            com.swayog.employee.presentation.common.responsive.ResponsiveContentContainer(
                maxWidth = if (windowSize.isTablet) 920.dp else androidx.compose.ui.unit.Dp.Unspecified
            ) {
                Column(
                    modifier = Modifier.fillMaxSize()
                ) {
            // Top Tab Row
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = Color(0xFF6366F1)
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.People, contentDescription = null, modifier = Modifier.size(18.dp))
                            Text("Customers (${filteredCustomers.size})", fontWeight = FontWeight.Bold)
                        }
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(18.dp))
                            Text(
                                text = if (selectedCustomer != null) "Schedule (${selectedCustomer?.fullName?.take(10)}...)" else "Visit Schedule",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                )
            }

            if (selectedTab == 0) {
                // Customers Tab Content
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFFF8FAFC))
                ) {
                    // Search Bar and Excel Import Action
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Search name, code, phone, city, tech...", fontSize = 13.sp) },
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = "Search", modifier = Modifier.size(18.dp))
                            },
                            trailingIcon = {
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(onClick = { searchQuery = "" }, modifier = Modifier.size(24.dp)) {
                                        Icon(Icons.Default.Clear, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                                    }
                                }
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )

                        IconButton(
                            onClick = { isExcelImportOpen = true },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF6366F1).copy(alpha = 0.12f))
                        ) {
                            Icon(
                                Icons.Default.CloudUpload,
                                contentDescription = "Import Customers",
                                tint = Color(0xFF6366F1),
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }

                    // Client Type Filter Chips Row
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 2.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(CLIENT_TYPE_FILTERS) { (key, label) ->
                            val isSelected = selectedClientTypeFilter == key
                            val count = if (key == "ALL") customers.size else customers.count {
                                it.clientType?.equals(key, ignoreCase = true) == true
                            }

                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedClientTypeFilter = key },
                                label = {
                                    Text(
                                        text = "$label ($count)",
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFF6366F1).copy(alpha = 0.15f),
                                    selectedLabelColor = Color(0xFF6366F1)
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    if (isLoading) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = Color(0xFF6366F1))
                        }
                    } else if (filteredCustomers.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    Icons.Default.PeopleOutline,
                                    contentDescription = null,
                                    modifier = Modifier.size(48.dp),
                                    tint = Color.Gray.copy(alpha = 0.4f)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "No customers match the current filter",
                                    color = Color.Gray,
                                    fontWeight = FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                TextButton(onClick = {
                                    searchQuery = ""
                                    selectedClientTypeFilter = "ALL"
                                }) {
                                    Text("Reset Filters")
                                }
                            }
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Section: Apartment Groups
                            if (apartmentsList.isNotEmpty()) {
                                item {
                                    Text(
                                        text = "Apartment Communities (${apartmentsList.size})",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF475569),
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )
                                }

                                items(apartmentsList, key = { "apt_${it.id}" }) { apartment ->
                                    ApartmentCardItem(
                                        apartment = apartment,
                                        employees = employees,
                                        onApartmentSettingsClick = {
                                            selectedApartment = apartment
                                            isApartmentSettingsOpen = true
                                        },
                                        onCustomerSettingsClick = { cust ->
                                            selectedCustomer = cust
                                            isAmcSettingsOpen = true
                                        },
                                        onViewCustomerSchedule = { cust ->
                                            selectedCustomer = cust
                                            selectedTab = 1
                                        },
                                        onCallCustomer = { cust ->
                                            val phone = cust.phoneNumber
                                            if (!phone.isNullOrBlank()) {
                                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                                context.startActivity(intent)
                                            } else {
                                                Toast.makeText(context, "No phone number available", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                }
                            }

                            // Section: Individual Customers
                            if (individualCustomers.isNotEmpty()) {
                                item {
                                    Text(
                                        text = "Individual Customers (${individualCustomers.size})",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF475569),
                                        modifier = Modifier.padding(top = 10.dp, bottom = 4.dp)
                                    )
                                }

                                items(individualCustomers, key = { "ind_${it.id}" }) { customer ->
                                    val assignedEmployee = employees.find { it.id.toString() == customer.assignedEmployeeId }
                                    AmcCustomerCardItem(
                                        customer = customer,
                                        employee = assignedEmployee,
                                        onSettingsClick = {
                                            selectedCustomer = customer
                                            isAmcSettingsOpen = true
                                        },
                                        onViewScheduleClick = {
                                            selectedCustomer = customer
                                            selectedTab = 1
                                        },
                                        onCallClick = {
                                            val phone = customer.phoneNumber
                                            if (!phone.isNullOrBlank()) {
                                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                                context.startActivity(intent)
                                            } else {
                                                Toast.makeText(context, "No phone number available", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            } else {
                // Visit Schedule Tab
                AmcVisitScheduleScreen(
                    customerId = selectedCustomer?.id,
                    customerName = selectedCustomer?.fullName,
                    onClearCustomer = { selectedCustomer = null },
                    viewModel = viewModel
                )
            }
        }
    }
}
}

    // Individual Customer AMC Settings Dialog
    if (isAmcSettingsOpen && selectedCustomer != null) {
        AmcSettingsDialog(
            customer = selectedCustomer!!,
            employees = employees,
            onDismiss = {
                isAmcSettingsOpen = false
                selectedCustomer = null
            },
            onSave = { request ->
                viewModel.updateAmcSettings(selectedCustomer!!.id, request) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "AMC Settings updated & visits generated!", Toast.LENGTH_SHORT).show()
                        isAmcSettingsOpen = false
                        selectedCustomer = null
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to update AMC settings", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Apartment AMC Settings Dialog (Bulk)
    if (isApartmentSettingsOpen && selectedApartment != null) {
        ApartmentAmcSettingsDialog(
            apartmentName = selectedApartment!!.name,
            employees = employees,
            onDismiss = {
                isApartmentSettingsOpen = false
                selectedApartment = null
            },
            onSave = { request ->
                viewModel.updateApartmentAmcSettings(selectedApartment!!.id, request) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "Apartment AMC settings applied to all customers!", Toast.LENGTH_SHORT).show()
                        isApartmentSettingsOpen = false
                        selectedApartment = null
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to update apartment settings", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    // Excel / CSV Import Dialog
    if (isExcelImportOpen) {
        ExcelImportDialog(
            onDismiss = { isExcelImportOpen = false },
            onImport = { data ->
                viewModel.importCustomersFromExcel(data) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "Customers imported successfully!", Toast.LENGTH_SHORT).show()
                        isExcelImportOpen = false
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to import customers", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
}

@Composable
fun ApartmentCardItem(
    apartment: ApartmentGroup,
    employees: List<Employee>,
    onApartmentSettingsClick: () -> Unit,
    onCustomerSettingsClick: (Customer) -> Unit,
    onViewCustomerSchedule: (Customer) -> Unit,
    onCallCustomer: (Customer) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .clickable { expanded = !expanded }
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFF6366F1).copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Apartment,
                            contentDescription = null,
                            tint = Color(0xFF6366F1),
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column {
                        Text(
                            text = apartment.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                            Text(
                                text = "${apartment.address}, ${apartment.city}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        color = Color(0xFF6366F1).copy(alpha = 0.12f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "${apartment.customers?.size ?: 0} Units",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF6366F1)
                        )
                    }

                    IconButton(
                        onClick = onApartmentSettingsClick,
                        modifier = Modifier
                            .size(34.dp)
                            .background(Color(0xFFF1F5F9), CircleShape)
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = "Apartment Settings", modifier = Modifier.size(18.dp), tint = Color(0xFF475569))
                    }

                    IconButton(
                        onClick = { expanded = !expanded },
                        modifier = Modifier.size(30.dp)
                    ) {
                        Icon(
                            imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = if (expanded) "Collapse" else "Expand",
                            tint = Color.Gray
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Divider(color = Color(0xFFF1F5F9))
                    apartment.customers?.forEach { cust ->
                        val emp = employees.find { it.id.toString() == cust.assignedEmployeeId }
                        AmcCustomerCardItem(
                            customer = cust,
                            employee = emp,
                            onSettingsClick = { onCustomerSettingsClick(cust) },
                            onViewScheduleClick = { onViewCustomerSchedule(cust) },
                            onCallClick = { onCallCustomer(cust) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AmcCustomerCardItem(
    customer: Customer,
    employee: Employee?,
    onSettingsClick: () -> Unit,
    onViewScheduleClick: () -> Unit,
    onCallClick: () -> Unit
) {
    val clientType = customer.clientType?.lowercase() ?: "post_paid"
    val (badgeBg, badgeText) = when (clientType) {
        "corporate" -> Color(0xFFE0E7FF) to Color(0xFF4338CA)
        "pre_paid" -> Color(0xFFDBEAFE) to Color(0xFF1D4ED8)
        "post_paid" -> Color(0xFFD1FAE5) to Color(0xFF065F46)
        "free_service" -> Color(0xFFFEF3C7) to Color(0xFFB45309)
        "on_call" -> Color(0xFFF3E8FF) to Color(0xFF7E22CE)
        else -> Color(0xFFF1F5F9) to Color(0xFF475569)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Customer Name & Client Type Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = customer.fullName ?: "Unknown Customer",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                        Text(
                            text = "${customer.city ?: "N/A"} • ${customer.customerCode ?: ""}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            maxLines = 1
                        )
                    }
                }

                Surface(
                    color = badgeBg,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = clientType.replace("_", " ").uppercase(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = badgeText
                    )
                }
            }

            Divider(modifier = Modifier.padding(vertical = 10.dp), color = Color(0xFFF1F5F9))

            // Specs Row: Plant Capacity, Rate/Month, Cleanings/Month
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Plant Size", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        text = "${customer.systemSizeKw ?: 0} kW",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Column {
                    Text("Rate / Mo", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        text = customer.monthlyCleaningRate?.let { "₹$it" } ?: "—",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Column {
                    Text("Cleanings / Mo", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        text = customer.cleaningsPerMonth?.let { "$it Visits" } ?: "1 Visit",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Assigned Tech & Consumer #
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Engineering, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF059669))
                    Text(
                        text = employee?.fullName ?: "Unassigned Technician",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (employee != null) Color(0xFF059669) else Color.Gray,
                        fontWeight = FontWeight.Medium
                    )
                }

                if (!customer.consumerNumber.isNullOrBlank()) {
                    Text(
                        text = "Cons. #${customer.consumerNumber}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.Gray
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Actions Row: Call, AMC Settings, View Schedule
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onCallClick,
                    modifier = Modifier
                        .size(34.dp)
                        .background(Color(0xFFF1F5F9), CircleShape)
                ) {
                    Icon(
                        Icons.Default.Phone,
                        contentDescription = "Call",
                        modifier = Modifier.size(16.dp),
                        tint = Color(0xFF0284C7)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onSettingsClick,
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.Tune, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("AMC Settings", fontSize = 12.sp)
                    }

                    Button(
                        onClick = onViewScheduleClick,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.CalendarToday, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("View Schedule", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// Dialog: Excel / CSV Import Dialog with file picker launcher
@Composable
fun ExcelImportDialog(
    onDismiss: () -> Unit,
    onImport: (List<Map<String, String>>) -> Unit
) {
    val context = LocalContext.current
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
    var parsedRows by remember { mutableStateOf<List<Map<String, String>>>(emptyList()) }
    var isReading by remember { mutableStateOf(false) }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedFileUri = uri
            isReading = true
            try {
                val inputStream = context.contentResolver.openInputStream(uri)
                val reader = inputStream?.bufferedReader()
                val lines = reader?.readLines() ?: emptyList()
                reader?.close()

                if (lines.isNotEmpty()) {
                    val headers = lines[0].split(",").map { it.trim().trim('"', '\'') }
                    val rows = mutableListOf<Map<String, String>>()
                    for (i in 1 until lines.size) {
                        val line = lines[i].trim()
                        if (line.isNotBlank()) {
                            val values = line.split(",").map { it.trim().trim('"', '\'') }
                            val map = mutableMapOf<String, String>()
                            for (j in headers.indices) {
                                if (j < values.size) {
                                    map[headers[j]] = values[j]
                                }
                            }
                            rows.add(map)
                        }
                    }
                    parsedRows = rows
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error reading file: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isReading = false
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Import Customers", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                Text(
                    text = "Upload a CSV file containing customer records. Ensure the following column headers exist:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF475569)
                )

                Surface(
                    color = Color(0xFFF1F5F9),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Customer Name, Phone, Email, City, Plant Size (kW), Client Type, Rate, Cleanings/Month",
                        modifier = Modifier.padding(10.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF334155),
                        fontWeight = FontWeight.Medium
                    )
                }

                Button(
                    onClick = { filePickerLauncher.launch("*/*") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                ) {
                    Icon(Icons.Default.AttachFile, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (selectedFileUri != null) "Choose Another File" else "Pick CSV File")
                }

                if (isReading) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    }
                } else if (parsedRows.isNotEmpty()) {
                    Surface(
                        color = Color(0xFFD1FAE5),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "✓ Successfully detected ${parsedRows.size} customer rows from file.",
                            modifier = Modifier.padding(10.dp),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF065F46),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = { onImport(parsedRows) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        modifier = Modifier.weight(1f),
                        enabled = parsedRows.isNotEmpty()
                    ) {
                        Text("Import (${parsedRows.size})")
                    }
                }
            }
        }
    }
}

// Data class for Apartment Group
data class ApartmentGroup(
    val id: Int,
    val name: String,
    val address: String,
    val city: String,
    val customers: MutableList<Customer>? = null
)
