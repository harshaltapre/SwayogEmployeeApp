package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import java.util.Locale

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
                Text("WorkForce Pro Solar Telemetry API status: ACTIVE", color = SuccessGreen, fontSize = 12.sp)
                Text("Regional Ground Irradiance: 840 W/m² (Peak sunlight)", color = NeutralText)
                Text("Efficiency Yield Ratio: ${if (alert.isLowGen) "64% (ALERT)" else "0% (COMM_OUT)"}", color = if (alert.isLowGen) PrimaryAmber else Color.Red, fontWeight = FontWeight.Bold)
            }
        }

        // Expected vs Actual Yield comparative bar chart
        val expectedYield = if (alert.title.contains("Drop")) 18.4 else if (alert.title.contains("Communication")) 22.0 else 15.0
        val actualYield = if (alert.title.contains("Drop")) 12.1 else if (alert.title.contains("Communication")) 0.0 else 14.8
        YieldComparisonChart(expected = expectedYield, actual = actualYield)

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

@Composable
fun YieldComparisonChart(expected: Double, actual: Double) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderGray, RoundedCornerShape(8.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("EXPECTED VS ACTUAL DAILY YIELD (kWh)", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .padding(vertical = 8.dp)
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val chartHeight = size.height - 40f
                    val maxVal = maxOf(expected, actual, 5.0) * 1.2

                    val barWidth = 60f
                    val expectedX = size.width / 2 - barWidth - 40f
                    val actualX = size.width / 2 + 40f

                    val expectedHeight = (expected / maxVal * chartHeight).toFloat()
                    val actualHeight = (actual / maxVal * chartHeight).toFloat()

                    drawRoundRect(
                        color = EngineeringBlue,
                        topLeft = androidx.compose.ui.geometry.Offset(expectedX, chartHeight - expectedHeight),
                        size = androidx.compose.ui.geometry.Size(barWidth, expectedHeight),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(6f, 6f)
                    )

                    val dropRatio = if (expected > 0.0) actual / expected else 1.0
                    val barColor = if (dropRatio < 0.8) Color(0xFFEF4444) else SuccessGreen
                    drawRoundRect(
                        color = barColor,
                        topLeft = androidx.compose.ui.geometry.Offset(actualX, chartHeight - actualHeight),
                        size = androidx.compose.ui.geometry.Size(barWidth, actualHeight),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(6f, 6f)
                    )

                    val paint = android.graphics.Paint().apply {
                        color = android.graphics.Color.WHITE
                        textSize = 24f
                        textAlign = android.graphics.Paint.Align.CENTER
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                    }

                    val textPaintMuted = android.graphics.Paint().apply {
                        color = android.graphics.Color.parseColor("#94A3B8")
                        textSize = 22f
                        textAlign = android.graphics.Paint.Align.CENTER
                    }

                    drawIntoCanvas { canvas ->
                        canvas.nativeCanvas.drawText(
                            "${String.format(Locale.US, "%.1f", expected)} kWh",
                            expectedX + barWidth / 2,
                            chartHeight - expectedHeight - 10f,
                            paint
                        )
                        canvas.nativeCanvas.drawText(
                            "Expected",
                            expectedX + barWidth / 2,
                            size.height - 5f,
                            textPaintMuted
                        )

                        canvas.nativeCanvas.drawText(
                            "${String.format(Locale.US, "%.1f", actual)} kWh",
                            actualX + barWidth / 2,
                            chartHeight - actualHeight - 10f,
                            paint
                        )
                        canvas.nativeCanvas.drawText(
                            "Actual",
                            actualX + barWidth / 2,
                            size.height - 5f,
                            textPaintMuted
                        )
                    }
                }
            }
        }
    }
}
