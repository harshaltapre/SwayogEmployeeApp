package com.swayog.employee.presentation.subadmin

import android.widget.Toast
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.swayog.employee.data.model.Employee
import com.swayog.employee.presentation.common.components.SwayogTextField
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignSiteVisitDialog(
    employees: List<Employee>,
    onDismiss: () -> Unit,
    onAssign: (
        employeeUserId: String,
        capacity: String,
        scheduledDateTime: String,
        address: String,
        customerName: String,
        customerPhone: String,
        siteInfo: String
    ) -> Unit
) {
    val context = LocalContext.current
    var selectedEmployee by remember { mutableStateOf<Employee?>(null) }
    var capacity by remember { mutableStateOf("") }
    var siteAddress by remember { mutableStateOf("") }
    var customerName by remember { mutableStateOf("") }
    var customerPhone by remember { mutableStateOf("") }
    var scheduledDateTime by remember {
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        mutableStateOf(sdf.format(Date()))
    }
    var siteInfo by remember { mutableStateOf("") }

    var employeeExpanded by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Assign Site Visit Task 📍",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                // Employee Dropdown selection
                ExposedDropdownMenuBox(
                    expanded = employeeExpanded,
                    onExpandedChange = { employeeExpanded = !employeeExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedEmployee?.fullName ?: "-- Select Employee * --",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Select Staff Member") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = employeeExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = employeeExpanded,
                        onDismissRequest = { employeeExpanded = false }
                    ) {
                        employees.forEach { emp ->
                            DropdownMenuItem(
                                text = {
                                    val jobRole = emp.employeeProfile?.jobRole ?: emp.role
                                    Text("${emp.fullName} (${jobRole})")
                                },
                                onClick = {
                                    selectedEmployee = emp
                                    employeeExpanded = false
                                }
                            )
                        }
                    }
                }

                SwayogTextField(
                    value = capacity,
                    onValueChange = { capacity = it },
                    label = "Site Capacity *",
                    placeholder = "e.g. 10 kW Rooftop / 500 kWp"
                )

                SwayogTextField(
                    value = scheduledDateTime,
                    onValueChange = { scheduledDateTime = it },
                    label = "Scheduled Date & Time *",
                    placeholder = "YYYY-MM-DD HH:MM"
                )

                SwayogTextField(
                    value = siteAddress,
                    onValueChange = { siteAddress = it },
                    label = "Site Address *",
                    placeholder = "Enter full site visit address...",
                    singleLine = false
                )

                SwayogTextField(
                    value = customerName,
                    onValueChange = { customerName = it },
                    label = "Customer Name (Optional)",
                    placeholder = "e.g. Rahul Sharma"
                )

                SwayogTextField(
                    value = customerPhone,
                    onValueChange = { customerPhone = it },
                    label = "Contact Phone (Optional)",
                    placeholder = "e.g. +91 9876543210",
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone
                )

                SwayogTextField(
                    value = siteInfo,
                    onValueChange = { siteInfo = it },
                    label = "Required Info & Special Instructions",
                    placeholder = "Enter feasibility checklist or survey instructions...",
                    singleLine = false
                )

                Spacer(modifier = Modifier.height(8.dp))

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
                            val emp = selectedEmployee
                            if (emp == null) {
                                Toast.makeText(context, "Please select an employee", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            if (capacity.isBlank()) {
                                Toast.makeText(context, "Please specify site capacity", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            if (siteAddress.isBlank()) {
                                Toast.makeText(context, "Please enter site address", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            if (scheduledDateTime.isBlank()) {
                                Toast.makeText(context, "Please schedule date & time", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            onAssign(
                                emp.id,
                                capacity.trim(),
                                scheduledDateTime.trim(),
                                siteAddress.trim(),
                                customerName.trim(),
                                customerPhone.trim(),
                                siteInfo.trim()
                            )
                        }
                    ) {
                        Text("Assign Task")
                    }
                }
            }
        }
    }
}
