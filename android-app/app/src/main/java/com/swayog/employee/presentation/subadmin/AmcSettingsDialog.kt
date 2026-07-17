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
import com.swayog.employee.data.model.ApartmentAmcSettingsRequest
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
    var monthlyCleaningRate by remember { mutableStateOf((customer.monthlyCleaningRate ?: 0.0).toInt().toString()) }
    
    var cleaningWindows = remember { mutableStateListOf(
        customer.cleaningWindow1 ?: "1-10",
        customer.cleaningWindow2 ?: "11-20",
        customer.cleaningWindow3 ?: "21-30",
        customer.cleaningWindow4 ?: "",
        customer.cleaningWindow5 ?: "",
        customer.cleaningWindow6 ?: "",
        customer.cleaningWindow7 ?: "",
        customer.cleaningWindow8 ?: ""
    ) }
    
    var paymentTerms by remember { mutableStateOf(customer.paymentTerms ?: "") }
    var remarks by remember { mutableStateOf(customer.remarks ?: "") }
    var assignedEmployeeId by remember { mutableStateOf(customer.assignedEmployeeId ?: "") }
    var useVariableTiming by remember { mutableStateOf(false) }
    
    var cleaningTimeSlots = remember { mutableStateListOf(
        "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00"
    ) }
    
    var scheduleMonth by remember { mutableStateOf("2026-07") }
    var nextSurveyDate by remember { mutableStateOf("") }
    
    val clientTypes = listOf("pre_paid", "post_paid", "free_service", "corporate", "on_call")
    val cleaningsOptions = (1..8).map { it.toString() }
    
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
                                label = "Monthly Rate (?)",
                                placeholder = "500",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Cleaning Slots (Date Windows)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    val count = cleaningsPerMonth.toIntOrNull() ?: 1
                    for (i in 0 until count) {
                        SwayogTextField(
                            value = cleaningWindows[i], 
                            onValueChange = { cleaningWindows[i] = it }, 
                            label = "Slot ${i+1} (e.g. 1-10)", 
                            modifier = Modifier.fillMaxWidth()
                        )
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
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = useVariableTiming,
                            onCheckedChange = { useVariableTiming = it }
                        )
                        Text("Different time per cleaning visit", style = MaterialTheme.typography.bodyMedium)
                    }
                    
                    if (useVariableTiming) {
                        for (i in 0 until count) {
                            SwayogTextField(
                                value = cleaningTimeSlots[i],
                                onValueChange = { cleaningTimeSlots[i] = it },
                                label = "Cleaning ${i+1} Time Slot",
                                placeholder = "e.g. 09:00",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    } else {
                        SwayogTextField(
                            value = cleaningTimeSlots[0],
                            onValueChange = { newVal -> 
                                for(i in cleaningTimeSlots.indices) cleaningTimeSlots[i] = newVal
                            },
                            label = "Preferred Time Slot (All Visits)",
                            placeholder = "e.g. 09:00",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    
                    SwayogTextField(
                        value = scheduleMonth,
                        onValueChange = { scheduleMonth = it },
                        label = "Schedule Month (YYYY-MM)",
                        placeholder = "2026-07",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Other Settings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    SwayogTextField(
                        value = nextSurveyDate,
                        onValueChange = { nextSurveyDate = it },
                        label = "Next Survey Date (YYYY-MM-DD)",
                        placeholder = "e.g. 2026-08-01",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
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
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    SwayogButton(
                        text = "Save & Schedule",
                        modifier = Modifier.weight(1f),
                        onClick = {
                            val request = UpdateAmcSettingsRequest(
                                clientType = clientType,
                                consumerNumber = consumerNumber,
                                monthlyCleaningRate = monthlyCleaningRate.toIntOrNull(),
                                cleaningsPerMonth = cleaningsPerMonth.toIntOrNull() ?: 1,
                                cleaningWindow1 = cleaningWindows[0],
                                cleaningWindow2 = cleaningWindows[1],
                                cleaningWindow3 = cleaningWindows[2],
                                cleaningWindow4 = cleaningWindows[3],
                                cleaningWindow5 = cleaningWindows[4],
                                cleaningWindow6 = cleaningWindows[5],
                                cleaningWindow7 = cleaningWindows[6],
                                cleaningWindow8 = cleaningWindows[7],
                                nextSurveyDate = nextSurveyDate,
                                paymentTerms = paymentTerms,
                                remarks = remarks,
                                assignedEmployeeId = if (assignedEmployeeId.isBlank()) null else assignedEmployeeId,
                                useVariableTiming = useVariableTiming,
                                cleaningTimeSlot1 = cleaningTimeSlots[0],
                                cleaningTimeSlot2 = cleaningTimeSlots[1],
                                cleaningTimeSlot3 = cleaningTimeSlots[2],
                                cleaningTimeSlot4 = cleaningTimeSlots[3],
                                cleaningTimeSlot5 = cleaningTimeSlots[4],
                                cleaningTimeSlot6 = cleaningTimeSlots[5],
                                cleaningTimeSlot7 = cleaningTimeSlots[6],
                                cleaningTimeSlot8 = cleaningTimeSlots[7],
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
fun ApartmentAmcSettingsDialog(
    apartmentName: String,
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onSave: (ApartmentAmcSettingsRequest) -> Unit
) {
    var clientType by remember { mutableStateOf("post_paid") }
    var cleaningsPerMonth by remember { mutableStateOf("1") }
    var monthlyCleaningRate by remember { mutableStateOf("") }
    
    var cleaningWindows = remember { mutableStateListOf(
        "1-10", "11-20", "21-30", "", "", "", "", ""
    ) }
    
    var paymentTerms by remember { mutableStateOf("") }
    var remarks by remember { mutableStateOf("") }
    var assignedEmployeeId by remember { mutableStateOf("") }
    var useVariableTiming by remember { mutableStateOf(false) }
    
    var cleaningTimeSlots = remember { mutableStateListOf(
        "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00"
    ) }
    
    var scheduleMonth by remember { mutableStateOf("2026-07") }
    var nextSurveyDate by remember { mutableStateOf("") }
    
    val clientTypes = listOf("pre_paid", "post_paid", "free_service", "corporate", "on_call")
    val cleaningsOptions = (1..8).map { it.toString() }
    
    val employeeOptions = listOf("None") + employees.map { it.fullName }
    var selectedEmployeeName by remember { mutableStateOf("None") }

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
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Apartment AMC Settings", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text("Bulk configure settings for ${apartmentName}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha=0.6f))
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
                
                Divider()
                
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
                                label = "Client Type (Bulk)",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            SwayogTextField(
                                value = monthlyCleaningRate,
                                onValueChange = { monthlyCleaningRate = it },
                                label = "Monthly Rate (?) (Bulk)",
                                placeholder = "500",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    
                    AmcDropdown(
                        selectedOption = cleaningsPerMonth,
                        options = cleaningsOptions,
                        onOptionSelected = { cleaningsPerMonth = it },
                        label = "Cleanings / Month (Bulk)",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Cleaning Slots (Date Windows)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    val count = cleaningsPerMonth.toIntOrNull() ?: 1
                    for (i in 0 until count) {
                        SwayogTextField(
                            value = cleaningWindows[i], 
                            onValueChange = { cleaningWindows[i] = it }, 
                            label = "Slot ${i+1} (e.g. 1-10)", 
                            modifier = Modifier.fillMaxWidth()
                        )
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
                        label = "Assigned Employee (Bulk)",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = useVariableTiming,
                            onCheckedChange = { useVariableTiming = it }
                        )
                        Text("Different time per cleaning visit", style = MaterialTheme.typography.bodyMedium)
                    }
                    
                    if (useVariableTiming) {
                        for (i in 0 until count) {
                            SwayogTextField(
                                value = cleaningTimeSlots[i],
                                onValueChange = { cleaningTimeSlots[i] = it },
                                label = "Cleaning ${i+1} Time Slot",
                                placeholder = "e.g. 09:00",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    } else {
                        SwayogTextField(
                            value = cleaningTimeSlots[0],
                            onValueChange = { newVal -> 
                                for(i in cleaningTimeSlots.indices) cleaningTimeSlots[i] = newVal
                            },
                            label = "Preferred Time Slot (All Visits)",
                            placeholder = "e.g. 09:00",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    
                    SwayogTextField(
                        value = scheduleMonth,
                        onValueChange = { scheduleMonth = it },
                        label = "Schedule Month (YYYY-MM)",
                        placeholder = "2026-07",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Text("Other Settings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    
                    SwayogTextField(
                        value = nextSurveyDate,
                        onValueChange = { nextSurveyDate = it },
                        label = "Next Survey Date (YYYY-MM-DD)",
                        placeholder = "e.g. 2026-08-01",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    SwayogTextField(
                        value = paymentTerms,
                        onValueChange = { paymentTerms = it },
                        label = "Payment Terms (Bulk)",
                        placeholder = "e.g. 100% advance",
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    SwayogTextField(
                        value = remarks,
                        onValueChange = { remarks = it },
                        label = "Remarks (Bulk)",
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    SwayogButton(
                        text = "Apply to All Customers",
                        modifier = Modifier.weight(1f),
                        onClick = {
                            val request = ApartmentAmcSettingsRequest(
                                clientType = clientType,
                                monthlyCleaningRate = monthlyCleaningRate.toIntOrNull(),
                                cleaningsPerMonth = cleaningsPerMonth.toIntOrNull() ?: 1,
                                cleaningWindow1 = cleaningWindows[0],
                                cleaningWindow2 = cleaningWindows[1],
                                cleaningWindow3 = cleaningWindows[2],
                                cleaningWindow4 = cleaningWindows[3],
                                cleaningWindow5 = cleaningWindows[4],
                                cleaningWindow6 = cleaningWindows[5],
                                cleaningWindow7 = cleaningWindows[6],
                                cleaningWindow8 = cleaningWindows[7],
                                nextSurveyDate = nextSurveyDate,
                                paymentTerms = paymentTerms,
                                remarks = remarks,
                                assignedEmployeeId = if (assignedEmployeeId.isBlank()) null else assignedEmployeeId,
                                useVariableTiming = useVariableTiming,
                                cleaningTimeSlot1 = cleaningTimeSlots[0],
                                cleaningTimeSlot2 = cleaningTimeSlots[1],
                                cleaningTimeSlot3 = cleaningTimeSlots[2],
                                cleaningTimeSlot4 = cleaningTimeSlots[3],
                                cleaningTimeSlot5 = cleaningTimeSlots[4],
                                cleaningTimeSlot6 = cleaningTimeSlots[5],
                                cleaningTimeSlot7 = cleaningTimeSlots[6],
                                cleaningTimeSlot8 = cleaningTimeSlots[7],
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
            modifier = Modifier.menuAnchor().fillMaxWidth()
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
