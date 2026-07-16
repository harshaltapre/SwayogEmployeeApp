package com.swayog.employee.presentation.subadmin

import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Employee
import com.swayog.employee.presentation.common.components.*

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
    var selectedCustomer by remember { mutableStateOf<Customer?>(null) }
    var selectedApartment by remember { mutableStateOf<ApartmentGroup?>(null) }
    var isAmcSettingsOpen by remember { mutableStateOf(false) }
    var isApartmentSettingsOpen by remember { mutableStateOf(false) }
    var isExcelImportOpen by remember { mutableStateOf(false) }
    
    // Filter customers
    val filteredCustomers = remember(customers, searchQuery) {
        if (searchQuery.isBlank()) customers
        else customers.filter { cust ->
            (cust.fullName ?: "").contains(searchQuery, ignoreCase = true) ||
            (cust.customerCode ?: "").contains(searchQuery, ignoreCase = true) ||
            (cust.city ?: "").contains(searchQuery, ignoreCase = true) ||
            (cust.apartment?.name ?: "").contains(searchQuery, ignoreCase = true)
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tabs
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Customers") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Visit Schedule") }
                )
            }
            
            if (selectedTab == 0) {
                // Customers Tab
                Column(modifier = Modifier.fillMaxSize()) {
                    // Search and Import Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Search by name, code, apartment...") },
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = "Search")
                            },
                            trailingIcon = {
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(onClick = { searchQuery = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                                    }
                                }
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        OutlinedButton(
                            onClick = { isExcelImportOpen = true },
                            modifier = Modifier.height(56.dp)
                        ) {
                            Icon(Icons.Default.Upload, contentDescription = "Import")
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Import")
                        }
                    }
                    
                    if (isLoading) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    } else if (filteredCustomers.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (searchQuery.isNotEmpty()) "No customers match \"$searchQuery\"" else "No AMC customers found",
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Apartment Groups
                            items(apartmentsList, key = { it.id }) { apartment ->
                                Column {
                                    ApartmentGroupCard(
                                        apartment = apartment,
                                        onSettingsClick = {
                                            selectedApartment = apartment
                                            isApartmentSettingsOpen = true
                                        }
                                    )
                                    
                                    // Apartment Customers
                                    apartment.customers?.forEach { customer ->
                                        AmcCustomerCard(
                                            customer = customer,
                                            employee = employees.find { it.id == customer.assignedEmployeeId },
                                            onSettingsClick = {
                                                selectedCustomer = customer
                                                isAmcSettingsOpen = true
                                            }
                                        )
                                    }
                                }
                            }
                            
                            // Individual Customers Section Header
                            if (individualCustomers.isNotEmpty() && apartmentsList.isNotEmpty()) {
                                item {
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                                    ) {
                                        Text(
                                            text = "Individual Customers",
                                            modifier = Modifier.padding(12.dp),
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                            
                            // Individual Customers
                            items(individualCustomers, key = { it.id ?: 0 }) { customer ->
                                AmcCustomerCard(
                                    customer = customer,
                                    employee = employees.find { it.id == customer.assignedEmployeeId },
                                    onSettingsClick = {
                                        selectedCustomer = customer
                                        isAmcSettingsOpen = true
                                    }
                                )
                            }
                        }
                    }
                }
            } else {
                // Visit Schedule Tab
                AmcVisitScheduleScreen(
                    customerId = selectedCustomer?.id,
                    customerName = selectedCustomer?.fullName,
                    onClearCustomer = { selectedCustomer = null }
                )
            }
        }
    }
    
    // AMC Settings Dialog
    if (isAmcSettingsOpen && selectedCustomer != null) {
        AmcSettingsDialog(
            customer = selectedCustomer!!,
            onDismiss = {
                isAmcSettingsOpen = false
                selectedCustomer = null
            },
            onSave = { settings ->
                viewModel.updateAmcSettings(selectedCustomer!!.id ?: 0, settings) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "AMC settings updated successfully", Toast.LENGTH_SHORT).show()
                        isAmcSettingsOpen = false
                        selectedCustomer = null
                        viewModel.loadData()
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to update AMC settings", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
    
    // Apartment AMC Settings Dialog
    if (isApartmentSettingsOpen && selectedApartment != null) {
        ApartmentAmcSettingsDialog(
            apartment = selectedApartment!!,
            onDismiss = {
                isApartmentSettingsOpen = false
                selectedApartment = null
            },
            onSave = { settings ->
                viewModel.updateApartmentAmcSettings(selectedApartment!!.id, settings) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "Apartment AMC settings updated successfully", Toast.LENGTH_SHORT).show()
                        isApartmentSettingsOpen = false
                        selectedApartment = null
                        viewModel.loadData()
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to update apartment AMC settings", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
    
    // Excel Import Dialog
    if (isExcelImportOpen) {
        ExcelImportDialog(
            onDismiss = { isExcelImportOpen = false },
            onImport = { data ->
                viewModel.importCustomersFromExcel(data) { result ->
                    result.onSuccess {
                        Toast.makeText(context, "Customers imported successfully", Toast.LENGTH_SHORT).show()
                        isExcelImportOpen = false
                        viewModel.loadData()
                    }.onFailure {
                        Toast.makeText(context, it.message ?: "Failed to import customers", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
}

@Composable
fun ApartmentGroupCard(
    apartment: ApartmentGroup,
    onSettingsClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEEF2FF))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF6366F1), RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Apartment,
                        contentDescription = "Apartment",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
                
                Column {
                    Text(
                        text = apartment.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = "Location",
                            modifier = Modifier.size(12.dp),
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                        Text(
                            text = "${apartment.address}, ${apartment.city}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    color = Color(0xFF6366F1).copy(alpha = 0.2f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "${apartment.customers?.size ?: 0} Customers",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF6366F1)
                    )
                }
                
                IconButton(onClick = onSettingsClick) {
                    Icon(Icons.Default.Settings, contentDescription = "AMC Settings")
                }
            }
        }
    }
}

@Composable
fun AmcCustomerCard(
    customer: Customer,
    employee: Employee?,
    onSettingsClick: () -> Unit
) {
    val clientTypeColor = when (customer.clientType?.lowercase()) {
        "pre_paid", "post_paid" -> Color(0xFFDCFCE7) // Green
        "free_service" -> Color(0xFFFCE7F3) // Pink
        "corporate" -> Color(0xFFFEF9C3) // Yellow
        "on_call" -> Color(0xFFF1F5F9) // Slate
        else -> Color.White
    }
    
    val clientTypeBadgeColor = when (customer.clientType?.lowercase()) {
        "pre_paid", "post_paid" -> Color(0xFF166534)
        "free_service" -> Color(0xFF9D174D)
        "corporate" -> Color(0xFF854D0E)
        "on_call" -> Color(0xFF475569)
        else -> Color.Gray
    }
    
    SwayogCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = customer.fullName ?: "Unknown",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    customer.phoneNumber?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
                
                IconButton(onClick = onSettingsClick) {
                    Icon(Icons.Default.Settings, contentDescription = "AMC Settings")
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Location",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = customer.city ?: "N/A",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                Column {
                    Text(
                        text = "Plant Capacity",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = "${customer.systemSizeKw ?: 0} kW",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                Column {
                    Text(
                        text = "Type",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Surface(
                        color = clientTypeBadgeColor.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = customer.clientType?.replace("_", " ")?.capitalize() ?: "Post Paid",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = clientTypeBadgeColor,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Consumer #",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = customer.consumerNumber ?: "N/A",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                Column {
                    Text(
                        text = "Rate/Month",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = customer.monthlyCleaningRate?.let { "₹$it" } ?: "—",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                Column {
                    Text(
                        text = "Cleanings/Month",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = customer.cleaningsPerMonth?.let { "$it Cleanings" } ?: "—",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
            
            employee?.let { emp ->
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = "Technician",
                        modifier = Modifier.size(16.dp),
                        tint = Color(0xFF059669)
                    )
                    Text(
                        text = "Tech: ${emp.fullName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF059669),
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
fun AmcVisitScheduleScreen(
    customerId: Int?,
    customerName: String?,
    onClearCustomer: () -> Unit
) {
    // Placeholder for visit schedule implementation
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                Icons.Default.CalendarMonth,
                contentDescription = "Schedule",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
            )
            Text(
                text = "AMC Visit Schedule",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
            Text(
                text = "Visit tracking and scheduling will be implemented here",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
        }
    }
}

@Composable
fun AmcSettingsDialog(
    customer: Customer,
    onDismiss: () -> Unit,
    onSave: (AmcSettings) -> Unit
) {
    var monthlyRate by remember { mutableStateOf(customer.monthlyCleaningRate?.toString() ?: "") }
    var cleaningsPerMonth by remember { mutableStateOf(customer.cleaningsPerMonth?.toString() ?: "") }
    var clientType by remember { mutableStateOf(customer.clientType ?: "post_paid") }
    var consumerNumber by remember { mutableStateOf(customer.consumerNumber ?: "") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("AMC Settings") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = customer.fullName ?: "Customer",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                SwayogTextField(
                    value = monthlyRate,
                    onValueChange = { monthlyRate = it },
                    label = "Monthly Rate (₹)",
                    placeholder = "Enter monthly rate"
                )
                
                SwayogTextField(
                    value = cleaningsPerMonth,
                    onValueChange = { cleaningsPerMonth = it },
                    label = "Cleanings Per Month",
                    placeholder = "Enter number of cleanings"
                )
                
                SwayogTextField(
                    value = consumerNumber,
                    onValueChange = { consumerNumber = it },
                    label = "Consumer Number",
                    placeholder = "Enter consumer number"
                )
                
                Text(
                    text = "Client Type",
                    style = MaterialTheme.typography.labelMedium
                )
                val clientTypes = listOf("pre_paid", "post_paid", "free_service", "corporate", "on_call")
                clientTypes.forEach { type ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        RadioButton(
                            selected = clientType == type,
                            onClick = { clientType = type }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(type.replace("_", " ").capitalize())
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                onSave(
                    AmcSettings(
                        monthlyRate = monthlyRate.toIntOrNull(),
                        cleaningsPerMonth = cleaningsPerMonth.toIntOrNull(),
                        clientType = clientType,
                        consumerNumber = consumerNumber
                    )
                )
            }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun ApartmentAmcSettingsDialog(
    apartment: ApartmentGroup,
    onDismiss: () -> Unit,
    onSave: (ApartmentAmcSettings) -> Unit
) {
    var monthlyRate by remember { mutableStateOf("") }
    var cleaningsPerMonth by remember { mutableStateOf("") }
    var clientType by remember { mutableStateOf("post_paid") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Apartment AMC Settings") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = apartment.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                SwayogTextField(
                    value = monthlyRate,
                    onValueChange = { monthlyRate = it },
                    label = "Monthly Rate (₹)",
                    placeholder = "Enter monthly rate for all customers"
                )
                
                SwayogTextField(
                    value = cleaningsPerMonth,
                    onValueChange = { cleaningsPerMonth = it },
                    label = "Cleanings Per Month",
                    placeholder = "Enter number of cleanings"
                )
                
                Text(
                    text = "Client Type",
                    style = MaterialTheme.typography.labelMedium
                )
                val clientTypes = listOf("pre_paid", "post_paid", "free_service", "corporate", "on_call")
                clientTypes.forEach { type ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        RadioButton(
                            selected = clientType == type,
                            onClick = { clientType = type }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(type.replace("_", " ").capitalize())
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                onSave(
                    ApartmentAmcSettings(
                        monthlyRate = monthlyRate.toIntOrNull(),
                        cleaningsPerMonth = cleaningsPerMonth.toIntOrNull(),
                        clientType = clientType
                    )
                )
            }) {
                Text("Apply to All")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun ExcelImportDialog(
    onDismiss: () -> Unit,
    onImport: (List<Map<String, String>>) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Import Customers from Excel") },
        text = {
            Text(
                "Upload an Excel file with customer data. Ensure columns: Customer Name, Site Location, Phone, Email, City, Plant Size (kW), Installation Date, AMC Status, Inverter Brand, etc."
            )
        },
        confirmButton = {
            Button(onClick = {
                // Placeholder for actual Excel import logic
                onImport(emptyList())
            }) {
                Text("Select File")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

// Data classes
data class ApartmentGroup(
    val id: Int,
    val name: String,
    val address: String,
    val city: String,
    val customers: MutableList<Customer>? = null
)

data class AmcSettings(
    val monthlyRate: Int?,
    val cleaningsPerMonth: Int?,
    val clientType: String,
    val consumerNumber: String
)

data class ApartmentAmcSettings(
    val monthlyRate: Int?,
    val cleaningsPerMonth: Int?,
    val clientType: String
)

fun String.capitalize(): String {
    return this.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
}
