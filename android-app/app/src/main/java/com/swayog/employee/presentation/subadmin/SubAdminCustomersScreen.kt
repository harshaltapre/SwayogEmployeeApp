package com.swayog.employee.presentation.subadmin

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.Customer
import com.swayog.employee.presentation.common.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminCustomersScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDetails: (Int) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SubAdminCustomersViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val customersState by viewModel.state.collectAsState()
    val filteredCustomers by viewModel.filteredCustomers.collectAsState()
    val cities by viewModel.cities.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedCity by viewModel.selectedCity.collectAsState()
    
    var showDeleteDialog by remember { mutableStateOf(false) }
    var customerToDelete by remember { mutableStateOf<Customer?>(null) }
    var isExporting by remember { mutableStateOf(false) }

    LaunchedEffect(customersState) {
        if (customersState is SubAdminCustomersState.Error) {
            Toast.makeText(context, (customersState as SubAdminCustomersState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            SwayogTopBar(
                title = "AMC Customers",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { 
                        isExporting = true
                        viewModel.exportCustomers(
                            onSuccess = { url ->
                                isExporting = false
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                context.startActivity(intent)
                                Toast.makeText(context, "Export successful!", Toast.LENGTH_SHORT).show()
                            },
                            onError = { error ->
                                isExporting = false
                                Toast.makeText(context, error, Toast.LENGTH_LONG).show()
                            }
                        )
                    }) {
                        if (isExporting) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Default.Download, contentDescription = "Export to Excel")
                        }
                    }
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Search Input
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Search by name, code, phone...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                // City Filter Chips Row
                if (cities.isNotEmpty()) {
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = selectedCity.isEmpty(),
                                onClick = { viewModel.setSelectedCity("") },
                                label = { Text("All Cities") }
                            )
                        }
                        items(cities) { city ->
                            FilterChip(
                                selected = selectedCity.equals(city, ignoreCase = true),
                                onClick = { viewModel.setSelectedCity(city) },
                                label = { Text(city) }
                            )
                        }
                    }
                }

                // Customers List
                if (customersState is SubAdminCustomersState.Loading && filteredCustomers.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else if (filteredCustomers.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = "No customers found.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredCustomers, key = { it.id }) { customer ->
                            CustomerListItem(
                                customer = customer,
                                onClick = { onNavigateToDetails(customer.id) },
                                onDeleteClick = {
                                    customerToDelete = customer
                                    showDeleteDialog = true
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (showDeleteDialog && customerToDelete != null) {
        AlertDialog(
            onDismissRequest = { 
                showDeleteDialog = false
                customerToDelete = null
            },
            title = { Text("Delete Customer") },
            text = { 
                Text("Are you sure you want to delete ${customerToDelete!!.fullName}? This action cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteCustomer(
                            customerId = customerToDelete!!.id,
                            onSuccess = {
                                showDeleteDialog = false
                                customerToDelete = null
                                Toast.makeText(context, "Customer deleted successfully", Toast.LENGTH_SHORT).show()
                            },
                            onError = { error ->
                                showDeleteDialog = false
                                customerToDelete = null
                                Toast.makeText(context, "Failed to delete customer: $error", Toast.LENGTH_LONG).show()
                            }
                        )
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showDeleteDialog = false
                        customerToDelete = null
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun CustomerListItem(
    customer: Customer,
    onClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    val amcStatusUpper = customer.amcStatus.uppercase()
    val (statusColor, statusBg) = when (amcStatusUpper) {
        "ACTIVE" -> Color(0xFF10B981) to Color(0xFFD1FAE5) // Green
        "EXPIRED" -> Color(0xFFEF4444) to Color(0xFFFEE2E2) // Red
        else -> Color(0xFF6B7280) to Color(0xFFF3F4F6) // Grey
    }

    SwayogCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = customer.fullName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        color = statusBg,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = customer.amcStatus.replaceFirstChar { it.uppercase() },
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                    
                    IconButton(
                        onClick = onDeleteClick,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Delete Customer",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "Code: ${customer.customerCode}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "City",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = customer.city ?: "N/A",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = "System Capacity",
                        tint = Color(0xFFF59E0B),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "${customer.systemSizeKw} kW",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
