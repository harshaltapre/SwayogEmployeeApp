package com.swayog.employee.presentation.subadmin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.CreateInvoiceRequest
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Invoice
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTextField
import com.swayog.employee.presentation.common.components.SwayogTopBar
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminFinancialsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SubAdminFinancialsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val invoices by viewModel.filteredInvoices.collectAsState()
    val customers by viewModel.customers.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val actionState by viewModel.actionState.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var isAddPaymentOpen by remember { mutableStateOf(false) }

    LaunchedEffect(searchQuery) {
        viewModel.searchInvoices(searchQuery)
    }

    LaunchedEffect(actionState) {
        when (actionState) {
            is FinancialsActionState.Success -> {
                Toast.makeText(context, (actionState as FinancialsActionState.Success).message, Toast.LENGTH_SHORT).show()
                isAddPaymentOpen = false
                viewModel.resetActionState()
            }
            is FinancialsActionState.Error -> {
                Toast.makeText(context, (actionState as FinancialsActionState.Error).message, Toast.LENGTH_SHORT).show()
                viewModel.resetActionState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Service & AMC Financials",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isAddPaymentOpen = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Log Payment")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Search Bar
            SwayogTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = "Search payments...",
                modifier = Modifier.fillMaxWidth()
            )

            if (isLoading && invoices.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (invoices.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No payment records found.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(invoices) { invoice ->
                        InvoiceCard(invoice = invoice)
                    }
                }
            }
        }

        if (isAddPaymentOpen) {
            AddPaymentDialog(
                customers = customers,
                onDismiss = { isAddPaymentOpen = false },
                onSubmit = { request -> viewModel.logPayment(request) },
                isLoading = actionState is FinancialsActionState.Loading
            )
        }
    }
}

@Composable
fun InvoiceCard(invoice: Invoice) {
    SwayogCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = invoice.invoiceNumber ?: "INV-${invoice.id.take(6)}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                val statusColor = when (invoice.status.lowercase()) {
                    "paid" -> Color(0xFF10B981)
                    "pending" -> Color(0xFFF59E0B)
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
                
                Surface(
                    color = statusColor.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = invoice.status.uppercase(),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Text(
                text = "Customer ID: ${invoice.customerId}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = invoice.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Divider(modifier = Modifier.padding(vertical = 4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Date", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Text(invoice.date.take(10), style = MaterialTheme.typography.bodyMedium)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Amount", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Text("₹${invoice.amount}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPaymentDialog(
    customers: List<Customer>,
    onDismiss: () -> Unit,
    onSubmit: (CreateInvoiceRequest) -> Unit,
    isLoading: Boolean
) {
    var selectedCustomerId by remember { mutableStateOf<Int?>(null) }
    var description by remember { mutableStateOf("AMC Payment") }
    var invoiceNumber by remember { mutableStateOf("") }
    var amountStr by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf("online") }
    var status by remember { mutableStateOf("pending") }
    var invoiceType by remember { mutableStateOf("amc") }
    var expandedCustomer by remember { mutableStateOf(false) }
    var expandedPaymentMethod by remember { mutableStateOf(false) }
    var expandedStatus by remember { mutableStateOf(false) }
    var expandedInvoiceType by remember { mutableStateOf(false) }

    val paymentMethods = listOf("online", "cash", "bank_transfer", "upi", "cheque")
    val statuses = listOf("pending", "paid", "failed")
    val invoiceTypes = listOf("amc", "service", "installation", "maintenance")

    AlertDialog(
        onDismissRequest = { if (!isLoading) onDismiss() },
        title = { Text("Log New Payment") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Customer Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedCustomer,
                    onExpandedChange = { expandedCustomer = it }
                ) {
                    SwayogTextField(
                        value = customers.find { it.id == selectedCustomerId }?.fullName ?: "Select Customer",
                        onValueChange = {},
                        enabled = false,
                        label = "Customer",
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedCustomer,
                        onDismissRequest = { expandedCustomer = false }
                    ) {
                        customers.forEach { cust ->
                            DropdownMenuItem(
                                text = { Text("${cust.fullName} (${cust.customerCode})") },
                                onClick = {
                                    selectedCustomerId = cust.id
                                    expandedCustomer = false
                                }
                            )
                        }
                    }
                }

                // Invoice Number
                SwayogTextField(
                    value = invoiceNumber,
                    onValueChange = { invoiceNumber = it },
                    label = "Invoice Number (Optional)",
                    placeholder = "e.g. INV-2026-001",
                    modifier = Modifier.fillMaxWidth()
                )

                // Description
                SwayogTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = "Description",
                    placeholder = "e.g. AMC Quarter 1 Payment",
                    modifier = Modifier.fillMaxWidth()
                )

                // Amount
                SwayogTextField(
                    value = amountStr,
                    onValueChange = { amountStr = it },
                    label = "Amount (₹)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.fillMaxWidth()
                )

                // Payment Method Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedPaymentMethod,
                    onExpandedChange = { expandedPaymentMethod = it }
                ) {
                    SwayogTextField(
                        value = paymentMethod.replaceFirstChar { it.uppercase() },
                        onValueChange = {},
                        enabled = false,
                        label = "Payment Method",
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedPaymentMethod,
                        onDismissRequest = { expandedPaymentMethod = false }
                    ) {
                        paymentMethods.forEach { method ->
                            DropdownMenuItem(
                                text = { Text(method.replaceFirstChar { it.uppercase() }) },
                                onClick = {
                                    paymentMethod = method
                                    expandedPaymentMethod = false
                                }
                            )
                        }
                    }
                }

                // Status Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedStatus,
                    onExpandedChange = { expandedStatus = it }
                ) {
                    SwayogTextField(
                        value = status.replaceFirstChar { it.uppercase() },
                        onValueChange = {},
                        enabled = false,
                        label = "Status",
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedStatus,
                        onDismissRequest = { expandedStatus = false }
                    ) {
                        statuses.forEach { stat ->
                            DropdownMenuItem(
                                text = { Text(stat.replaceFirstChar { it.uppercase() }) },
                                onClick = {
                                    status = stat
                                    expandedStatus = false
                                }
                            )
                        }
                    }
                }

                // Invoice Type Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedInvoiceType,
                    onExpandedChange = { expandedInvoiceType = it }
                ) {
                    SwayogTextField(
                        value = invoiceType.replaceFirstChar { it.uppercase() },
                        onValueChange = {},
                        enabled = false,
                        label = "Invoice Type",
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedInvoiceType,
                        onDismissRequest = { expandedInvoiceType = false }
                    ) {
                        invoiceTypes.forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type.replaceFirstChar { it.uppercase() }) },
                                onClick = {
                                    invoiceType = type
                                    expandedInvoiceType = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountStr.toDoubleOrNull() ?: 0.0
                    if (selectedCustomerId != null && amount > 0) {
                        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                        val request = CreateInvoiceRequest(
                            customerId = selectedCustomerId!!,
                            description = description,
                            amount = amount,
                            date = sdf.format(Date()),
                            status = status,
                            invoiceType = invoiceType,
                            paymentMethod = paymentMethod,
                            invoiceNumber = invoiceNumber.takeIf { it.isNotBlank() }
                        )
                        onSubmit(request)
                    }
                },
                enabled = !isLoading && selectedCustomerId != null && amountStr.isNotBlank()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Submit")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Cancel")
            }
        }
    )
}
