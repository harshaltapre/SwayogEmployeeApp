package com.swayog.employee.presentation.subadmin

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.UpdateCustomerRequest

// Brand options matching web implementation
private val INVERTER_BRANDS = listOf(
    "KSolar",
    "PVBlink", 
    "UTL Solar",
    "Waaree",
    "Vsole",
    "Solarman",
    "Growatt",
    "Havells",
    "Anchor"
)

// Connection type options per brand (matching web logic)
private fun getConnectionTypesForBrand(brand: String): List<String> {
    return when (brand) {
        "KSolar" -> listOf("ShineMonitor", "Simulation")
        "Growatt" -> listOf("GrowattPortal", "Simulation")
        "UTL Solar" -> listOf("FoxESS", "Simulation")
        "Solarman" -> listOf("Solarman", "Simulation")
        "Waaree" -> listOf("Waaree", "Simulation")
        else -> listOf("Simulation", "Solarman", "Solis", "ShineMonitor", "FoxESS")
    }
}

// Parse brand and connection type from stored brand string (matching web logic)
private fun parseBrandAndType(brandStr: String?): Pair<String, String> {
    if (brandStr == null) return Pair("", "Simulation")
    
    val brandLower = brandStr.lowercase()
    
    // Extract brand
    val brand = when {
        brandLower.contains("anchor") || brandLower.contains("panasonic") -> "Anchor Panasonic"
        brandLower.contains("pvblink") || brandLower.contains("pv blink") -> "PV Blink"
        brandLower.contains("utl") || brandLower.contains("foxess") -> "UTL Solar"
        brandLower.contains("solarman") || brandLower.contains("solar men") || brandLower.contains("solarmen") -> "Solar Men"
        brandLower.contains("solus") -> "Solus Cloud"
        brandLower.contains("havells") -> "Havells"
        brandLower.contains("polycab") -> "Polycab"
        brandLower.contains("waaree") || brandLower.contains("waree") -> "Waaree"
        brandLower.contains("ksolar") || brandLower.contains("k-solar") -> "KSolar"
        brandLower.contains("growatt") -> "Growatt"
        brandLower.contains("vsole") -> "Vsole"
        else -> brandStr
    }
    
    // Extract connection type
    val connectionType = when {
        brandLower.contains("(solarman)") -> "Solarman"
        brandLower.contains("(solis)") -> "Solis"
        brandLower.contains("(shinemonitor)") -> "ShineMonitor"
        brandLower.contains("(foxess)") -> "FoxESS"
        brandLower.contains("(growattportal)") -> "GrowattPortal"
        brandLower.contains("(growatt)") -> "GrowattPortal"
        brandLower.contains("(waaree)") -> "Waaree"
        brandLower.contains("solarman") || brandLower.contains("solar men") -> "Solarman"
        brandLower.contains("ksolar") || brandLower.contains("k-solar") -> "ShineMonitor"
        brandLower.contains("growatt") -> "GrowattPortal"
        brandLower.contains("utl") -> "FoxESS"
        brandLower.contains("waaree") -> "Waaree"
        else -> "Simulation"
    }
    
    return Pair(brand, connectionType)
}

