package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminFinancials(viewModel: MainViewModel) {
    val customers by viewModel.customers.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var showAddInvoiceModal by remember { mutableStateOf(false) }
    var selectedCustomerId by remember { mutableStateOf<String?>(null) }
    var selectedCustomerName by remember { mutableStateOf("") }
    
    // Sync invoices and payments when screen loads
    LaunchedEffect(Unit) {
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.INVOICES)
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.PAYMENTS)
    }
    
    // Mock invoice data - in real app, this would come from API
    var invoices by remember {
        mutableStateOf(
            listOf(
                Invoice(
                    id = UUID.randomUUID().toString(),
                    invoiceNumber = "INV-2024-001",
                    customerId = "1",
                    customer = "John Doe",
                    date = "2024-06-15",
                    description = "AMC Cleaning Service",
                    invoiceType = "service",
                    amount = 5000.0,
                    paymentMethod = "UPI",
                    status = "paid"
                ),
                Invoice(
                    id = UUID.randomUUID().toString(),
                    invoiceNumber = "INV-2024-002",
                    customerId = "2",
                    customer = "Jane Smith",
                    date = "2024-06-18",
                    description = "Inverter Maintenance",
                    invoiceType = "service",
                    amount = 7500.0,
                    paymentMethod = "Bank Transfer",
                    status = "pending"
                ),
                Invoice(
                    id = UUID.randomUUID().toString(),
                    invoiceNumber = "INV-2024-003",
                    customerId = "3",
                    customer = "Rajesh Kumar",
                    date = "2024-06-20",
                    description = "Panel Cleaning",
                    invoiceType = "amc",
                    amount = 3000.0,
                    paymentMethod = "Cash",
                    status = "paid"
                )
            )
        )
    }
    
    val filteredInvoices = remember(invoices, searchQuery) {
        invoices.filter { invoice ->
            searchQuery.isEmpty() ||
            invoice.customer.contains(searchQuery, ignoreCase = true) ||
            invoice.invoiceNumber?.contains(searchQuery, ignoreCase = true) == true ||
            invoice.description?.contains(searchQuery, ignoreCase = true) == true
        }
    }
    
    // Calculate totals
    val totalAmount = filteredInvoices.sumOf { it.amount }
    val paidAmount = filteredInvoices.filter { it.status == "paid" }.sumOf { it.amount }
    val pendingAmount = filteredInvoices.filter { it.status == "pending" }.sumOf { it.amount }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Service & AMC Financials",
                    style = MaterialTheme.typography.headlineMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Manage customer AMC rates and log payment records",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MutedText,
                    fontSize = 14.sp
                )
            }
            
            Button(
                onClick = { showAddInvoiceModal = true },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = BackgroundDark)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Log Payment", color = BackgroundDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        
        // Summary Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FinancialSummaryCard(
                label = "Total Revenue",
                amount = totalAmount,
                color = PrimaryAmber,
                modifier = Modifier.weight(1f)
            )
            FinancialSummaryCard(
                label = "Collected",
                amount = paidAmount,
                color = SuccessGreen,
                modifier = Modifier.weight(1f)
            )
            FinancialSummaryCard(
                label = "Pending",
                amount = pendingAmount,
                color = Color.Red,
                modifier = Modifier.weight(1f)
            )
        }
        
        // Search and Filter
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search invoices...", color = MutedText) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                
                IconButton(
                    onClick = { /* Filter logic */ },
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(Icons.Default.FilterList, contentDescription = "Filter", tint = PrimaryAmber)
                }
            }
        }
        
        // Invoices Table
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth().weight(1f)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Table Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BackgroundDark)
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Text("Invoice", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.8f))
                    Text("Date", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.6f))
                    Text("Customer", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                    Text("Amount", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.6f))
                    Text("Status", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.6f))
                }
                Divider(color = BorderGray)
                
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (filteredInvoices.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No payment records found",
                                    color = MutedText,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    } else {
                        items(filteredInvoices) { invoice ->
                            InvoiceRow(
                                invoice = invoice,
                                onViewDetails = {
                                    selectedCustomerId = invoice.customerId
                                    selectedCustomerName = invoice.customer
                                }
                            )
                        }
                    }
                }
            }
        }
    }
    
    // Add Invoice Modal
    if (showAddInvoiceModal) {
        AddInvoiceModal(
            customers = customers,
            onDismiss = { showAddInvoiceModal = false },
            onSubmit = { newInvoice ->
                invoices = invoices + newInvoice
                showAddInvoiceModal = false
            }
        )
    }
    
    // Customer Payments Modal
    if (selectedCustomerId != null) {
        CustomerPaymentsModal(
            customerId = selectedCustomerId!!,
            customerName = selectedCustomerName,
            onDismiss = { selectedCustomerId = null }
        )
    }
}

