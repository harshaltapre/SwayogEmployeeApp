package com.swayog.employee.presentation.inverter

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.WaareeInverterDataResponse
import com.swayog.employee.data.model.WaareePowerGraphResponse

@Composable
fun InverterDataContent(
    data: WaareeInverterDataResponse,
    graphData: WaareePowerGraphResponse?,
    selectedPeriod: String,
    onPeriodChanged: (String) -> Unit,
    onBackToCustomers: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Customer Info Header
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            data.customerName,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Device SN: ${data.deviceSn}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = onBackToCustomers) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back to Customers")
                    }
                }
            }
        }

        // Status Card
        StatusCard(data = data)

        // Live Power Card
        LivePowerCard(data = data)

        // Generation Stats Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            TodayGenerationCard(data = data, modifier = Modifier.weight(1f))
            TotalGenerationCard(data = data, modifier = Modifier.weight(1f))
        }

        // Battery Status Card (if applicable)
        if (data.data.soc > 0) {
            BatteryStatusCard(data = data, modifier = Modifier.padding(16.dp))
        }

        // Alerts Section
        if (data.alerts.isNotEmpty()) {
            AlertsSection(alerts = data.alerts, modifier = Modifier.padding(16.dp))
        }

        // Period Selection
        PeriodSelector(
            selectedPeriod = selectedPeriod,
            onPeriodChanged = onPeriodChanged,
            modifier = Modifier.padding(16.dp)
        )

        // Graph Section
        GraphSection(
            graphData = graphData,
            period = selectedPeriod,
            modifier = Modifier.padding(16.dp)
        )
    }
}

@Composable
fun StatusCard(data: WaareeInverterDataResponse) {
    val statusColor = if (data.status.isOnline) {
        Color(0xFF4CAF50)
    } else {
        Color(0xFFF44336)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = statusColor.copy(alpha = 0.1f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(statusColor, RoundedCornerShape(6.dp))
                )
                Text(
                    if (data.status.isOnline) "Online" else "Offline",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = statusColor
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    "Updated ${data.status.minutesAgo} min ago",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (data.status.isSimulated) {
                    Text(
                        "Simulated Data",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFFF9800)
                    )
                }
            }
        }
    }
}

@Composable
fun LivePowerCard(data: WaareeInverterDataResponse) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    Icons.Default.ElectricBolt,
                    contentDescription = "Power",
                    tint = Color(0xFFFFC107),
                    modifier = Modifier.size(32.dp)
                )
                Column {
                    Text(
                        "Current Power",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        "${String.format("%.2f", data.data.acpower / 1000)} kW",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun TodayGenerationCard(data: WaareeInverterDataResponse, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Default.WbSunny,
                contentDescription = "Today",
                tint = Color(0xFFFF9800),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Today",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "${String.format("%.2f", data.data.yieldtoday)} kWh",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun TotalGenerationCard(data: WaareeInverterDataResponse, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Default.Bolt,
                contentDescription = "Total",
                tint = Color(0xFF2196F3),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Total",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "${String.format("%.2f", data.data.yieldtotal)} kWh",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun BatteryStatusCard(data: WaareeInverterDataResponse, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        Icons.Default.BatteryChargingFull,
                        contentDescription = "Battery",
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        "Battery Status",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    "${data.data.soc}%",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (data.data.soc < 20) Color(0xFFF44336) else Color(0xFF4CAF50)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = data.data.soc / 100f,
                modifier = Modifier.fillMaxWidth(),
                color = if (data.data.soc < 20) Color(0xFFF44336) else Color(0xFF4CAF50)
            )
        }
    }
}

@Composable
fun AlertsSection(alerts: List<String>, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFFFF3E0)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    Icons.Default.Warning,
                    contentDescription = "Alerts",
                    tint = Color(0xFFFF9800)
                )
                Text(
                    "Alerts",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFF9800)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            alerts.forEach { alert ->
                Text(
                    "• $alert",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFE65100)
                )
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

@Composable
fun PeriodSelector(
    selectedPeriod: String,
    onPeriodChanged: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val periods = listOf("realtime", "daily", "monthly", "yearly")

    Card(modifier = modifier, shape = RoundedCornerShape(12.dp)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                "History Period",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                periods.forEach { period ->
                    FilterChip(
                        selected = selectedPeriod == period,
                        onClick = { onPeriodChanged(period) },
                        label = { Text(period.replaceFirstChar { it.uppercase() }) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
fun GraphSection(
    graphData: WaareePowerGraphResponse?,
    period: String,
    modifier: Modifier = Modifier
) {
    Card(modifier = modifier, shape = RoundedCornerShape(12.dp)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                "${period.replaceFirstChar { it.uppercase() }} Generation Graph",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))

            if (graphData != null && graphData.timestamps.isNotEmpty()) {
                SimpleGraph(
                    timestamps = graphData.timestamps,
                    values = graphData.values,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "No graph data available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun SimpleGraph(
    timestamps: List<String>,
    values: List<Double>,
    modifier: Modifier = Modifier
) {
    // Simple bar graph implementation
    val maxValue = values.maxOrNull() ?: 1.0

    Column(modifier = modifier) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            values.forEachIndexed { index, value ->
                val barHeight = (value / maxValue * 100).coerceIn(0.0, 100.0)
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(barHeight.dp)
                            .background(
                                Color(0xFF4CAF50),
                                RoundedCornerShape(4.dp)
                            )
                    )
                    if (timestamps.size > index) {
                        Text(
                            timestamps[index],
                            style = MaterialTheme.typography.bodySmall,
                            fontSize = 8.sp,
                            textAlign = TextAlign.Center,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}