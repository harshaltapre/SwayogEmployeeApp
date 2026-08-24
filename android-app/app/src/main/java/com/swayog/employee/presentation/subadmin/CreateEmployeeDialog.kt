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
import com.swayog.employee.data.model.CreateEmployeeRequest
import com.swayog.employee.presentation.common.components.SwayogTextField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEmployeeDialog(
    onDismiss: () -> Unit,
    onCreateEmployee: (CreateEmployeeRequest) -> Unit
) {
    val context = LocalContext.current
    var loginId by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("EMPLOYEE") }
    var jobRole by remember { mutableStateOf("Service Engineer") }
    var designationTitle by remember { mutableStateOf("Engineer") }

    val roles = listOf("EMPLOYEE", "SUB_ADMIN", "ADMIN", "PARTNER", "EPC_CONTRACTOR")
    val jobRoles = listOf("Service Engineer", "Installer", "O&M Technician", "Electrical Engineer", "Site Survey Engineer", "Inventory Executive", "Service Coordinator")
    
    var roleExpanded by remember { mutableStateOf(false) }
    var jobRoleExpanded by remember { mutableStateOf(false) }

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
                        text = "Add New Employee",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Divider()

                SwayogTextField(
                    value = loginId,
                    onValueChange = { loginId = it },
                    label = "Login ID",
                    placeholder = "e.g. emp_rahul"
                )

                SwayogTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password (Optional)",
                    placeholder = "Enter initial password"
                )

                SwayogTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = "Full Name",
                    placeholder = "e.g. Rahul Sharma"
                )

                SwayogTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email Address",
                    placeholder = "e.g. rahul@swayog.com"
                )

                SwayogTextField(
                    value = phoneNumber,
                    onValueChange = { phoneNumber = it },
                    label = "Phone Number",
                    placeholder = "e.g. +91 9876543210"
                )

                // Role Dropdown
                ExposedDropdownMenuBox(
                    expanded = roleExpanded,
                    onExpandedChange = { roleExpanded = !roleExpanded }
                ) {
                    OutlinedTextField(
                        value = role,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("System Role") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = roleExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = roleExpanded,
                        onDismissRequest = { roleExpanded = false }
                    ) {
                        roles.forEach { item ->
                            DropdownMenuItem(
                                text = { Text(item) },
                                onClick = {
                                    role = item
                                    roleExpanded = false
                                }
                            )
                        }
                    }
                }

                // Job Role Dropdown
                ExposedDropdownMenuBox(
                    expanded = jobRoleExpanded,
                    onExpandedChange = { jobRoleExpanded = !jobRoleExpanded }
                ) {
                    OutlinedTextField(
                        value = jobRole,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Job Role") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = jobRoleExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = jobRoleExpanded,
                        onDismissRequest = { jobRoleExpanded = false }
                    ) {
                        jobRoles.forEach { item ->
                            DropdownMenuItem(
                                text = { Text(item) },
                                onClick = {
                                    jobRole = item
                                    jobRoleExpanded = false
                                }
                            )
                        }
                    }
                }

                SwayogTextField(
                    value = designationTitle,
                    onValueChange = { designationTitle = it },
                    label = "Designation Title",
                    placeholder = "e.g. Senior Technician"
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
                            if (loginId.isBlank() || fullName.isBlank()) {
                                Toast.makeText(context, "Please fill in Login ID and Full Name", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            val req = CreateEmployeeRequest(
                                loginId = loginId.trim(),
                                fullName = fullName.trim(),
                                email = email.trim(),
                                phoneNumber = phoneNumber.trim().ifEmpty { null },
                                role = role,
                                departmentId = null,
                                reportingManagerId = null,
                                jobRole = jobRole,
                                zone = null,
                                isActive = true
                            )
                            onCreateEmployee(req)
                        }
                    ) {
                        Text("Create Employee")
                    }
                }
            }
        }
    }
}