@Composable
fun FinancialSummaryCard(
    label: String,
    amount: Double,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label,
                color = MutedText,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "₹${NumberFormat.getNumberInstance(Locale("en_IN")).format(amount)}",
                color = color,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun InvoiceRow(
    invoice: Invoice,
    onViewDetails: () -> Unit
) {
    val statusColor = when (invoice.status) {
        "paid" -> SuccessGreen
        "pending" -> PrimaryAmber
        else -> Color.Red
    }
    
    Card(
        colors = CardDefaults.cardColors(containerColor = BackgroundDark),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onViewDetails)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(0.8f)) {
                Text(
                    text = invoice.invoiceNumber ?: "N/A",
                    color = EngineeringBlue,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = invoice.invoiceType?.uppercase() ?: "SERVICE",
                    color = MutedText,
                    fontSize = 9.sp
                )
            }
            
            Text(
                text = invoice.date,
                color = NeutralText,
                fontSize = 11.sp,
                modifier = Modifier.weight(0.6f)
            )
            
            Text(
                text = invoice.customer,
                color = NeutralText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                maxLines = 1
            )
            
            Text(
                text = "₹${NumberFormat.getNumberInstance(Locale("en_IN")).format(invoice.amount)}",
                color = NeutralText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(0.6f)
            )
            
            Badge(
                containerColor = statusColor.copy(alpha = 0.2f),
                contentColor = statusColor,
                modifier = Modifier.weight(0.6f)
            ) {
                Text(
                    text = invoice.status.uppercase(),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddInvoiceModal(
    customers: List<com.example.swayogemployeeapp.data.remote.CustomerDto>,
    onDismiss: () -> Unit,
    onSubmit: (Invoice) -> Unit
) {
    var selectedCustomerId by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var invoiceType by remember { mutableStateOf("service") }
    var paymentMethod by remember { mutableStateOf("UPI") }
    var invoiceNumber by remember { mutableStateOf("INV-${System.currentTimeMillis()}") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { 
            Text(
                "Log New Payment",
                color = PrimaryAmber,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = invoiceNumber,
                    onValueChange = { invoiceNumber = it },
                    label = { Text("Invoice Number", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                
                var expanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = selectedCustomerId.let { id ->
                            customers.find { it.id.toString() == id }?.displayName() ?: "Select Customer"
                        },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Customer", color = MutedText) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        containerColor = SurfaceDark
                    ) {
                        customers.forEach { customer ->
                            DropdownMenuItem(
                                text = { Text(customer.displayName(), color = NeutralText) },
                                onClick = {
                                    selectedCustomerId = customer.id.toString()
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (₹)", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("service", "amc").forEach { type ->
                        FilterChip(
                            selected = invoiceType == type,
                            onClick = { invoiceType = type },
                            label = { Text(type.uppercase(), fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryAmber,
                                selectedLabelColor = BackgroundDark,
                                containerColor = BackgroundDark,
                                labelColor = MutedText
                            ),
                            modifier = Modifier.height(32.dp)
                        )
                    }
                }
                
                var paymentExpanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(
                    expanded = paymentExpanded,
                    onExpandedChange = { paymentExpanded = it }
                ) {
                    OutlinedTextField(
                        value = paymentMethod,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Payment Method", color = MutedText) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = paymentExpanded) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeutralText,
                            unfocusedTextColor = NeutralText,
                            focusedBorderColor = PrimaryAmber,
                            unfocusedBorderColor = BorderGray
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = paymentExpanded,
                        onDismissRequest = { paymentExpanded = false },
                        containerColor = SurfaceDark
                    ) {
                        listOf("UPI", "Bank Transfer", "Cash", "Cheque").forEach { method ->
                            DropdownMenuItem(
                                text = { Text(method, color = NeutralText) },
                                onClick = {
                                    paymentMethod = method
                                    paymentExpanded = false
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
                    val amountValue = amount.toDoubleOrNull() ?: 0.0
                    onSubmit(
                        Invoice(
                            id = UUID.randomUUID().toString(),
                            invoiceNumber = invoiceNumber,
                            customerId = selectedCustomerId,
                            customer = customers.find { it.id.toString() == selectedCustomerId }?.displayName() ?: "Unknown",
                            date = java.time.LocalDate.now().toString(),
                            description = description,
                            invoiceType = invoiceType,
                            amount = amountValue,
                            paymentMethod = paymentMethod,
                            status = "pending"
                        )
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                enabled = selectedCustomerId.isNotEmpty() && amount.isNotEmpty()
            ) {
                Text("Save", color = BackgroundDark, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = MutedText)
            }
        },
        containerColor = SurfaceDark
    )
}

@Composable
fun CustomerPaymentsModal(
    customerId: String,
    customerName: String,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { 
            Text(
                "Payment History",
                color = PrimaryAmber,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = customerName,
                    color = NeutralText,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Card(
                    colors = CardDefaults.cardColors(containerColor = BackgroundDark),
                    modifier = Modifier.fillMaxWidth().height(200.dp)
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Payment history will be loaded from API",
                            color = MutedText,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
            ) {
                Text("Close", color = BackgroundDark, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = SurfaceDark
    )
}

data class Invoice(
    val id: String,
    val invoiceNumber: String?,
    val customerId: String,
    val customer: String,
    val date: String,
    val description: String?,
    val invoiceType: String?,
    val amount: Double,
    val paymentMethod: String?,
    val status: String
)
