package com.example.swayogemployeeapp.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import com.example.swayogemployeeapp.ui.theme.*
import kotlin.math.max
import kotlin.math.min

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WaareeSolarDashboard(viewModel: MainViewModel) {
    val customers by viewModel.customers.collectAsState()
    val inverterGeneration by viewModel.inverterGeneration.collectAsState()
    val inverterError by viewModel.inverterError.collectAsState()
    
    var selectedCustomerId by remember { mutableStateOf<Int?>(null) }
    var isRefreshing by remember { mutableStateOf(false) }
    
    // Sync customers when screen loads
    LaunchedEffect(Unit) {
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.CUSTOMERS)
    }
    
    LaunchedEffect(customers) {
        if (selectedCustomerId == null && customers.isNotEmpty()) {
            selectedCustomerId = customers.first().id
        }
    }
    
    val selectedCustomer = remember(selectedCustomerId, customers) {
        customers.find { it.id == selectedCustomerId }
    }
    
    LaunchedEffect(selectedCustomer?.id) {
        selectedCustomer?.id?.let { id ->
            viewModel.fetchInverterGeneration(id)
        }
    }
    
    // Mock telemetry data - in real app, this would come from API
    val telemetryData = remember(inverterGeneration) {
        TelemetryData(
            acpower = 2500.0,
            yieldtoday = 15.5,
            yieldtotal = 4520.0,
            feedInPower = 1800.0,
            powerdc1 = 1200.0,
            powerdc2 = 1300.0,
            batPower = -500.0,
            soc = 75,
            uploadTime = java.time.LocalDateTime.now().toString()
        )
    }
    
    val statusOnline = inverterGeneration != null && inverterError == null
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Waaree Inverter Diagnostics",
                    style = MaterialTheme.typography.headlineMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = selectedCustomer?.displayName() ?: "Select Customer",
                    color = MutedText,
                    fontSize = 14.sp
                )
            }
            
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Badge(
                    containerColor = if (statusOnline) SuccessGreen.copy(alpha = 0.2f) else Color.Red.copy(alpha = 0.2f),
                    contentColor = if (statusOnline) SuccessGreen else Color.Red
                ) {
                    Text(
                        text = if (statusOnline) "Online" else "Offline",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                IconButton(
                    onClick = {
                        isRefreshing = true
                        selectedCustomer?.id?.let { viewModel.fetchInverterGeneration(it) }
                        isRefreshing = false
                    },
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = PrimaryAmber,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
        
        // Customer Selector
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            var expanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = it }
            ) {
                OutlinedTextField(
                    value = selectedCustomer?.displayName() ?: "Select Customer",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Customer", color = MutedText) },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = NeutralText,
                        unfocusedTextColor = NeutralText,
                        focusedBorderColor = PrimaryAmber,
                        unfocusedBorderColor = BorderGray
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                        .padding(12.dp)
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    containerColor = SurfaceDark
                ) {
                    customers.forEach { customer ->
                        DropdownMenuItem(
                            text = { Text(customer.displayName(), color = NeutralText) },
                            onClick = {
                                selectedCustomerId = customer.id
                                expanded = false
                            }
                        )
                    }
                }
            }
        }
        
        // Status Cards Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatusCard(
                label = "Plant Status",
                value = if (statusOnline) "Online" else "Offline",
                color = if (statusOnline) SuccessGreen else Color.Red,
                icon = Icons.Default.Power,
                modifier = Modifier.weight(1f)
            )
            StatusCard(
                label = "Last Sync",
                value = telemetryData.uploadTime.substringAfter("T").substringBefore("."),
                color = EngineeringBlue,
                icon = Icons.Default.Schedule,
                modifier = Modifier.weight(1f)
            )
        }
        
        // Power Summary Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PowerCard(
                label = "Current Output",
                value = "${telemetryData.acpower.toInt()}",
                unit = "W",
                color = PrimaryAmber,
                icon = Icons.Default.Bolt,
                modifier = Modifier.weight(1f)
            )
            PowerCard(
                label = "Generated Today",
                value = String.format("%.1f", telemetryData.yieldtoday),
                unit = "kWh",
                color = SuccessGreen,
                icon = Icons.Default.EnergySavingsLeaf,
                modifier = Modifier.weight(1f)
            )
        }
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PowerCard(
                label = "Total Generation",
                value = String.format("%.1f", telemetryData.yieldtotal),
                unit = "kWh",
                color = EngineeringBlue,
                icon = Icons.Default.TrendingUp,
                modifier = Modifier.weight(1f)
            )
            PowerCard(
                label = "Exported to Grid",
                value = "${telemetryData.feedInPower.toInt()}",
                unit = "W",
                color = Color(0xFF6366F1),
                icon = Icons.Default.Public,
                modifier = Modifier.weight(1f)
            )
        }
        
        // Power Flow Diagram
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(
                    text = "Live Power Flow",
                    color = NeutralText,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                
                PowerFlowDiagram(telemetryData)
            }
        }
        
        // Battery Status
        if (telemetryData.batPower != 0.0) {
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Battery Diagnostics",
                        color = NeutralText,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    
                    BatteryGauge(telemetryData = telemetryData)
                }
            }
        }
        
        // DC String Comparison
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                val maxDC = maxOf(telemetryData.powerdc1, telemetryData.powerdc2, 1.0)
                val diffDC = kotlin.math.abs(telemetryData.powerdc1 - telemetryData.powerdc2)
                val showImbalance = telemetryData.acpower > 0 && (diffDC / maxOf(telemetryData.powerdc1, 1.0) > 0.20 || diffDC / maxOf(telemetryData.powerdc2, 1.0) > 0.20)
                
                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "DC String Inputs",
                        color = NeutralText,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    
                    if (showImbalance) {
                        Badge(
                            containerColor = PrimaryAmber.copy(alpha = 0.2f),
                            contentColor = PrimaryAmber
                        ) {
                            Text("Imbalance Detected", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                
                if (showImbalance) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(16.dp))
                        Text(
                            text = "String imbalance detected — check panel connections",
                            color = PrimaryAmber,
                            fontSize = 11.sp
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                DCProgressBar(
                    label = "String 1 Power",
                    value = telemetryData.powerdc1,
                    maxValue = maxDC * 1.2
                )
                
                DCProgressBar(
                    label = "String 2 Power",
                    value = telemetryData.powerdc2,
                    maxValue = maxDC * 1.2
                )
            }
        }
        
        // Error Display
        if (inverterError != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Red.copy(alpha = 0.1f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Error, contentDescription = null, tint = Color.Red)
                    Text(
                        text = inverterError!!,
                        color = Color.Red,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
fun StatusCard(
    label: String,
    value: String,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                color = MutedText,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = value,
                color = color,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun PowerCard(
    label: String,
    value: String,
    unit: String,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = label,
                    color = MutedText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "$value $unit",
                    color = color,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
fun PowerFlowDiagram(telemetryData: TelemetryData) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Solar Panels
        FlowNode(
            label = "Solar Panels",
            value = "${(telemetryData.powerdc1 + telemetryData.powerdc2).toInt()} W (DC)",
            color = PrimaryAmber,
            icon = Icons.Default.WbSunny
        )
        
        Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(24.dp))
        
        // Middle Row: Battery, Inverter, Home
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Battery
            if (telemetryData.batPower != 0.0) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    FlowNode(
                        label = "Battery (${telemetryData.soc}%)",
                        value = if (telemetryData.batPower > 0) "Charging" else "Discharging",
                        color = SuccessGreen,
                        icon = Icons.Default.BatteryFull
                    )
                    if (telemetryData.batPower != 0.0) {
                        Text(
                            text = "${kotlin.math.abs(telemetryData.batPower).toInt()} W",
                            color = MutedText,
                            fontSize = 10.sp
                        )
                    }
                }
            }
            
            // Inverter (Center)
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF374151)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Memory, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(24.dp))
                    Text(
                        text = "Inverter",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            // Home Load
            FlowNode(
                label = "Home Load",
                value = "${telemetryData.acpower.toInt()} W",
                color = EngineeringBlue,
                icon = Icons.Default.Home
            )
        }
        
        Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = EngineeringBlue, modifier = Modifier.size(24.dp))
        
        // Grid Export
        FlowNode(
            label = if (telemetryData.feedInPower >= 0) "Grid Export" else "Grid Import",
            value = "${kotlin.math.abs(telemetryData.feedInPower).toInt()} W",
            color = Color(0xFF6366F1),
            icon = Icons.Default.Public
        )
    }
}

