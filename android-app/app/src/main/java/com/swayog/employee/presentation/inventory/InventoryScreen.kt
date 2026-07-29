package com.swayog.employee.presentation.inventory

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
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.data.model.CreateInventoryRequest
import com.swayog.employee.data.model.InventoryItem
import com.swayog.employee.data.model.UpdateInventoryRequest
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTopBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    onNavigateBack: () -> Unit,
    viewModel: InventoryViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val inventoryState by viewModel.inventoryState.collectAsState()
    val inventoryItems by viewModel.inventoryItems.collectAsState()
    
    var showAddDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var itemToEdit by remember { mutableStateOf<InventoryItem?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var itemToDelete by remember { mutableStateOf<InventoryItem?>(null) }

    LaunchedEffect(inventoryState) {
        if (inventoryState is InventoryState.Error) {
            Toast.makeText(context, (inventoryState as InventoryState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Inventory Management",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadInventoryItems() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Item")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (inventoryState is InventoryState.Loading && inventoryItems.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (inventoryItems.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Inventory,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No inventory items",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(inventoryItems, key = { it.id }) { item ->
                        InventoryItemCard(
                            item = item,
                            onEditClick = {
                                itemToEdit = item
                                showEditDialog = true
                            },
                            onDeleteClick = {
                                itemToDelete = item
                                showDeleteDialog = true
                            }
                        )
                    }
                }
            }
        }
    }

    // Add Item Dialog
    if (showAddDialog) {
        AddInventoryItemDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { request: CreateInventoryRequest ->
                viewModel.createInventoryItem(
                    request = request,
                    onSuccess = {
                        showAddDialog = false
                        Toast.makeText(context, "Item created successfully", Toast.LENGTH_SHORT).show()
                    },
                    onError = { error: String ->
                        Toast.makeText(context, error, Toast.LENGTH_LONG).show()
                    }
                )
            }
        )
    }

    // Edit Item Dialog
    if (showEditDialog && itemToEdit != null) {
        EditInventoryItemDialog(
            item = itemToEdit!!,
            onDismiss = { 
                showEditDialog = false
                itemToEdit = null
            },
            onConfirm = { request: UpdateInventoryRequest ->
                viewModel.updateInventoryItem(
                    id = itemToEdit!!.id.toString(),
                    request = request,
                    onSuccess = {
                        showEditDialog = false
                        itemToEdit = null
                        Toast.makeText(context, "Item updated successfully", Toast.LENGTH_SHORT).show()
                    },
                    onError = { error: String ->
                        Toast.makeText(context, error, Toast.LENGTH_LONG).show()
                    }
                )
            }
        )
    }

    // Delete Confirmation Dialog
    if (showDeleteDialog && itemToDelete != null) {
        AlertDialog(
            onDismissRequest = { 
                showDeleteDialog = false
                itemToDelete = null
            },
            title = { Text("Delete Item") },
            text = { 
                Text("Are you sure you want to delete ${itemToDelete!!.name}? This action cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteInventoryItem(
                            id = itemToDelete!!.id.toString(),
                            onSuccess = {
                                showDeleteDialog = false
                                itemToDelete = null
                                Toast.makeText(context, "Item deleted successfully", Toast.LENGTH_SHORT).show()
                            },
                            onError = { error ->
                                showDeleteDialog = false
                                itemToDelete = null
                                Toast.makeText(context, "Failed to delete item: $error", Toast.LENGTH_LONG).show()
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
                        itemToDelete = null
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun InventoryItemCard(
    item: InventoryItem,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    val isLowStock = item.inStock <= item.minThreshold
    val statusColor = if (isLowStock) Color(0xFFEF4444) else Color(0xFF10B981)
    val statusText = if (isLowStock) "Low Stock" else "In Stock"

    SwayogCard {
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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "SKU: ${item.sku}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
                Surface(
                    color = statusColor.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = statusText,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }

            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Stock: ${item.inStock}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "Min: ${item.minThreshold}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Category: ${item.category}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                Text(
                    text = "₹${item.pricePerUnit}/unit",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium
                )
            }

            item.supplier?.let { supplier ->
                Text(
                    text = "Supplier: $supplier",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onEditClick,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Edit")
                }
                OutlinedButton(
                    onClick = onDeleteClick,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Delete")
                }
            }
        }
    }
}

@Composable
fun AddInventoryItemDialog(
    onDismiss: () -> Unit,
    onConfirm: (CreateInventoryRequest) -> Unit
) {
    var sku by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var inStock by remember { mutableStateOf("0") }
    var minThreshold by remember { mutableStateOf("0") }
    var supplier by remember { mutableStateOf("") }
    var pricePerUnit by remember { mutableStateOf("0.0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Inventory Item") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = sku,
                    onValueChange = { sku = it },
                    label = { Text("SKU") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("Category") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = inStock,
                    onValueChange = { inStock = it },
                    label = { Text("In Stock") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = minThreshold,
                    onValueChange = { minThreshold = it },
                    label = { Text("Min Threshold") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = supplier,
                    onValueChange = { supplier = it },
                    label = { Text("Supplier") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = pricePerUnit,
                    onValueChange = { pricePerUnit = it },
                    label = { Text("Price Per Unit") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (sku.isNotBlank() && name.isNotBlank() && category.isNotBlank()) {
                        onConfirm(
                            CreateInventoryRequest(
                                sku = sku,
                                name = name,
                                category = category,
                                inStock = inStock.toIntOrNull() ?: 0,
                                minThreshold = minThreshold.toIntOrNull() ?: 0,
                                supplier = supplier.ifBlank { null },
                                pricePerUnit = pricePerUnit.toFloatOrNull() ?: 0f,
                                entryDate = null
                            )
                        )
                    }
                }
            ) {
                Text("Add")
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
fun EditInventoryItemDialog(
    item: InventoryItem,
    onDismiss: () -> Unit,
    onConfirm: (UpdateInventoryRequest) -> Unit
) {
    var sku by remember { mutableStateOf(item.sku) }
    var name by remember { mutableStateOf(item.name) }
    var category by remember { mutableStateOf(item.category) }
    var inStock by remember { mutableStateOf(item.inStock.toString()) }
    var minThreshold by remember { mutableStateOf(item.minThreshold.toString()) }
    var supplier by remember { mutableStateOf(item.supplier ?: "") }
    var pricePerUnit by remember { mutableStateOf(item.pricePerUnit.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Inventory Item") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = sku,
                    onValueChange = { sku = it },
                    label = { Text("SKU") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("Category") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = inStock,
                    onValueChange = { inStock = it },
                    label = { Text("In Stock") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = minThreshold,
                    onValueChange = { minThreshold = it },
                    label = { Text("Min Threshold") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = supplier,
                    onValueChange = { supplier = it },
                    label = { Text("Supplier") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = pricePerUnit,
                    onValueChange = { pricePerUnit = it },
                    label = { Text("Price Per Unit") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onConfirm(
                        UpdateInventoryRequest(
                            sku = sku.ifBlank { null },
                            name = name.ifBlank { null },
                            category = category.ifBlank { null },
                            inStock = inStock.toIntOrNull(),
                            minThreshold = minThreshold.toIntOrNull(),
                            supplier = supplier.ifBlank { null },
                            pricePerUnit = pricePerUnit.toFloatOrNull(),
                            entryDate = null
                        )
                    )
                }
            ) {
                Text("Update")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
