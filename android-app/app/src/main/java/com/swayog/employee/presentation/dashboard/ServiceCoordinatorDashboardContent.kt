package com.swayog.employee.presentation.dashboard

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.swayog.employee.data.model.*
import com.swayog.employee.presentation.common.components.SwayogButton
import com.swayog.employee.presentation.common.components.SwayogCard
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceCoordinatorDashboardContent(
    viewModel: ServiceCoordinatorViewModel,
    onNavigateToCustomers: () -> Unit,
    onNavigateToComplaints: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    onNavigateToMap: () -> Unit,
    onNavigateToEmployees: () -> Unit,
    onNavigateToFinancials: () -> Unit,
    onNavigateToAttendance: () -> Unit,
    onNavigateToDailyCommits: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    val customers by viewModel.customers.collectAsState()
    val cities by viewModel.cities.collectAsState()
    val selectedCustomerId by viewModel.selectedCustomerId.collectAsState()
    val selectedCity by viewModel.selectedCity.collectAsState()
    val selectedPeriod by viewModel.selectedPeriod.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()

    // Loaded states
    val summary by viewModel.selectedCustomerSummary.collectAsState()
    val inverterSummary by viewModel.inverterSummary.collectAsState()
    val inverterHistory by viewModel.inverterHistory.collectAsState()
    val amcVisits by viewModel.amcVisits.collectAsState()
    val employees by viewModel.employees.collectAsState()

    // Loading & Error states
    val isLoadingTelemetry by viewModel.isLoadingTelemetry.collectAsState()
    val isLoadingHistory by viewModel.isLoadingHistory.collectAsState()
    val isLoadingAmc by viewModel.isLoadingAmc.collectAsState()
    val telemetryError by viewModel.inverterSummaryError.collectAsState()
    val historyError by viewModel.inverterHistoryError.collectAsState()

    // UI Dialog States
    var showCustomerSearchDialog by remember { mutableStateOf(false) }
    var showCredentialsDialog by remember { mutableStateOf(false) }

    val selectedCustomer = remember(customers, selectedCustomerId) {
        customers.find { it.id == selectedCustomerId }
    }

    val filteredCustomers = remember(customers, selectedCity) {
        if (selectedCity.isEmpty()) {
            customers
        } else {
            customers.filter { it.city.equals(selectedCity, ignoreCase = true) }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Section 1: Top Welcome Portal Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Service Coordinator Portal",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Manage solar parameters, telemetry, maps, and schedules.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                    IconButton(
                        onClick = { viewModel.refreshAll() },
                        modifier = Modifier.background(
                            MaterialTheme.colorScheme.surface,
                            shape = RoundedCornerShape(12.dp)
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh Portal",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // Section 1.5: Quick Actions Navigation Grid
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Coordinator Console",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        QuickActionCard(
                            icon = Icons.Default.People,
                            label = "Customers",
                            color = Color(0xFF8B5CF6),
                            onClick = onNavigateToCustomers,
                            modifier = Modifier.weight(1f)
                        )
                        QuickActionCard(
                            icon = Icons.Default.Warning,
                            label = "Complaints",
                            color = Color(0xFFF59E0B),
                            onClick = onNavigateToComplaints,
                            modifier = Modifier.weight(1f)
                        )
                        QuickActionCard(
                            icon = Icons.Default.CalendarToday,
                            label = "Calendar",
                            color = Color(0xFF10B981),
                            onClick = onNavigateToCalendar,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        QuickActionCard(
                            icon = Icons.Default.Map,
                            label = "Geospatial Map",
                            color = Color(0xFF386FA4),
                            onClick = onNavigateToMap,
                            modifier = Modifier.weight(1f)
                        )
                        QuickActionCard(
                            icon = Icons.Default.Group,
                            label = "Staff Directory",
                            color = Color(0xFF0B6E4F),
                            onClick = onNavigateToEmployees,
                            modifier = Modifier.weight(1f)
                        )
                        QuickActionCard(
                            icon = Icons.Default.AttachMoney,
                            label = "Financials",
                            color = Color(0xFF22C55E),
                            onClick = onNavigateToFinancials,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        QuickActionCard(
                            icon = Icons.Default.Fingerprint,
                            label = "Attendance",
                            color = Color(0xFFE83F6F), // Distinct color
                            onClick = onNavigateToAttendance,
                            modifier = Modifier.weight(1f)
                        )
                        QuickActionCard(
                            icon = Icons.Default.EditNote,
                            label = "Timesheets",
                            color = Color(0xFF0F4C5C), // Distinct color
                            onClick = onNavigateToDailyCommits,
                            modifier = Modifier.weight(1f)
                        )
                        Spacer(modifier = Modifier.weight(1f)) // Empty spacer for alignment
                    }
                }
            }

            // Section 2: Filter Card
            item {
                SwayogCard(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Select Client & City",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Customer Selection Box
                            Box(
                                modifier = Modifier
                                    .weight(1.2f)
                                    .height(48.dp)
                                    .border(
                                        1.dp,
                                        MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .clickable { showCustomerSearchDialog = true }
                                    .padding(horizontal = 12.dp),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = selectedCustomer?.let { "${it.customerCode} · ${it.fullName}" }
                                            ?: "Select Customer",
                                        style = MaterialTheme.typography.bodyMedium,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        color = if (selectedCustomer != null) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            }

                            // City Filter Dropdown Box
                            var showCityDropdown by remember { mutableStateOf(false) }
                            Box(
                                modifier = Modifier
                                    .weight(0.8f)
                                    .height(48.dp)
                                    .border(
                                        1.dp,
                                        MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .clickable { showCityDropdown = true }
                                    .padding(horizontal = 12.dp),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = if (selectedCity.isEmpty()) "All Cities" else selectedCity,
                                        style = MaterialTheme.typography.bodyMedium,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Icon(
                                        imageVector = Icons.Default.FilterList,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }

                                DropdownMenu(
                                    expanded = showCityDropdown,
                                    onDismissRequest = { showCityDropdown = false }
                                ) {
                                    DropdownMenuItem(
                                        text = { Text("All Cities") },
                                        onClick = {
                                            viewModel.setCityFilter("")
                                            showCityDropdown = false
                                        }
                                    )
                                    cities.forEach { city ->
                                        DropdownMenuItem(
                                            text = { Text(city) },
                                            onClick = {
                                                viewModel.setCityFilter(city)
                                                showCityDropdown = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Section 3: Telemetry, AMC, Complaints, Log Details
            if (selectedCustomer != null) {
                // AMC & Complaints Summary Cards
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Max),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // AMC Card
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(12.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CalendarToday,
                                            contentDescription = null,
                                            tint = Color(0xFF0B6E4F),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "AMC Cleaning",
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                            maxLines = 2
                                        )
                                    }
                                    val limit = selectedCustomer.cleaningsPerMonth ?: 2
                                    Surface(
                                        color = Color(0xFF0B6E4F).copy(alpha = 0.12f),
                                        shape = RoundedCornerShape(20.dp)
                                    ) {
                                        Text(
                                            text = "$limit / mo",
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Color(0xFF0B6E4F),
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                val completed = summary?.customer?.completedVisits ?: 0
                                val pending = summary?.customer?.pendingVisits ?: 0

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "$completed",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFF0B6E4F)
                                        )
                                        Text(
                                            text = "Done",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "$pending",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFFD1603D)
                                        )
                                        Text(
                                            text = "Pending",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                }

                                val limit = maxOf(selectedCustomer.cleaningsPerMonth ?: 2, 1)
                                val progress = completed.toFloat() / limit.toFloat()
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "Progress",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                        Text(
                                            text = "${(progress * 100).toInt()}%",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    LinearProgressIndicator(
                                        progress = progress.coerceIn(0f, 1f),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(3.dp)),
                                        color = Color(0xFF0B6E4F),
                                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                                    )
                                }
                            }
                        }

                        // Complaints Card
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(12.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Build,
                                            contentDescription = null,
                                            tint = Color(0xFF386FA4),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Tickets",
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }
                                    val total = summary?.serviceRequestStats?.total ?: 0
                                    Surface(
                                        color = Color(0xFF386FA4).copy(alpha = 0.12f),
                                        shape = RoundedCornerShape(20.dp)
                                    ) {
                                        Text(
                                            text = "$total Total",
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Color(0xFF386FA4),
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                val pending = summary?.serviceRequestStats?.pending ?: 0
                                val resolved = summary?.serviceRequestStats?.completed ?: 0

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "$pending",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFFD1603D)
                                        )
                                        Text(
                                            text = "Pending",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "$resolved",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFF0B6E4F)
                                        )
                                        Text(
                                            text = "Resolved",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                }
                                val totalVal = summary?.serviceRequestStats?.total ?: 0
                                val resolutionRate = if (totalVal > 0) resolved.toFloat() / totalVal.toFloat() else 0f
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "Resolution",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                        Text(
                                            text = if (totalVal == 0) "—" else "${(resolutionRate * 100).toInt()}%",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    LinearProgressIndicator(
                                        progress = resolutionRate,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(3.dp)),
                                        color = Color(0xFF386FA4),
                                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                // Inverter Generation Summary Telemetry Card
                item {
                    SwayogCard(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Inverter Telemetry",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )

                                inverterSummary?.let {
                                    val isSim = it.status.contains("Simulation", ignoreCase = true)
                                    Surface(
                                        color = (if (isSim) Color(0xFFFFC857) else Color(0xFF0B6E4F)).copy(alpha = 0.12f),
                                        shape = RoundedCornerShape(20.dp)
                                    ) {
                                        Text(
                                            text = if (isSim) "Simulated Sync" else "Live API",
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (isSim) Color(0xFFB58900) else Color(0xFF0B6E4F),
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            if (isLoadingTelemetry) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(80.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            } else if (telemetryError != null) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFFD1603D).copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                        .border(1.dp, Color(0xFFD1603D).copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                        .padding(12.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.Top) {
                                        Icon(
                                            imageVector = Icons.Default.Error,
                                            contentDescription = null,
                                            tint = Color(0xFFD1603D),
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(
                                                text = "Telemetry Connection Failed",
                                                style = MaterialTheme.typography.bodyMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFFD1603D)
                                            )
                                            Text(
                                                text = telemetryError ?: "",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                            )
                                        }
                                    }
                                }
                            } else if (inverterSummary != null) {
                                val summaryData = inverterSummary!!
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    TelemetryMetric(
                                        label = "Today's Yield",
                                        value = "${summaryData.todayGeneration}",
                                        unit = "kWh",
                                        modifier = Modifier.weight(1f)
                                    )
                                    TelemetryMetric(
                                        label = "Current Power",
                                        value = "${summaryData.currentPower}",
                                        unit = "kW",
                                        modifier = Modifier.weight(1f)
                                    )
                                    TelemetryMetric(
                                        label = "Total Lifetime",
                                        value = "${summaryData.totalGeneration}",
                                        unit = "kWh",
                                        modifier = Modifier.weight(1f)
                                    )
                                }

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Last synchronized:",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                    Text(
                                        text = try {
                                            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                                            val date = isoFormat.parse(summaryData.lastUpdated.substringBefore("."))
                                            SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault()).format(date!!)
                                        } catch (_: Exception) {
                                            summaryData.lastUpdated
                                        },
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            } else {
                                Text(
                                    text = "No inverter telemetry available for this customer.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
                                )
                            }
                        }
                    }
                }

                // Custom Area Chart Card
                item {
                    SwayogCard(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Row 1: Heading (full width, left-aligned)
                            Text(
                                text = "Generation History",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.fillMaxWidth()
                            )

                            if (isLoadingHistory) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(150.dp),
                                        contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            } else if (historyError != null) {
                                Text(
                                    text = "Failed to load generation chart: $historyError",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.error,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
                                )
                            } else if (inverterHistory.isNotEmpty()) {
                                GenerationChart(
                                    history = inverterHistory,
                                    selectedPeriod = selectedPeriod,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(160.dp)
                                        .padding(vertical = 8.dp)
                                )
                            } else {
                                Text(
                                    text = "No history data available for selected period.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp)
                                )
                            }

                            // Row 2: Period filters (full width, below the graph)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                listOf("realtime", "daily", "monthly", "yearly").forEach { p ->
                                    val isSelected = selectedPeriod == p
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(
                                                if (isSelected) MaterialTheme.colorScheme.primary
                                                else MaterialTheme.colorScheme.surfaceVariant
                                            )
                                            .clickable { viewModel.setPeriod(p) }
                                            .padding(horizontal = 4.dp, vertical = 6.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = p.replaceFirstChar { it.uppercase() },
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (isSelected) MaterialTheme.colorScheme.onPrimary
                                            else MaterialTheme.colorScheme.onSurface,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // AMC Cleaning Visits Schedule
                item {
                    SwayogCard(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "AMC Cleaning Visit Log",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )

                            if (isLoadingAmc) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(60.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            } else if (amcVisits.isEmpty()) {
                                Text(
                                    text = "No cleaning visits scheduled for this customer.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
                                )
                            } else {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    amcVisits.forEach { visit ->
                                        val technicianName = remember(employees, visit.assignedEmployeeId) {
                                            employees.find { it.id == visit.assignedEmployeeId }?.fullName ?: "Unassigned"
                                        }
                                        AmcVisitItem(visit = visit, technicianName = technicianName)
                                    }
                                }
                            }
                        }
                    }
                }

                // Customer Info & Inverter System Details
                item {
                    SwayogCard(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Customer & Inverter Info",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )

                                Button(
                                    onClick = { showCredentialsDialog = true },
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                    modifier = Modifier.height(32.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primaryContainer, contentColor = MaterialTheme.colorScheme.onPrimaryContainer)
                                ) {
                                    Text("Update", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                // Contact Card
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "CONTACT DETAILS",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                    Text(
                                        text = selectedCustomer.fullName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = selectedCustomer.customerCode,
                                        style = MaterialTheme.typography.labelMedium,
                                        fontFamily = FontFamily.Monospace,
                                        color = MaterialTheme.colorScheme.primary
                                    )

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.clickable {
                                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${selectedCustomer.phoneNumber}"))
                                            context.startActivity(intent)
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Phone,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = selectedCustomer.phoneNumber,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.Top) {
                                        Icon(
                                            imageVector = Icons.Default.Place,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                            modifier = Modifier.size(14.dp).padding(top = 2.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "${selectedCustomer.address}, ${selectedCustomer.city}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                            lineHeight = 14.sp
                                        )
                                    }
                                }

                                // System Card
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "SYSTEM INFORMATION",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                    
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column {
                                            Text("Capacity", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                            Text("${selectedCustomer.systemSizeKw} kW", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                                        }
                                        Column(horizontalAlignment = Alignment.End) {
                                            Text("Brand", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                            Surface(
                                                color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.12f),
                                                shape = RoundedCornerShape(4.dp)
                                            ) {
                                                Text(
                                                    text = selectedCustomer.inverterBrand ?: "Unknown",
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.secondary,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }

                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column {
                                            Text("AMC Status", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                            Text(selectedCustomer.amcStatus.uppercase(), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = if (selectedCustomer.amcStatus.equals("active", true)) Color(0xFF0B6E4F) else Color(0xFFD1603D))
                                        }
                                        Column(horizontalAlignment = Alignment.End) {
                                            Text("Stage", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                            Text("Stage ${selectedCustomer.projectStage}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    val instDate = selectedCustomer.installationDate
                                    Column {
                                        Text("Installation Date", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                        Text(
                                            text = if (instDate != null) {
                                                try {
                                                    val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                                                    val date = parser.parse(instDate.substringBefore("T"))
                                                    SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(date!!)
                                                } catch (_: Exception) {
                                                    instDate.substringBefore("T")
                                                }
                                            } else "N/A",
                                                style = MaterialTheme.typography.bodySmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                            }
                        }
                    }
                }

                // Inverter Portal Quick copy & Launcher
                item {
                    val brandLower = (selectedCustomer.inverterBrand ?: "").lowercase()
                    val connectionType = when {
                        brandLower.contains("solarman") -> "Solarman"
                        brandLower.contains("ksolar") || brandLower.contains("k-solar") -> "ShineMonitor"
                        brandLower.contains("growatt") -> "Growatt"
                        brandLower.contains("utl") || brandLower.contains("foxess") -> "FoxESS"
                        brandLower.contains("vsole") || brandLower.contains("solis") -> "Solis"
                        else -> "Growatt" // Default/simulation
                    }

                    val portalUrl = when (connectionType) {
                        "ShineMonitor" -> "https://ksolare.shinemonitor.com/cus/ksolareNew/index_in.html?1779693602982"
                        "Growatt" -> "https://server.growatt.com/"
                        "FoxESS" -> "https://www.foxesscloud.com/"
                        "Solarman" -> "https://global.solarmanpv.com/"
                        else -> "https://server.growatt.com/"
                    }

                    val isApiKey = connectionType == "FoxESS" || connectionType == "Solarman" || connectionType == "Solis"

                    SwayogCard(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "$connectionType Integration Portal",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Spacer(modifier = Modifier.width(8.dp))

                                Surface(
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text(
                                        text = "Portal Launcher",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            Text(
                                text = "Use the details below to log into the inverter cloud dashboard to verify active telemetry metrics.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (isApiKey) {
                                    CredentialRow(
                                        label = "API Key:",
                                        value = selectedCustomer.inverterApiKey ?: "Not set",
                                        onCopy = {
                                            selectedCustomer.inverterApiKey?.let {
                                                clipboardManager.setText(AnnotatedString(it))
                                                Toast.makeText(context, "API Key copied", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                    CredentialRow(
                                        label = "Device SN:",
                                        value = selectedCustomer.inverterDeviceSn ?: "Not set",
                                        onCopy = {
                                            selectedCustomer.inverterDeviceSn?.let {
                                                clipboardManager.setText(AnnotatedString(it))
                                                Toast.makeText(context, "Device SN copied", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                } else {
                                    CredentialRow(
                                        label = "Login ID:",
                                        value = selectedCustomer.inverterLoginId ?: "Not set",
                                        onCopy = {
                                            selectedCustomer.inverterLoginId?.let {
                                                clipboardManager.setText(AnnotatedString(it))
                                                Toast.makeText(context, "Login ID copied", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                    CredentialRow(
                                        label = "Password:",
                                        value = if (selectedCustomer.inverterPassword.isNullOrEmpty()) "Not set" else selectedCustomer.inverterPassword,
                                        onCopy = {
                                            selectedCustomer.inverterPassword?.let {
                                                clipboardManager.setText(AnnotatedString(it))
                                                Toast.makeText(context, "Password copied", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            SwayogButton(
                                text = "Launch Cloud Portal Webpage",
                                onClick = {
                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(portalUrl))
                                    context.startActivity(browserIntent)
                                },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            } else {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 60.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AccountBox,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f),
                                modifier = Modifier.size(60.dp)
                            )
                            Text(
                                text = "No Client Selected",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            )
                            Text(
                                text = "Choose a customer code above to view site summaries and inverter logs.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 32.dp)
                            )
                        }
                    }
                }
            }
        }

        // Overlay Loading indicator during pull to refresh or page initial sync
        AnimatedVisibility(
            visible = isRefreshing,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(24.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        Text(text = "Syncing portal...", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        // CUSTOM SEARCHABLE CUSTOMER DIALOG
        if (showCustomerSearchDialog) {
            CustomerSearchDialog(
                customers = filteredCustomers,
                onSelect = { customerId ->
                    viewModel.selectCustomer(customerId)
                    showCustomerSearchDialog = false
                },
                onDismiss = { showCustomerSearchDialog = false }
            )
        }

        // UPDATE CREDENTIALS DIALOG
        if (showCredentialsDialog && selectedCustomer != null) {
            UpdateCredentialsDialog(
                customer = selectedCustomer,
                viewModel = viewModel,
                onDismiss = { showCredentialsDialog = false }
            )
        }
    }
}

@Composable
fun TelemetryMetric(
    label: String,
    value: String,
    unit: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(84.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                fontWeight = FontWeight.Bold,
                fontSize = 9.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.width(2.dp))
                Text(
                    text = unit,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    modifier = Modifier.padding(bottom = 2.dp)
                )
            }
        }
    }
}

@Composable
fun CredentialRow(
    label: String,
    value: String,
    onCopy: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        
        Text(
            text = "COPY",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier
                .clickable(onClick = onCopy)
                .padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
fun AmcVisitItem(visit: AmcVisit, technicianName: String) {
    val isDone = visit.status.equals("completed", true)
    val customerName = visit.customer?.fullName ?: "Customer #${visit.customerId}"
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Cleaning #${visit.cleaningNumber ?: "—"}",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Bold
                )
                
                Surface(
                    color = (if (isDone) Color(0xFF0B6E4F) else Color(0xFFFFC857)).copy(alpha = 0.12f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = visit.status.uppercase(),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isDone) Color(0xFF0B6E4F) else Color(0xFFB58900),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Event,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = try {
                            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            val date = parser.parse(visit.scheduledDate.substringBefore("."))
                            SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(date!!)
                        } catch (_: Exception) {
                            visit.scheduledDate.substringBefore("T")
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.AccessTime,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = visit.timeSlot ?: "Anytime",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Customer: $customerName",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Badge,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp),
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Assigned to: $technicianName",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            if (!visit.notes.isNullOrBlank()) {
                Text(
                    text = "Visit note: ${visit.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
                )
            }

            if (isDone && visit.completedByName != null) {
                Text(
                    text = "Completed by ${visit.completedByName} on " + try {
                        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                        val date = parser.parse(visit.completedAt!!.substringBefore("."))
                        SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(date!!)
                    } catch (_: Exception) {
                        visit.completedAt ?: ""
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF0B6E4F),
                    fontWeight = FontWeight.Medium
                )
            }

            if (!visit.visitNotes.isNullOrBlank()) {
                Text(
                    text = "Completion note: ${visit.visitNotes}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
                )
            }
        }
    }
}

// CUSTOM LINE/AREA GENERATION CHART DRAWN VIA CANVAS
@Composable
fun GenerationChart(
    history: List<GenerationHistory>,
    modifier: Modifier = Modifier,
    selectedPeriod: String = "daily"
) {
    val isRealtime = selectedPeriod == "realtime"
    
    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val padding = 40f

        val activeWidth = width - 2 * padding
        val activeHeight = height - 2 * padding

        // Use power for realtime, generation for other periods
        val maxVal = if (isRealtime) {
            history.maxOf { it.power ?: 0.0 }.coerceAtLeast(1.0)
        } else {
            history.maxOf { it.generation }.coerceAtLeast(10.0)
        }

        // Draw dotted grid lines
        val gridLines = 4
        for (i in 0..gridLines) {
            val y = padding + (activeHeight * i / gridLines)
            // Horizontal grid lines
            drawLine(
                color = Color.LightGray.copy(alpha = 0.4f),
                start = Offset(padding, y),
                end = Offset(width - padding, y),
                strokeWidth = 1f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
            )
        }

        // Plot coordinates
        val points = mutableListOf<Offset>()

        history.forEachIndexed { idx, item ->
            val fraction = if (history.size > 1) idx.toFloat() / (history.size - 1) else 0.5f
            val x = padding + activeWidth * fraction
            
            val value = if (isRealtime) item.power ?: 0.0 else item.generation
            val y = height - padding - (activeHeight * (value / maxVal).toFloat())
            points.add(Offset(x, y))
        }

        // Draw Area under Path (for realtime)
        if (isRealtime && points.isNotEmpty()) {
            val areaPath = Path().apply {
                moveTo(points.first().x, height - padding)
                points.forEach { offset ->
                    lineTo(offset.x, offset.y)
                }
                lineTo(points.last().x, height - padding)
                close()
            }
            
            drawPath(
                path = areaPath,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF10B981).copy(alpha = 0.4f),
                        Color(0xFF10B981).copy(alpha = 0.0f)
                    ),
                    startY = points.minOf { it.y },
                    endY = height - padding
                )
            )
        }

        // Draw Line/Area based on period
        if (points.size > 1) {
            if (isRealtime) {
                // Area chart for realtime power
                val path = Path().apply {
                    moveTo(points.first().x, points.first().y)
                    for (i in 1 until points.size) {
                        lineTo(points[i].x, points[i].y)
                    }
                }
                drawPath(
                    path = path,
                    color = Color(0xFF10B981),
                    style = Stroke(width = 3f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                )
            } else {
                // Bar chart for daily/monthly/yearly generation
                val barWidth = (activeWidth / history.size) * 0.6f
                history.forEachIndexed { idx, item ->
                    val value = item.generation
                    val fraction = if (history.size > 1) idx.toFloat() / (history.size - 1) else 0.5f
                    val x = padding + activeWidth * fraction - barWidth / 2
                    val barHeight = (activeHeight * (value / maxVal).toFloat())
                    val y = height - padding - barHeight
                    
                    drawRoundRect(
                        color = Color(0xFF0EA5E9),
                        topLeft = Offset(x, y),
                        size = Size(barWidth, barHeight),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(4f, 4f)
                    )
                }
            }
        }
    }
}

// CUSTOM SEARCHABLE CUSTOMER LIST DIALOG
@Composable
fun CustomerSearchDialog(
    customers: List<Customer>,
    onSelect: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val filtered = remember(customers, searchQuery) {
        if (searchQuery.isEmpty()) {
            customers
        } else {
            customers.filter {
                it.fullName.contains(searchQuery, ignoreCase = true) ||
                it.customerCode.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.7f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Select Customer",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by name or code...") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    singleLine = true,
                    shape = RoundedCornerShape(8.dp)
                )

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (filtered.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No customers found.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                        }
                    } else {
                        items(filtered, key = { it.id }) { customer ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable { onSelect(customer.id) }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = customer.fullName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "${customer.customerCode} · ${customer.city}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }
                            }
                            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                }
            }
        }
    }
}

// UPDATE CUSTOMER CREDENTIALS DIALOG
@Composable
fun UpdateCredentialsDialog(
    customer: Customer,
    viewModel: ServiceCoordinatorViewModel,
    onDismiss: () -> Unit
) {
    val isUpdating by viewModel.isUpdatingCredentials.collectAsState()
    val updateError by viewModel.updateError.collectAsState()

    var brand by remember { mutableStateOf(customer.inverterBrand ?: "") }
    var loginId by remember { mutableStateOf(customer.inverterLoginId ?: "") }
    var passwordVal by remember { mutableStateOf(customer.inverterPassword ?: "") }
    var apiKey by remember { mutableStateOf(customer.inverterApiKey ?: "") }
    var deviceSn by remember { mutableStateOf(customer.inverterDeviceSn ?: "") }
    var city by remember { mutableStateOf(customer.city ?: "") }
    var address by remember { mutableStateOf(customer.address ?: "") }
    var stageStr by remember { mutableStateOf(customer.projectStage?.toString() ?: "0") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Update Credentials",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        OutlinedTextField(
                            value = brand,
                            onValueChange = { brand = it },
                            label = { Text("Inverter Brand (e.g. Growatt, KSolar)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = loginId,
                            onValueChange = { loginId = it },
                            label = { Text("Inverter Login ID") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = passwordVal,
                            onValueChange = { passwordVal = it },
                            label = { Text("Inverter Password") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = apiKey,
                            onValueChange = { apiKey = it },
                            label = { Text("Inverter API Key (if any)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = deviceSn,
                            onValueChange = { deviceSn = it },
                            label = { Text("Device Serial Number (if any)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = city,
                            onValueChange = { city = it },
                            label = { Text("City") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = { Text("Installation Address") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 2,
                            maxLines = 3
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = stageStr,
                            onValueChange = { stageStr = it },
                            label = { Text("Project Stage (Number 1-10)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }

                    updateError?.let { err ->
                        item {
                            Text(
                                text = err,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.error,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isUpdating) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    if (isUpdating) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    } else {
                        Button(
                            onClick = {
                                val stage = stageStr.toIntOrNull() ?: customer.projectStage
                                viewModel.updateCredentials(
                                    customerId = customer.id,
                                    brand = brand.trim().ifEmpty { null },
                                    loginId = loginId.trim().ifEmpty { null },
                                    passwordVal = passwordVal.trim().ifEmpty { null },
                                    apiKey = apiKey.trim().ifEmpty { null },
                                    deviceSn = deviceSn.trim().ifEmpty { null },
                                    city = city.trim(),
                                    address = address.trim(),
                                    projectStage = stage,
                                    onSuccess = { onDismiss() }
                                )
                            }
                        ) {
                            Text("Save Changes")
                        }
                    }
                }
            }
        }
    }
}

