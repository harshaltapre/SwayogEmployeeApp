package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MonitoringDashboard(viewModel: MainViewModel) {
    val coroutineScope = rememberCoroutineScope()
    var selectedAlert by remember { mutableStateOf<MockAlert?>(null) }
    var WhatsAppLoggedMessage by remember { mutableStateOf("") }
    var isSendingWhatsapp by remember { mutableStateOf(false) }

    val alertsList = listOf(
        MockAlert("SW-101 (John Doe)", "Generation Drop > 20%", "Expected 18.4 kWh. Actual 12.1 kWh. Regional solar irradiance looks peak.", true),
        MockAlert("SW-204 (Jane Smith)", "Communication Offline", "No telemetry packets received for 28 hours.", false),
        MockAlert("SW-302 (Rajesh Kumar)", "AC Grid Voltage High", "Over-voltage tripping at 11:32 AM.", true)
    )

    if (selectedAlert == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("SYSTEM PERFORMANCE MONITORS", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(alertsList) { alert ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedAlert = alert }
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (alert.isLowGen) Icons.Default.TrendingDown else Icons.Default.WifiOff,
                                    contentDescription = null,
                                    tint = if (alert.isLowGen) PrimaryAmber else Color.Red,
                                    modifier = Modifier.size(32.dp)
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text(alert.customer, color = NeutralText, fontWeight = FontWeight.Bold)
                                    Text(alert.title, color = if (alert.isLowGen) PrimaryAmber else Color.Red, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = PrimaryAmber)
                        }
                    }
                }
            }
        }
        return
    }

    val alert = selectedAlert!!

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { selectedAlert = null }) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryAmber)
            }
            Text("DIAGNOSTIC & DISPATCH ACTION", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // Performance Detail Card
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(alert.customer, style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
                Text(alert.title, color = if (alert.isLowGen) PrimaryAmber else Color.Red, style = Typography.titleMedium, fontWeight = FontWeight.Bold)
                Divider(color = BorderGray)
                Text(alert.description, color = MutedText, style = Typography.bodyMedium)
            }
        }

        // Telemetry APIs comparison
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("REGIONAL IRRADIANCE API INTEGRATION", style = Typography.labelSmall, color = EngineeringBlue, fontWeight = FontWeight.Bold)
                Text("Swayog Solar Telemetry API status: ACTIVE", color = SuccessGreen, fontSize = 12.sp)
                Text("Regional Ground Irradiance: 840 W/m² (Peak sunlight)", color = NeutralText)
                Text("Efficiency Yield Ratio: ${if (alert.isLowGen) "64% (ALERT)" else "0% (COMM_OUT)"}", color = if (alert.isLowGen) PrimaryAmber else Color.Red, fontWeight = FontWeight.Bold)
            }
        }

        // Action controls
        Text("DIRECT WIDGET ACTIONS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        
        // 1. WhatsApp template notifier
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("WhatsApp Client Outage Templates", color = NeutralText, fontWeight = FontWeight.Bold)
                
                Button(
                    onClick = {
                        isSendingWhatsapp = true
                        coroutineScope.launch {
                            delay(1000)
                            isSendingWhatsapp = false
                            WhatsAppLoggedMessage = "Sent pre-configured alert message templates via WhatsApp API!"
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isSendingWhatsapp) {
                        CircularProgressIndicator(color = NeutralText, modifier = Modifier.size(16.dp))
                    } else {
                        Icon(imageVector = Icons.Default.Send, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Notify Customer of System Check")
                    }
                }

                if (WhatsAppLoggedMessage.isNotEmpty()) {
                    Text(WhatsAppLoggedMessage, color = SuccessGreen, fontSize = 12.sp)
                }
            }
        }

        // 2. Dispatch shortcut
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Dispatch O&M Cleaning / Repair technician", color = NeutralText, fontWeight = FontWeight.Bold)
                
                Button(
                    onClick = {
                        // Dispatch locally
                        val generatedId = (1000 + Math.random() * 9000).toInt()
                        viewModel.assignTaskLocally(
                            EmployeeTaskEntity(
                                id = generatedId,
                                jobType = if (alert.isLowGen) "AMC Visit" else "Complaint",
                                description = "Triggered by performance alert: ${alert.title}",
                                scheduledTime = java.time.Instant.now().toString(),
                                status = "assigned",
                                customerName = alert.customer,
                                customerPhone = "+91 98765 43210",
                                address = "Client premises",
                                latitude = 19.12,
                                longitude = 72.89,
                                completionMessage = null,
                                completionDocumentUrl = null,
                                completedAt = null
                            )
                        )
                        selectedAlert = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(imageVector = Icons.Default.ElectricBolt, contentDescription = null, tint = BackgroundDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Auto Dispatch Crew", color = BackgroundDark)
                }
            }
        }
    }
}

data class MockAlert(
    val customer: String,
    val title: String,
    val description: String,
    val isLowGen: Boolean
)
