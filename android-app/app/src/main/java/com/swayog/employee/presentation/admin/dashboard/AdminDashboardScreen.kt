package com.swayog.employee.presentation.admin.dashboard

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.charts.PieChart
import com.github.mikephil.charting.data.*
import com.swayog.employee.data.model.DashboardStats
import com.swayog.employee.presentation.common.components.SwayogCard
import com.swayog.employee.presentation.common.components.SwayogTopBar
import java.text.DecimalFormat

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onNavigateBack: () -> Unit,
    viewModel: AdminDashboardViewModel = hiltViewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    val dashboardStats by viewModel.dashboardStats.collectAsState()

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Admin Dashboard",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = { viewModel.loadDashboardStats() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (dashboardState is DashboardState.Loading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (dashboardStats != null) {
                DashboardContent(stats = dashboardStats!!)
            } else if (dashboardState is DashboardState.Error) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Failed to load dashboard: ${(dashboardState as DashboardState.Error).message}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun DashboardContent(stats: DashboardStats) {
    // Key Metrics Cards
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        MetricCard(
            title = "Total Revenue",
            value = "₹${DecimalFormat("#,##0.00").format(stats.totalRevenue)}",
            icon = Icons.Default.AttachMoney,
            color = Color(0xFF0B6E4F),
            modifier = Modifier.weight(1f)
        )
        MetricCard(
            title = "Installations",
            value = stats.totalInstallations.toString(),
            icon = Icons.Default.SolarPower,
            color = Color(0xFF386FA4),
            modifier = Modifier.weight(1f)
        )
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        MetricCard(
            title = "Active Jobs",
            value = stats.activeJobs.toString(),
            icon = Icons.Default.Work,
            color = Color(0xFFD1603D),
            modifier = Modifier.weight(1f)
        )
        MetricCard(
            title = "Customers",
            value = stats.totalCustomers.toString(),
            icon = Icons.Default.People,
            color = Color(0xFF6B21A8),
            modifier = Modifier.weight(1f)
        )
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        MetricCard(
            title = "Employees",
            value = stats.totalEmployees.toString(),
            icon = Icons.Default.Person,
            color = Color(0xFF0891B2),
            modifier = Modifier.weight(1f)
        )
        MetricCard(
            title = "Pending Tasks",
            value = stats.pendingTasks.toString(),
            icon = Icons.Default.Assignment,
            color = Color(0xFFDC2626),
            modifier = Modifier.weight(1f)
        )
    }

    // Revenue Chart
    SwayogCard {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Revenue by Month",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            AndroidView(
                factory = { context ->
                    LineChart(context).apply {
                        val entries = stats.revenueByMonth.mapIndexed { index, revenue ->
                            Entry(index.toFloat(), revenue.amount.toFloat())
                        }
                        val dataSet = LineDataSet(entries, "Revenue").apply {
                            color = Color(0xFF0B6E4F).hashCode()
                            setCircleColor(Color(0xFF0B6E4F).hashCode())
                            lineWidth = 2f
                            circleRadius = 4f
                            setDrawFilled(true)
                            fillAlpha = 50
                            fillColor = Color(0xFF0B6E4F).hashCode()
                        }
                        data = LineData(dataSet).apply {
                            setDrawValues(false)
                        }
                        description.isEnabled = false
                        legend.isEnabled = false
                        xAxis.valueFormatter = IndexAxisValueFormatter(stats.revenueByMonth.map { it.month })
                        axisRight.isEnabled = false
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            )
        }
    }

    // Installations Chart
    SwayogCard {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Installations by Month",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            AndroidView(
                factory = { context ->
                    LineChart(context).apply {
                        val entries = stats.installationsByMonth.mapIndexed { index, installation ->
                            Entry(index.toFloat(), installation.count.toFloat())
                        }
                        val dataSet = LineDataSet(entries, "Installations").apply {
                            color = Color(0xFF386FA4).hashCode()
                            setCircleColor(Color(0xFF386FA4).hashCode())
                            lineWidth = 2f
                            circleRadius = 4f
                            setDrawFilled(true)
                            fillAlpha = 50
                            fillColor = Color(0xFF386FA4).hashCode()
                        }
                        data = LineData(dataSet).apply {
                            setDrawValues(false)
                        }
                        description.isEnabled = false
                        legend.isEnabled = false
                        xAxis.valueFormatter = IndexAxisValueFormatter(stats.installationsByMonth.map { it.month })
                        axisRight.isEnabled = false
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            )
        }
    }

    // Jobs by Zone Pie Chart
    SwayogCard {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Jobs by Zone",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            AndroidView(
                factory = { context ->
                    PieChart(context).apply {
                        val entries = stats.jobsByZone.map { zoneJob ->
                            PieEntry(zoneJob.count.toFloat(), zoneJob.zone)
                        }
                        val colors = listOf(
                            Color(0xFF0B6E4F),
                            Color(0xFF386FA4),
                            Color(0xFFD1603D),
                            Color(0xFF6B21A8),
                            Color(0xFF0891B2)
                        )
                        val dataSet = PieDataSet(entries, "Jobs").apply {
                            this.colors = colors.map { it.hashCode() }
                            valueTextSize = 12f
                            valueTextColor = Color.White.hashCode()
                        }
                        data = PieData(dataSet)
                        description.isEnabled = false
                        legend.isEnabled = true
                        legend.verticalAlignment = com.github.mikephil.charting.components.Legend.LegendVerticalAlignment.TOP
                        legend.horizontalAlignment = com.github.mikephil.charting.components.Legend.LegendHorizontalAlignment.CENTER
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp)
            )
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    SwayogCard(
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(32.dp)
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

class IndexAxisValueFormatter(private val values: List<String>) : com.github.mikephil.charting.formatter.ValueFormatter() {
    override fun getFormattedValue(value: Float): String {
        val index = value.toInt()
        return if (index >= 0 && index < values.size) values[index] else ""
    }
}
