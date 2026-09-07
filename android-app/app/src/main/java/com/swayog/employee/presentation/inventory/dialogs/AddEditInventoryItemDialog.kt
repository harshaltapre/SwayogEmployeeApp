package com.swayog.employee.presentation.inventory.dialogs

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.swayog.employee.data.model.CreateInventoryRequest
import com.swayog.employee.data.model.InventoryItem
import com.swayog.employee.data.model.UpdateInventoryRequest
import com.swayog.employee.presentation.inventory.InventoryConstants
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditInventoryItemDialog(
    itemToEdit: InventoryItem? = null,
    onDismiss: () -> Unit,
    onSaveAdd: (CreateInventoryRequest) -> Unit,
    onSaveEdit: (String, UpdateInventoryRequest) -> Unit
) {
    val isEdit = itemToEdit != null
    var selectedPredefined by remember { mutableStateOf<String?>(null) }
    var name by remember { mutableStateOf(itemToEdit?.name ?: "") }
    var sku by remember { mutableStateOf(itemToEdit?.sku ?: "") }
    var category by remember { mutableStateOf(itemToEdit?.category ?: "solar_panels") }
    var company by remember { mutableStateOf(itemToEdit?.company ?: "") }
    var capacityKw by remember { mutableStateOf(itemToEdit?.capacityKw ?: "") }
    var unit by remember { mutableStateOf(itemToEdit?.unit ?: "unit") }
    var inStock by remember { mutableStateOf(itemToEdit?.inStock?.toString() ?: "0") }
    var minThreshold by remember { mutableStateOf(itemToEdit?.minThreshold?.toString() ?: "5") }
    var pricePerUnit by remember { mutableStateOf(itemToEdit?.pricePerUnit?.toString() ?: "0") }
    var supplier by remember { mutableStateOf(itemToEdit?.supplier ?: "") }
    var entryDate by remember {
        mutableStateOf(
            itemToEdit?.entryDate ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        )
    }

    var expandedPredefined by remember { mutableStateOf(false) }
    var expandedCategory by remember { mutableStateOf(false) }
    var expandedCompany by remember { mutableStateOf(false) }
    var expandedUnit by remember { mutableStateOf(false) }

    val isPanel = category.lowercase().contains("panel")
    val isInverter = category.lowercase().contains("inverter")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isEdit) "Edit Inventory Item" else "Add New Item",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Predefined template picker (only for Add)
                    if (!isEdit) {
                        ExposedDropdownMenuBox(
                            expanded = expandedPredefined,
                            onExpandedChange = { expandedPredefined = !expandedPredefined }
                        ) {
                            OutlinedTextField(
                                value = selectedPredefined ?: "Choose standard item template (Optional)",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Predefined Template") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedPredefined) },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = expandedPredefined,
                                onDismissRequest = { expandedPredefined = false }
                            ) {
                                InventoryConstants.PREDEFINED_ITEMS.forEach { item ->
                                    DropdownMenuItem(
                                        text = { Text(item) },
                                        onClick = {
                                            selectedPredefined = item
                                            name = item
                                            val autoCat = InventoryConstants.PREDEFINED_ITEM_CATEGORIES[item]
                                            if (autoCat != null) category = autoCat
                                            if (sku.isBlank()) {
                                                val clean = item.take(4).uppercase().filter { it.isLetter() }
                                                sku = "$clean-${(100..999).random()}"
                                            }
                                            expandedPredefined = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Item Name
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Item Name *") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // SKU
                    OutlinedTextField(
                        value = sku,
                        onValueChange = { sku = it },
                        label = { Text("SKU / Item Code *") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Category dropdown
                    ExposedDropdownMenuBox(
                        expanded = expandedCategory,
                        onExpandedChange = { expandedCategory = !expandedCategory }
                    ) {
                        val currentCategoryLabel = InventoryConstants.CATEGORIES
                            .firstOrNull { it.first == category }?.second ?: category
                        OutlinedTextField(
                            value = currentCategoryLabel,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Category *") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedCategory) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedCategory,
                            onDismissRequest = { expandedCategory = false }
                        ) {
                            InventoryConstants.CATEGORIES.filter { it.first != "all" }.forEach { (key, label) ->
                                DropdownMenuItem(
                                    text = { Text(label) },
                                    onClick = {
                                        category = key
                                        expandedCategory = false
                                    }
                                )
                            }
                        }
                    }

                    // Company/Brand if panels or inverters
                    if (isPanel || isInverter) {
                        val companyList = if (isPanel) InventoryConstants.DCR_PANEL_COMPANIES else InventoryConstants.INVERTER_COMPANIES
                        ExposedDropdownMenuBox(
                            expanded = expandedCompany,
                            onExpandedChange = { expandedCompany = !expandedCompany }
                        ) {
                            OutlinedTextField(
                                value = if (company.isBlank()) "Select Brand / Manufacturer" else company,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Brand / Manufacturer") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedCompany) },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = expandedCompany,
                                onDismissRequest = { expandedCompany = false }
                            ) {
                                companyList.forEach { comp ->
                                    DropdownMenuItem(
                                        text = { Text(comp) },
                                        onClick = {
                                            company = comp
                                            expandedCompany = false
                                        }
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = capacityKw,
                            onValueChange = { capacityKw = it },
                            label = { Text("Rated Capacity (kW / Wp)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Stock Unit Dropdown
                    ExposedDropdownMenuBox(
                        expanded = expandedUnit,
                        onExpandedChange = { expandedUnit = !expandedUnit }
                    ) {
                        val unitLabel = InventoryConstants.STOCK_UNITS.firstOrNull { it.value == unit }?.label ?: unit
                        OutlinedTextField(
                            value = unitLabel,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Unit of Measure") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedUnit) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedUnit,
                            onDismissRequest = { expandedUnit = false }
                        ) {
                            InventoryConstants.STOCK_UNITS.forEach { opt ->
                                DropdownMenuItem(
                                    text = { Text(opt.label) },
                                    onClick = {
                                        unit = opt.value
                                        expandedUnit = false
                                    }
                                )
                            }
                        }
                    }

                    // Quantities (In Stock & Min Threshold)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = inStock,
                            onValueChange = { inStock = it },
                            label = { Text("In Stock") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = minThreshold,
                            onValueChange = { minThreshold = it },
                            label = { Text("Min Alert Level") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Price per unit & Supplier
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = pricePerUnit,
                            onValueChange = { pricePerUnit = it },
                            label = { Text("Unit Price (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = supplier,
                            onValueChange = { supplier = it },
                            label = { Text("Supplier / Vendor") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (name.isBlank() || sku.isBlank()) return@Button
                            val stockInt = inStock.toIntOrNull() ?: 0
                            val minInt = minThreshold.toIntOrNull() ?: 0
                            val priceFloat = pricePerUnit.toFloatOrNull() ?: 0f

                            if (isEdit && itemToEdit != null) {
                                onSaveEdit(
                                    itemToEdit.id.toString(),
                                    UpdateInventoryRequest(
                                        name = name,
                                        sku = sku,
                                        category = category,
                                        company = company.ifBlank { null },
                                        capacityKw = capacityKw.ifBlank { null },
                                        unit = unit,
                                        inStock = stockInt,
                                        minThreshold = minInt,
                                        pricePerUnit = priceFloat,
                                        supplier = supplier.ifBlank { null }
                                    )
                                )
                            } else {
                                onSaveAdd(
                                    CreateInventoryRequest(
                                        name = name,
                                        sku = sku,
                                        category = category,
                                        company = company.ifBlank { null },
                                        capacityKw = capacityKw.ifBlank { null },
                                        unit = unit,
                                        inStock = stockInt,
                                        minThreshold = minInt,
                                        pricePerUnit = priceFloat,
                                        supplier = supplier.ifBlank { null },
                                        entryDate = entryDate
                                    )
                                )
                            }
                        },
                        enabled = name.isNotBlank() && sku.isNotBlank()
                    ) {
                        Text(if (isEdit) "Update Item" else "Save Item")
                    }
                }
            }
        }
    }
}
