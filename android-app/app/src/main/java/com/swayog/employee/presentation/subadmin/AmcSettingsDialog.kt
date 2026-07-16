package com.swayog.employee.presentation.subadmin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.UpdateAmcSettingsRequest
import com.swayog.employee.presentation.common.components.SwayogButton
import com.swayog.employee.presentation.common.components.SwayogTextField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcSettingsDialog(
    customer: Customer,
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onSave: (UpdateAmcSettingsRequest) -> Unit
) {
    var clientType by remember { mutableStateOf(customer.clientType ?: "post_paid") }
    var consumerNumber by remember { mutableStateOf(customer.consumerNumber ?: "") }
    var cleaningsPerMonth by remember { mutableStateOf((customer.cleaningsPerMonth ?: 1).toString()) }
    var monthlyCleaningRate by remember { mutableStateOf((customer.monthlyCleaningRate ?: 0.0).toString()) }
    
    var cleaningWindow1 by remember { mutableStateOf(customer.cleaningWindow1 ?: "1-10") }
    var cleaningWindow2 by remember { mutableStateOf(customer.cleaningWindow2 ?: "11-20") }
    var cleaningWindow3 by remember { mutableStateOf(customer.cleaningWindow3 ?: "21-30") }
    var cleaningWindow4 by remember { mutableStateOf(customer.cleaningWindow4 ?: "") }
    
    var paymentTerms by remember { mutableStateOf(customer.paymentTerms ?: "") }
    var remarks by remember { mutableStateOf(customer.remarks ?: "") }
    var assignedEmployeeId by remember { mutableStateOf(customer.assignedEmployeeId ?: "") }
    var useVariableTiming by remember { mutableStateOf(false) }
    var cleaningTimeSlot1 by remember { mutableStateOf("09:00") }
    var scheduleMonth by remember { mutableStateOf("2026-07") } // Hardcoded default, can be dynamic
    
    val clientTypes = listOf("pre_paid", "post_paid", "free_service", "corporate", "on_call")
    val cleaningsOptions = (1..4).map { it.toString() }
    
    val employeeOptions = listOf("None") + employees.map { it.fullName }
    var selectedEmployeeName by remember { 
        mutableStateOf(employees.find { it.id == assignedEmployeeId }?.fullName ?: "None") 
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("AMC Settings", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text("Configure AMC settings for ${customer.fullName}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha=0.6f))
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
                
                Divider()
                
                // Form Content
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("General Settings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            AmcDropdown(
                                selectedOption = clientType,
                                options = clientTypes,
                                onOptionSelected = { clientType = it },
                                label = "Client Type",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            SwayogTextField(
                                value = consumerNumber,
                                onValueChange = { consumerNumber = it },
                                label = "Consumer Number",
                                placeholder = "Enter ID",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            AmcDropdown(
                                selectedOption = cleaningsPerMonth,
                                options = cleaningsOptions,
                                onOptionSelected = { cleaningsPerMonth = it },
                                label = "Cleanings / Month",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            SwayogTextField(
                                value = monthlyCleaningRate,
                                onValueChange = { monthlyCleaningRate = it },
                                label = "Monthly Rate (₹)",
                                placeholder = "500",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Cleaning Slots (Date Windows)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    val count = cleaningsPerMonth.toIntOrNull() ?: 1
                    if (count >= 1) {
                        SwayogTextField(value = cleaningWindow1, onValueChange = { cleaningWindow1 = it }, label = "Slot 1 (e.g. 1-10)", modifier = Modifier.fillMaxWidth())
                    }
                    if (count >= 2) {
                        SwayogTextField(value = cleaningWindow2, onValueChange = { cleaningWindow2 = it }, label = "Slot 2 (e.g. 11-20)", modifier = Modifier.fillMaxWidth())
                    }
                    if (count >= 3) {
                        SwayogTextField(value = cleaningWindow3, onValueChange = { cleaningWindow3 = it }, label = "Slot 3 (e.g. 21-30)", modifier = Modifier.fillMaxWidth())
                    }
                    if (count >= 4) {
                        SwayogTextField(value = cleaningWindow4, onValueChange = { cleaningWindow4 = it }, label = "Slot 4", modifier = Modifier.fillMaxWidth())
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Visit Timing & Employee", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    AmcDropdown(
                        selectedOption = selectedEmployeeName,
                        options = employeeOptions,
                        onOptionSelected = { name ->
                            selectedEmployeeName = name
                            assignedEmployeeId = if (name == "None") "" else employees.find { it.fullName == name }?.id ?: ""
                        },
                        label = "Assigned Employee",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    SwayogTextField(
                        value = cleaningTimeSlot1,
                        onValueChange = { cleaningTimeSlot1 = it },
                        label = "Preferred Time Slot",
                        placeholder = "e.g. 09:00 AM",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Other Settings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    SwayogTextField(
                        value = paymentTerms,
                        onValueChange = { paymentTerms = it },
                        label = "Payment Terms",
                        placeholder = "e.g. 100% advance",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    SwayogTextField(
                        value = remarks,
                        onValueChange = { remarks = it },
                        label = "Remarks",
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                
                // Footer
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, modifier = Modifier.padding(end = 8.dp)) {
                        Text("Cancel")
                    }
                    SwayogButton(
                        text = "Save Settings",
                        onClick = {
                            val request = UpdateAmcSettingsRequest(
                                clientType = clientType,
                                consumerNumber = consumerNumber.takeIf { it.isNotBlank() },
                                monthlyCleaningRate = monthlyCleaningRate.toDoubleOrNull() ?: 0.0,
                                cleaningsPerMonth = cleaningsPerMonth.toIntOrNull() ?: 1,
                                cleaningWindow1 = cleaningWindow1,
                                cleaningWindow2 = cleaningWindow2.takeIf { (cleaningsPerMonth.toIntOrNull() ?: 1) >= 2 },
                                cleaningWindow3 = cleaningWindow3.takeIf { (cleaningsPerMonth.toIntOrNull() ?: 1) >= 3 },
                                cleaningWindow4 = cleaningWindow4.takeIf { (cleaningsPerMonth.toIntOrNull() ?: 1) >= 4 },
                                cleaningWindow5 = null,
                                cleaningWindow6 = null,
                                cleaningWindow7 = null,
                                cleaningWindow8 = null,
                                nextSurveyDate = null,
                                paymentTerms = paymentTerms.takeIf { it.isNotBlank() },
                                remarks = remarks.takeIf { it.isNotBlank() },
                                assignedEmployeeId = assignedEmployeeId.takeIf { it.isNotBlank() },
                                useVariableTiming = useVariableTiming,
                                cleaningTimeSlot1 = cleaningTimeSlot1,
                                cleaningTimeSlot2 = cleaningTimeSlot1,
                                cleaningTimeSlot3 = cleaningTimeSlot1,
                                cleaningTimeSlot4 = cleaningTimeSlot1,
                                scheduleMonth = scheduleMonth
                            )
                            onSave(request)
                        }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcDropdown(
    selectedOption: String,
    options: List<String>,
    onOptionSelected: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = selectedOption,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
            modifier = Modifier.menuAnchor()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { selectionOption ->
                DropdownMenuItem(
                    text = { Text(selectionOption) },
                    onClick = {
                        onOptionSelected(selectionOption)
                        expanded = false
                    }
                )
            }
        }
    }
}
