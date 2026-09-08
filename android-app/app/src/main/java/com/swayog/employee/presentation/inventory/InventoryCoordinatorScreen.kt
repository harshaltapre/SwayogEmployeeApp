package com.swayog.employee.presentation.inventory

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.InventoryItem
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTopBar
import com.swayog.employee.presentation.inventory.dialogs.AddEditInventoryItemDialog
import com.swayog.employee.presentation.inventory.dialogs.CustomerDispatchHistoryDialog
import com.swayog.employee.presentation.inventory.dialogs.DispatchMaterialDialog
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryCoordinatorScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToAttendance: () -> Unit = {},
    viewModel: InventoryViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var currentTab by remember { mutableIntStateOf(0) }

    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val inventoryState by viewModel.inventoryState.collectAsState()
    val rawItems by viewModel.inventoryItems.collectAsState()
    val filteredItems by viewModel.filteredInventoryItems.collectAsState()
    val dispatches by viewModel.dispatches.collectAsState()
    val customers by viewModel.filteredCustomers.collectAsState()

    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val showOnlyLowStock by viewModel.showOnlyLowStock.collectAsState()
    val customerSearchQuery by viewModel.customerSearchQuery.collectAsState()

    // Dialog states
    var showAddDialog by remember { mutableStateOf(false) }
    var itemToEdit by remember { mutableStateOf<InventoryItem?>(null) }
    var itemToDelete by remember { mutableStateOf<InventoryItem?>(null) }
    var customerForDispatch by remember { mutableStateOf<Customer?>(null) }
    var customerForHistory by remember { mutableStateOf<Customer?>(null) }

    // Live clock
    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            currentTime = System.currentTimeMillis()
            delay(1000L)
        }
    }
    val timeFormat = remember { SimpleDateFormat("hh:mm:ss a", Locale.getDefault()) }
    val formattedTime = timeFormat.format(Date(currentTime))

    // Work timer calculation
    val workDurationText = remember(todayAttendance, currentTime) {
        val attendance = todayAttendance ?: return@remember null
        val checkInStr = attendance.checkInTime ?: return@remember null
        try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val checkInDate = isoFormat.parse(checkInStr.substringBefore(".")) ?: return@remember null
            val endTime = if (attendance.checkOutTime != null) {
                isoFormat.parse(attendance.checkOutTime.substringBefore("."))?.time ?: currentTime
            } else {
                currentTime
            }
            val diffMs = endTime - checkInDate.time
            val hours = (diffMs / 3600000).toInt()
            val minutes = ((diffMs % 3600000) / 60000).toInt()
            val seconds = ((diffMs % 60000) / 1000).toInt()
            String.format("%02d:%02d:%02d", hours, minutes, seconds)
        } catch (_: Exception) { null }
    }

    // KPI stats
    val totalStockCount = rawItems.size
    val lowStockCount = rawItems.count { it.inStock <= it.minThreshold }
    val totalDispatchesCount = dispatches.size
    val totalValuation = rawItems.sumOf { (it.inStock * it.pricePerUnit).toDouble() }

    LaunchedEffect(inventoryState) {
        if (inventoryState is InventoryState.Error) {
            Toast.makeText(context, (inventoryState as InventoryState.Error).message, Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = when (currentTab) {
                    0 -> "Inventory Overview"
                    1 -> "Stock Ledger"
                    2 -> "Customer Dispatches"
                    3 -> "Inventory Settings"
                    else -> "Inventory Coordinator"
                },
                showBackButton = currentTab != 0,
                onBackClick = {
                    if (currentTab != 0) currentTab = 0
                    else onNavigateBack()
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshAll() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onNavigateToAttendance) {
                        Icon(Icons.Default.CalendarToday, contentDescription = "Attendance")
                    }
                    IconButton(onClick = onNavigateToNotifications) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                    }
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(Icons.Default.Person, contentDescription = "Profile")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentTab == 0,
                    onClick = { currentTab = 0 },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Overview") },
                    label = { Text("Overview") }
                )
                NavigationBarItem(
                    selected = currentTab == 1,
                    onClick = { currentTab = 1 },
                    icon = { Icon(Icons.Default.Inventory2, contentDescription = "Ledger") },
                    label = { Text("Ledger") }
                )
                NavigationBarItem(
                    selected = currentTab == 2,
                    onClick = { currentTab = 2 },
                    icon = { Icon(Icons.Default.LocalShipping, contentDescription = "Customers") },
                    label = { Text("Customers") }
                )
                NavigationBarItem(
                    selected = currentTab == 3,
                    onClick = { currentTab = 3 },
                    icon = { Icon(Icons.Default.Tune, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        },
        floatingActionButton = {
            if (currentTab == 1) {
                FloatingActionButton(
                    onClick = {
                        itemToEdit = null
                        showAddDialog = true
                    },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Item")
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentTab) {
                0 -> {
                    // TAB 0: OVERVIEW / DASHBOARD
                    OverviewTabContent(
                        todayAttendance = todayAttendance,
                        formattedTime = formattedTime,
                        workDurationText = workDurationText,
                        onNavigateToAttendance = onNavigateToAttendance,
                        totalStock = totalStockCount,
                        lowStock = lowStockCount,
                        totalDispatches = totalDispatchesCount,
                        valuation = totalValuation,
                        lowStockItems = rawItems.filter { it.inStock <= it.minThreshold },
                        recentDispatches = dispatches.take(10),
                        onNavigateToLedger = { currentTab = 1 },
                        onNavigateToCustomers = { currentTab = 2 },
                        onAddItem = {
                            itemToEdit = null
                            showAddDialog = true
                        },
                        onExportCsv = {
                            viewModel.exportInventoryCsv(
                                context = context,
                                onDone = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() },
                                onError = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
                            )
                        },
                        onEditItem = { item ->
                            itemToEdit = item
                            showAddDialog = true
                        }
                    )
                }
                1 -> {
                    // TAB 1: STOCK LEDGER
                    LedgerTabContent(
                        items = filteredItems,
                        isLoading = inventoryState is InventoryState.Loading && rawItems.isEmpty(),
                        searchQuery = searchQuery,
                        onSearchChange = { viewModel.searchQuery.value = it },
                        selectedCategory = selectedCategory,
                        onCategorySelect = { viewModel.selectedCategory.value = it },
                        showOnlyLowStock = showOnlyLowStock,
                        onToggleLowStock = { viewModel.showOnlyLowStock.value = !showOnlyLowStock },
                        onExportCsv = {
                            viewModel.exportInventoryCsv(
                                context = context,
                                onDone = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() },
                                onError = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
                            )
                        },
                        onEditItem = { item ->
                            itemToEdit = item
                            showAddDialog = true
                        },
                        onDeleteItem = { item ->
                            itemToDelete = item
                        }
                    )
                }
                2 -> {
                    // TAB 2: CUSTOMERS & DISPATCHES
                    CustomersTabContent(
                        customers = customers,
                        customerSearchQuery = customerSearchQuery,
                        onCustomerSearchChange = { viewModel.customerSearchQuery.value = it },
                        dispatches = dispatches,
                        onDispatchClick = { cust ->
                            customerForDispatch = cust
                        },
                        onHistoryClick = { cust ->
                            customerForHistory = cust
                        }
                    )
                }
                3 -> {
                    // TAB 3: INVENTORY SETTINGS
                    SettingsTabContent(
                        viewModel = viewModel,
                        onSaveSuccess = {
                            Toast.makeText(context, "Inventory settings saved", Toast.LENGTH_SHORT).show()
                        }
                    )
                }
            }
        }
    }

    // Add / Edit Item Dialog
    if (showAddDialog) {
        AddEditInventoryItemDialog(
            itemToEdit = itemToEdit,
            onDismiss = {
                showAddDialog = false
                itemToEdit = null
            },
            onSaveAdd = { req ->
                viewModel.createInventoryItem(
                    request = req,
                    onSuccess = {
                        Toast.makeText(context, "Item added to inventory", Toast.LENGTH_SHORT).show()
                        showAddDialog = false
                    },
                    onError = {
                        Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    }
                )
            },
            onSaveEdit = { id, req ->
                viewModel.updateInventoryItem(
                    id = id,
                    request = req,
                    onSuccess = {
                        Toast.makeText(context, "Item updated successfully", Toast.LENGTH_SHORT).show()
                        showAddDialog = false
                        itemToEdit = null
                    },
                    onError = {
                        Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    }
                )
            }
        )
    }

    // Delete Item Confirmation
    itemToDelete?.let { item ->
        AlertDialog(
            onDismissRequest = { itemToDelete = null },
            title = { Text("Delete Inventory Item?") },
            text = { Text("Are you sure you want to delete '${item.name}' (${item.sku})? This cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteInventoryItem(
                            id = item.id.toString(),
                            onSuccess = {
                                Toast.makeText(context, "Item removed from inventory", Toast.LENGTH_SHORT).show()
                                itemToDelete = null
                            },
                            onError = {
                                Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { itemToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Dispatch Dialog
    customerForDispatch?.let { cust ->
        DispatchMaterialDialog(
            customer = cust,
            availableItems = rawItems.filter { it.inStock > 0 },
            onDismiss = { customerForDispatch = null },
            onSubmitDispatches = { requests ->
                viewModel.createDispatches(
                    requests = requests,
                    onSuccess = {
                        Toast.makeText(context, "Materials dispatched successfully", Toast.LENGTH_SHORT).show()
                        customerForDispatch = null
                    },
                    onError = {
                        Toast.makeText(context, it, Toast.LENGTH_LONG).show()
                    }
                )
            }
        )
    }

    // History Dialog
    customerForHistory?.let { cust ->
        CustomerDispatchHistoryDialog(
            customer = cust,
            dispatches = viewModel.getDispatchesForCustomer(cust.id),
            onDismiss = { customerForHistory = null },
            onUpdateDispatch = { id, req ->
                viewModel.updateDispatch(
                    id = id,
                    request = req,
                    onSuccess = {
                        Toast.makeText(context, "Dispatch updated", Toast.LENGTH_SHORT).show()
                    },
                    onError = {
                        Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    }
                )
            },
            onDeleteDispatch = { id ->
                viewModel.deleteDispatch(
                    id = id,
                    onSuccess = {
                        Toast.makeText(context, "Dispatch cancelled & stock restored", Toast.LENGTH_SHORT).show()
                    },
                    onError = {
                        Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    }
                )
            }
        )
    }
}

// ─── TAB 0: OVERVIEW / DASHBOARD ─────────────────────────────────────────────
@Composable
private fun OverviewTabContent(
    todayAttendance: AttendanceRecord?,
    formattedTime: String,
    workDurationText: String?,
    onNavigateToAttendance: () -> Unit,
    totalStock: Int,
    lowStock: Int,
    totalDispatches: Int,
    valuation: Double,
    lowStockItems: List<InventoryItem>,
    recentDispatches: List<com.swayog.employee.data.model.DispatchRecord>,
    onNavigateToLedger: () -> Unit,
    onNavigateToCustomers: () -> Unit,
    onAddItem: () -> Unit,
    onExportCsv: () -> Unit,
    onEditItem: (InventoryItem) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live Clock + Work Timer Card
        item {
            SwayogCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = formattedTime,
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            letterSpacing = 2.sp
                        )
                        Text(
                            text = "Current Time",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                    if (workDurationText != null) {
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = workDurationText,
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (todayAttendance?.checkOutTime != null)
                                    Color(0xFF0B6E4F)
                                else
                                    Color(0xFF386FA4)
                            )
                            Text(
                                text = if (todayAttendance?.checkOutTime != null) "Total Worked" else "Working...",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                }
            }
        }

        // Today's Attendance Card
        item {
            SwayogCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CalendarToday,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "Today's Attendance",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        val attendance = todayAttendance
                        if (attendance != null) {
                            val inTime = if (attendance.checkInTime != null) {
                                attendance.checkInTime.substringAfter("T").substringBefore(".")
                            } else null

                            Text(
                                text = if (inTime != null) "Checked in at $inTime" else "Not checked in yet",
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (inTime != null) Color(0xFF0B6E4F) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                fontWeight = if (inTime != null) FontWeight.SemiBold else FontWeight.Normal
                            )
                            if (attendance.checkOutTime != null) {
                                Text(
                                    text = "Checked out at ${attendance.checkOutTime.substringAfter("T").substringBefore(".")}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                        } else {
                            Text(
                                text = "No attendance record today",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = onNavigateToAttendance,
                        modifier = Modifier.wrapContentWidth()
                    ) {
                        Text(
                            text = if (todayAttendance?.checkInTime == null) "Check In" else "View Details",
                            maxLines = 1
                        )
                    }
                }
            }
        }

        // KPI Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    KpiStatCard(
                        title = "Total Items",
                        value = "$totalStock",
                        icon = Icons.Default.Inventory2,
                        accentColor = Color(0xFF0284C7),
                        modifier = Modifier.weight(1f)
                    )
                    KpiStatCard(
                        title = "Low Stock Alerts",
                        value = "$lowStock",
                        icon = Icons.Default.Warning,
                        accentColor = if (lowStock > 0) Color(0xFFE11D48) else Color(0xFF10B981),
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    KpiStatCard(
                        title = "Total Dispatches",
                        value = "$totalDispatches",
                        icon = Icons.Default.LocalShipping,
                        accentColor = Color(0xFF10B981),
                        modifier = Modifier.weight(1f)
                    )
                    KpiStatCard(
                        title = "Stock Valuation",
                        value = "₹" + String.format(java.util.Locale.getDefault(), "%,.0f", valuation),
                        icon = Icons.Default.CurrencyRupee,
                        accentColor = Color(0xFFF59E0B),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Quick Actions
        item {
            SwayogCard {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Quick Actions",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onAddItem,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("New Item", maxLines = 1)
                        }

                        OutlinedButton(
                            onClick = onNavigateToCustomers,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Dispatch", maxLines = 1)
                        }

                        FilledTonalButton(
                            onClick = onExportCsv,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Export", maxLines = 1)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = onNavigateToAttendance,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Fingerprint, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Attendance & GPS", maxLines = 1)
                        }

                        OutlinedButton(
                            onClick = onNavigateToLedger,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Inventory2, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Stock Ledger", maxLines = 1)
                        }
                    }
                }
            }
        }

        // Low Stock Warnings Section
        if (lowStockItems.isNotEmpty()) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Low Stock Warnings (${lowStockItems.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error
                    )
                    TextButton(onClick = onNavigateToLedger) {
                        Text("View Ledger")
                    }
                }
            }

            items(lowStockItems.take(5), key = { it.id }) { item ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.35f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onEditItem(item) }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.name,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "SKU: ${item.sku} • Supplier: ${item.supplier ?: "N/A"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.error
                        ) {
                            Text(
                                text = "${item.inStock} / ${item.minThreshold} left",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onError,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }

        // Recent Dispatches Feed
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Material Dispatches",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onNavigateToCustomers) {
                    Text("View All")
                }
            }
        }

        if (recentDispatches.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No dispatches recorded yet",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
        } else {
            items(recentDispatches.take(5), key = { it.id }) { d ->
                Card(
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = d.itemName ?: "Item #${d.itemId}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "To: ${d.customerName ?: "Customer #${d.customerId}"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "${d.quantity} ${d.unit ?: "units"}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─── TAB 1: STOCK LEDGER ─────────────────────────────────────────────────────
@Composable
private fun LedgerTabContent(
    items: List<InventoryItem>,
    isLoading: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    selectedCategory: String,
    onCategorySelect: (String) -> Unit,
    showOnlyLowStock: Boolean,
    onToggleLowStock: () -> Unit,
    onExportCsv: () -> Unit,
    onEditItem: (InventoryItem) -> Unit,
    onDeleteItem: (InventoryItem) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Search & Filter controls
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchChange,
                    placeholder = { Text("Search by SKU, name, or supplier...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )

                IconButton(onClick = onExportCsv) {
                    Icon(Icons.Default.Download, contentDescription = "Export CSV")
                }
            }

            // Categories horizontal scroll
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = showOnlyLowStock,
                    onClick = onToggleLowStock,
                    label = { Text("⚠️ Low Stock Only") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.errorContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onErrorContainer
                    )
                )

                InventoryConstants.CATEGORIES.forEach { (key, label) ->
                    FilterChip(
                        selected = selectedCategory == key,
                        onClick = { onCategorySelect(key) },
                        label = { Text(label) }
                    )
                }
            }
        }

        // List
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (items.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Inventory,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No inventory items found",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(items, key = { it.id }) { item ->
                    val isLow = item.inStock <= item.minThreshold
                    val isOut = item.inStock == 0

                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = item.sku,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant
                                        ) {
                                            Text(
                                                text = item.category,
                                                style = MaterialTheme.typography.labelSmall,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }

                                Row {
                                    IconButton(
                                        onClick = { onEditItem(item) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(18.dp))
                                    }
                                    IconButton(
                                        onClick = { onDeleteItem(item) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Delete,
                                            contentDescription = "Delete",
                                            modifier = Modifier.size(18.dp),
                                            tint = MaterialTheme.colorScheme.error
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Unit Price: ₹${item.pricePerUnit}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Medium
                                    )
                                    if (!item.supplier.isNullOrBlank()) {
                                        Text(
                                            text = "Vendor: ${item.supplier}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = when {
                                        isOut -> MaterialTheme.colorScheme.error
                                        isLow -> MaterialTheme.colorScheme.errorContainer
                                        else -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                                    }
                                ) {
                                    Text(
                                        text = "${item.inStock} ${item.unit ?: "units"} (Min: ${item.minThreshold})",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = when {
                                            isOut -> MaterialTheme.colorScheme.onError
                                            isLow -> MaterialTheme.colorScheme.onErrorContainer
                                            else -> MaterialTheme.colorScheme.onPrimaryContainer
                                        },
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── TAB 2: CUSTOMERS & DISPATCHES ───────────────────────────────────────────
@Composable
private fun CustomersTabContent(
    customers: List<Customer>,
    customerSearchQuery: String,
    onCustomerSearchChange: (String) -> Unit,
    dispatches: List<com.swayog.employee.data.model.DispatchRecord>,
    onDispatchClick: (Customer) -> Unit,
    onHistoryClick: (Customer) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = customerSearchQuery,
            onValueChange = onCustomerSearchChange,
            placeholder = { Text("Search customer by name, code, phone, or city...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            singleLine = true
        )

        if (customers.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No customers found",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(customers, key = { it.id }) { cust ->
                    val customerDispatches = dispatches.filter { it.customerId == cust.id }
                    val totalUnitsDispatched = customerDispatches.sumOf { it.quantity }

                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = cust.fullName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Code: ${cust.customerCode} • Phone: ${cust.phoneNumber}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (!cust.address.isNullOrBlank()) {
                                        Text(
                                            text = "${cust.address}${if (!cust.city.isNullOrBlank()) ", ${cust.city}" else ""}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                                ) {
                                    Text(
                                        text = "${totalUnitsDispatched} units",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            // Dispatched Items Tags Summary
                            if (customerDispatches.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    customerDispatches.take(4).forEach { d ->
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant
                                        ) {
                                            Text(
                                                text = "${d.itemName ?: "Item #${d.itemId}"} (${d.quantity})",
                                                style = MaterialTheme.typography.labelSmall,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                    if (customerDispatches.size > 4) {
                                        Text(
                                            text = "+${customerDispatches.size - 4} more",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.align(Alignment.CenterVertically)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Action Buttons
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = { onDispatchClick(cust) },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.LocalShipping, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("+ Dispatch")
                                }

                                OutlinedButton(
                                    onClick = { onHistoryClick(cust) },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("History")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── TAB 3: SETTINGS ─────────────────────────────────────────────────────────
@Composable
private fun SettingsTabContent(
    viewModel: InventoryViewModel,
    onSaveSuccess: () -> Unit
) {
    val lowStockNotif by viewModel.lowStockNotifications.collectAsState()
    val dailyDigest by viewModel.dailyDigest.collectAsState()
    val supplierAlerts by viewModel.supplierAlerts.collectAsState()
    val autoApprove by viewModel.autoApproveAdjustments.collectAsState()
    val requireReason by viewModel.requireReasonForAdjustments.collectAsState()
    val allowNegative by viewModel.allowNegativeStock.collectAsState()
    val defaultThreshold by viewModel.defaultThreshold.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Notifications
        SwayogCard {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "🔔 Inventory Alerts & Notifications",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                SettingSwitchRow(
                    title = "Low Stock Notifications",
                    subtitle = "Notify when stock drops below threshold",
                    checked = lowStockNotif,
                    onCheckedChange = { viewModel.lowStockNotifications.value = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                SettingSwitchRow(
                    title = "Daily Inventory Digest",
                    subtitle = "Receive morning summary of dispatches and levels",
                    checked = dailyDigest,
                    onCheckedChange = { viewModel.dailyDigest.value = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                SettingSwitchRow(
                    title = "Supplier Order Reminders",
                    subtitle = "Alert when re-orders should be placed",
                    checked = supplierAlerts,
                    onCheckedChange = { viewModel.supplierAlerts.value = it }
                )
            }
        }

        // Stock Control
        SwayogCard {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "📦 Stock Rules & Policies",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                SettingSwitchRow(
                    title = "Auto-Approve Adjustments",
                    subtitle = "Automatically update stock counts on dispatch",
                    checked = autoApprove,
                    onCheckedChange = { viewModel.autoApproveAdjustments.value = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                SettingSwitchRow(
                    title = "Require Reason for Adjustments",
                    subtitle = "Mandate remarks field when editing quantities",
                    checked = requireReason,
                    onCheckedChange = { viewModel.requireReasonForAdjustments.value = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                SettingSwitchRow(
                    title = "Allow Negative Stock",
                    subtitle = "Allow dispatches even if on-hand quantity is 0",
                    checked = allowNegative,
                    onCheckedChange = { viewModel.allowNegativeStock.value = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Default Min Threshold", fontWeight = FontWeight.SemiBold)
                        Text("Default threshold units for new items", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("$defaultThreshold units", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        }

        // Localization
        SwayogCard {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "🌐 Localization",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Default Currency", fontWeight = FontWeight.SemiBold)
                        Text("Indian Rupee (INR ₹)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("INR", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Timezone", fontWeight = FontWeight.SemiBold)
                        Text("Asia/Kolkata (IST)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("IST", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        }

        Button(
            onClick = onSaveSuccess,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Save, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Save Preferences")
        }
    }
}

@Composable
private fun SettingSwitchRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
private fun KpiStatCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Medium
                )
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(18.dp))
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