@Composable
fun FlowNode(
    label: String,
    value: String,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.2f)),
        modifier = Modifier.width(100.dp)
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            Text(
                text = label,
                color = color,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = value,
                color = NeutralText,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun BatteryGauge(telemetryData: TelemetryData) {
    val animatedSoc by animateFloatAsState(
        targetValue = telemetryData.soc.toFloat(),
        animationSpec = tween(durationMillis = 1000),
        label = "socAnimation"
    )
    
    val socColor = when {
        animatedSoc < 20 -> Color.Red
        animatedSoc <= 50 -> PrimaryAmber
        else -> SuccessGreen
    }
    
    Row(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Circular Gauge
        Box(
            modifier = Modifier.size(80.dp),
            contentAlignment = Alignment.Center
        ) {
            // Background circle
            androidx.compose.foundation.Canvas(
                modifier = Modifier.size(80.dp),
                onDraw = {
                    drawCircle(
                        color = Color(0xFF374151),
                        radius = 35.dp.toPx(),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 8.dp.toPx())
                    )
                }
            )
            
            // Progress arc (simplified representation)
            val progress = animatedSoc / 100f
            androidx.compose.foundation.Canvas(
                modifier = Modifier.size(80.dp),
                onDraw = {
                    drawArc(
                        color = socColor,
                        startAngle = -90f,
                        sweepAngle = 360f * progress,
                        useCenter = false,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 8.dp.toPx())
                    )
                }
            )
            
            // Center text
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "${animatedSoc.toInt()}%",
                    color = NeutralText,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "SOC",
                    color = MutedText,
                    fontSize = 10.sp
                )
            }
        }
        
        // Battery Details
        Column {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.BatteryChargingFull, contentDescription = null, tint = socColor, modifier = Modifier.size(20.dp))
                Text(
                    text = if (telemetryData.batPower > 0) "Charging" else "Discharging",
                    color = NeutralText,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Text(
                text = "Flow Power: ${kotlin.math.abs(telemetryData.batPower).toInt()} W",
                color = MutedText,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
fun DCProgressBar(label: String, value: Double, maxValue: Double) {
    val progress = (value / maxValue).coerceIn(0.0, 1.0).toFloat()
    
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                color = NeutralText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${value.toInt()} W",
                color = NeutralText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
        
        LinearProgressIndicator(
            progress = { progress },
            color = EngineeringBlue,
            trackColor = Color(0xFF374151),
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
        )
    }
}

data class TelemetryData(
    val acpower: Double,
    val yieldtoday: Double,
    val yieldtotal: Double,
    val feedInPower: Double,
    val powerdc1: Double,
    val powerdc2: Double,
    val batPower: Double,
    val soc: Int,
    val uploadTime: String
)