// Build brand string with connection type (matching web logic)
private fun buildBrandString(brand: String, connectionType: String): String {
    return when {
        brand == "KSolar" && connectionType == "ShineMonitor" -> "KSolar"
        brand == "Growatt" && connectionType == "GrowattPortal" -> "Growatt (GrowattPortal)"
        brand == "UTL Solar" && connectionType == "FoxESS" -> "UTL"
        brand == "Solarman" && connectionType == "Solarman" -> "Solarman"
        !listOf("KSolar", "Growatt", "UTL Solar", "Solarman").contains(brand) && connectionType == "Simulation" -> brand
        else -> "$brand ($connectionType)"
    }
}

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
    
    // Inverter credential fields (matching web implementation)
    var selectedBrand by remember { mutableStateOf("") }
    var selectedConnectionType by remember { mutableStateOf("Simulation") }
    var inverterLoginId by remember { mutableStateOf(customer.inverterLoginId ?: "") }
    var inverterPassword by remember { mutableStateOf(customer.inverterPassword ?: "") }
    var inverterApiKey by remember { mutableStateOf(customer.inverterApiKey ?: "") }
    var inverterDeviceSn by remember { mutableStateOf(customer.inverterDeviceSn ?: "") }
    var stage by remember { mutableIntStateOf(customer.projectStage ?: 1) } // Changed default to 1 to match web range
    
    var brandDropdownExpanded by remember { mutableStateOf(false) }
    var connectionTypeDropdownExpanded by remember { mutableStateOf(false) }
    
    // Initialize brand and connection type from existing customer data
    LaunchedEffect(customer.inverterBrand) {
        val (brand, connectionType) = parseBrandAndType(customer.inverterBrand)
        selectedBrand = brand
        selectedConnectionType = connectionType
    }
    
    // Update connection type when brand changes (matching web logic)
    val connectionTypes = remember(selectedBrand) { getConnectionTypesForBrand(selectedBrand) }
    
    LaunchedEffect(selectedBrand) {
        if (selectedBrand.isNotEmpty() && !connectionTypes.contains(selectedConnectionType)) {
            selectedConnectionType = connectionTypes.firstOrNull() ?: "Simulation"
        }
    }

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

                // Basic customer details
                OutlinedTextField(
                    value = fullName, 
                    onValueChange = { fullName = it }, 
                    label = { Text("Full Name") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email, 
                    onValueChange = { email = it }, 
                    label = { Text("Email") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phoneNumber, 
                    onValueChange = { phoneNumber = it }, 
                    label = { Text("Phone Number") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = city, 
                    onValueChange = { city = it }, 
                    label = { Text("City") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = address, 
                    onValueChange = { address = it }, 
                    label = { Text("Address") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = systemSizeKw,
                    onValueChange = { systemSizeKw = it },
                    label = { Text("System Size (kW)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = installationDate, 
                    onValueChange = { installationDate = it }, 
                    label = { Text("Installation Date (YYYY-MM-DD)") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = amcStatus, 
                    onValueChange = { amcStatus = it }, 
                    label = { Text("AMC Status") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = amcExpiryDate, 
                    onValueChange = { amcExpiryDate = it }, 
                    label = { Text("AMC Expiry Date") }, 
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = commissionAmount,
                    onValueChange = { commissionAmount = it },
                    label = { Text("Commission Amount (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                // Inverter Details Section (matching web implementation)
                Text(
                    text = "Inverter Credentials", 
                    style = MaterialTheme.typography.titleMedium, 
                    fontWeight = FontWeight.Bold, 
                    modifier = Modifier.padding(top = 8.dp)
                )
                
                // Inverter Brand Dropdown (matching web)
                ExposedDropdownMenuBox(
                    expanded = brandDropdownExpanded,
                    onExpandedChange = { brandDropdownExpanded = it }
                ) {
                    OutlinedTextField(
                        value = selectedBrand,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Inverter Brand") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = brandDropdownExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = brandDropdownExpanded,
                        onDismissRequest = { brandDropdownExpanded = false }
                    ) {
                        INVERTER_BRANDS.forEach { brand ->
                            DropdownMenuItem(
                                text = { Text(brand) },
                                onClick = {
                                    selectedBrand = brand
                                    brandDropdownExpanded = false
                                    // Auto-select appropriate connection type
                                    val types = getConnectionTypesForBrand(brand)
                                    selectedConnectionType = types.firstOrNull() ?: "Simulation"
                                }
                            )
                        }
                    }
                }
                
                // API Connection Type Dropdown (conditional, matching web)
                if (selectedBrand.isNotEmpty()) {
                    ExposedDropdownMenuBox(
                        expanded = connectionTypeDropdownExpanded,
                        onExpandedChange = { connectionTypeDropdownExpanded = it }
                    ) {
                        OutlinedTextField(
                            value = selectedConnectionType,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("API Connection Type") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = connectionTypeDropdownExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = connectionTypeDropdownExpanded,
                            onDismissRequest = { connectionTypeDropdownExpanded = false }
                        ) {
                            connectionTypes.forEach { type ->
                                DropdownMenuItem(
                                    text = { Text(type) },
                                    onClick = {
                                        selectedConnectionType = type
                                        connectionTypeDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                // Conditional credential fields (matching web logic)
                if (selectedConnectionType != "Simulation" && selectedBrand.isNotEmpty()) {
                    if (selectedConnectionType != "Waaree") {
                        // Non-Waaree brands: Username/Password
                        OutlinedTextField(
                            value = inverterLoginId,
                            onValueChange = { inverterLoginId = it },
                            label = { Text("$selectedBrand Username / Login ID") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = inverterPassword,
                            onValueChange = { inverterPassword = it },
                            label = { Text("$selectedBrand Password") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        // Waaree: Token ID and Serial Number
                        OutlinedTextField(
                            value = inverterApiKey,
                            onValueChange = { inverterApiKey = it },
                            label = { Text("Waaree Token ID") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = inverterDeviceSn,
                            onValueChange = { inverterDeviceSn = it },
                            label = { Text("Inverter Serial Number (SN)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    
                    // Advanced API Settings for FoxESS/Solarman/Solis
                    if (listOf("FoxESS", "Solarman", "Solis").contains(selectedConnectionType)) {
                        Text(
                            text = "Advanced API Settings (Optional)",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = inverterApiKey,
                                onValueChange = { inverterApiKey = it },
                                label = { Text("API Key / App ID") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = inverterDeviceSn,
                                onValueChange = { inverterDeviceSn = it },
                                label = { Text("Device SN / Station ID") },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
                
                // Simulation notice
                if (selectedConnectionType == "Simulation" && selectedBrand.isNotEmpty()) {
                    Surface(
                        color = Color(0xFFFFF7ED),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Info,
                                contentDescription = null,
                                tint = Color(0xFFEA580C),
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "Telemetry Simulation Enabled - No API credentials required",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF9A3412)
                            )
                        }
                    }
                }
                
                // Project Stage (matching web range 1-10)
                Column {
                    Text(
                        text = "Project Stage: $stage", 
                        style = MaterialTheme.typography.labelMedium
                    )
                    Slider(
                        value = stage.toFloat(),
                        onValueChange = { stage = it.toInt() },
                        valueRange = 1f..10f, // Changed to match web range
                        steps = 8
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
                            // Build brand string with connection type (matching web logic)
                            val finalBrandString = if (selectedBrand.isNotEmpty()) {
                                buildBrandString(selectedBrand, selectedConnectionType)
                            } else {
                                null
                            }
                            
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
                                    inverterBrand = finalBrandString,
                                    inverterLoginId = inverterLoginId.ifBlank { null },
                                    inverterPassword = inverterPassword.ifBlank { null },
                                    inverterApiKey = inverterApiKey.ifBlank { null },
                                    inverterDeviceSn = inverterDeviceSn.ifBlank { null },
                                    portalPassword = null, // Not used in new implementation
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
