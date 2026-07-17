package com.swayog.employee.presentation.subadmin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.swayog.employee.data.model.CreateInvoiceRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddInvoiceDialog(
    customerId: Int,
    onDismiss: () -> Unit,
    onSave: (CreateInvoiceRequest) -> Unit
) {
    var description by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("pending") }
    var paymentMethod by remember { mutableStateOf("online") }

    var isStatusDropdownExpanded by remember { mutableStateOf(false) }
    var isPaymentMethodDropdownExpanded by remember { mutableStateOf(false) }

    val statusOptions = listOf("pending", "paid")
    val paymentMethodOptions = listOf("online", "offline")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Invoice") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )

                ExposedDropdownMenuBox(
                    expanded = isStatusDropdownExpanded,
                    onExpandedChange = { isStatusDropdownExpanded = it }
                ) {
                    OutlinedTextField(
                        value = status,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Status") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isStatusDropdownExpanded) },
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = isStatusDropdownExpanded,
                        onDismissRequest = { isStatusDropdownExpanded = false }
                    ) {
                        statusOptions.forEach { selectionOption ->
                            DropdownMenuItem(
                                text = { Text(selectionOption) },
                                onClick = {
                                    status = selectionOption
                                    isStatusDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                ExposedDropdownMenuBox(
                    expanded = isPaymentMethodDropdownExpanded,
                    onExpandedChange = { isPaymentMethodDropdownExpanded = it }
                ) {
                    OutlinedTextField(
                        value = paymentMethod,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Payment Method") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isPaymentMethodDropdownExpanded) },
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = isPaymentMethodDropdownExpanded,
                        onDismissRequest = { isPaymentMethodDropdownExpanded = false }
                    ) {
                        paymentMethodOptions.forEach { selectionOption ->
                            DropdownMenuItem(
                                text = { Text(selectionOption) },
                                onClick = {
                                    paymentMethod = selectionOption
                                    isPaymentMethodDropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val parsedAmount = amount.toDoubleOrNull() ?: 0.0
                    if (description.isNotBlank() && date.isNotBlank() && parsedAmount > 0) {
                        onSave(
                            CreateInvoiceRequest(
                                customerId = customerId,
                                description = description,
                                amount = parsedAmount,
                                date = date,
                                status = status,
                                paymentMethod = paymentMethod
                            )
                        )
                    }
                }
            ) {
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
