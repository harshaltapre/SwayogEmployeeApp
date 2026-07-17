package com.swayog.employee.presentation.subadmin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.UpdateCustomerRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditCustomerDialog(
    customer: Customer,
    onDismiss: () -> Unit,
    onSubmit: (UpdateCustomerRequest) -> Unit,
    isLoading: Boolean
) {
    var fullName by remember { mutableStateOf(customer.fullName) }
    var email by remember { mutableStateOf(customer.email) }
    var phoneNumber by remember { mutableStateOf(customer.phoneNumber) }
    var city by remember { mutableStateOf(customer.city ?: "") }
    var address by remember { mutableStateOf(customer.address ?: "") }
    var systemSizeKw by remember { mutableStateOf(customer.systemSizeKw?.toString() ?: "") }
    var installationDate by remember { mutableStateOf(customer.installationDate ?: "") }
    var amcStatus by remember { mutableStateOf(customer.amcStatus) }
    var amcExpiryDate by remember { mutableStateOf(customer.amcExpiryDate ?: "") }
    var commissionAmount by remember { mutableStateOf(customer.commissionAmount?.toString() ?: "") }
    
    var inverterBrand by remember { mutableStateOf(customer.inverterBrand ?: "") }
    var loginId by remember { mutableStateOf(customer.inverterLoginId ?: "") }
    var password by remember { mutableStateOf(customer.inverterPassword ?: "") }
    var portalPassword by remember { mutableStateOf(customer.portalPassword ?: "") }
    var stage by remember { mutableIntStateOf(customer.projectStage ?: 0) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Edit Customer Details",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(value = fullName, onValueChange = { fullName = it }, label = { Text("Full Name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = phoneNumber, onValueChange = { phoneNumber = it }, label = { Text("Phone Number") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Address") }, modifier = Modifier.fillMaxWidth())
                
                OutlinedTextField(
                    value = systemSizeKw,
                    onValueChange = { systemSizeKw = it },
                    label = { Text("System Size (kW)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(value = installationDate, onValueChange = { installationDate = it }, label = { Text("Installation Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = amcStatus, onValueChange = { amcStatus = it }, label = { Text("AMC Status") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = amcExpiryDate, onValueChange = { amcExpiryDate = it }, label = { Text("AMC Expiry Date") }, modifier = Modifier.fillMaxWidth())
                
                OutlinedTextField(
                    value = commissionAmount,
                    onValueChange = { commissionAmount = it },
                    label = { Text("Commission Amount (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Text(text = "Inverter Details", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))
                OutlinedTextField(value = inverterBrand, onValueChange = { inverterBrand = it }, label = { Text("Inverter Brand") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = loginId, onValueChange = { loginId = it }, label = { Text("Login ID") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = portalPassword, onValueChange = { portalPassword = it }, label = { Text("Portal Password") }, modifier = Modifier.fillMaxWidth())
                
                Column {
                    Text(text = "Project Stage: $stage", style = MaterialTheme.typography.labelMedium)
                    Slider(
                        value = stage.toFloat(),
                        onValueChange = { stage = it.toInt() },
                        valueRange = 0f..4f,
                        steps = 3
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isLoading) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            onSubmit(
                                UpdateCustomerRequest(
                                    fullName = fullName.ifBlank { null },
                                    email = email.ifBlank { null },
                                    phoneNumber = phoneNumber.ifBlank { null },
                                    city = city.ifBlank { null },
                                    address = address.ifBlank { null },
                                    systemSizeKw = systemSizeKw.toFloatOrNull(),
                                    installationDate = installationDate.ifBlank { null },
                                    amcStatus = amcStatus.ifBlank { null },
                                    amcExpiryDate = amcExpiryDate.ifBlank { null },
                                    contractStartDate = null,
                                    contractEndDate = null,
                                    cleaningsPerMonth = null,
                                    status = customer.status,
                                    commissionAmount = commissionAmount.toDoubleOrNull(),
                                    inverterLoginId = loginId.ifBlank { null },
                                    inverterPassword = password.ifBlank { null },
                                    portalPassword = portalPassword.ifBlank { null },
                                    projectStage = stage
                                )
                            )
                        },
                        enabled = !isLoading
                    ) {
                        if (isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                        else Text("Save Changes")
                    }
                }
            }
        }
    }
}
