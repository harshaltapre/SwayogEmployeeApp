package com.swayog.employee.presentation.subadmin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.google.maps.android.compose.clustering.Clustering
import com.swayog.employee.data.model.Customer
import com.swayog.employee.data.model.ServiceRequest
import com.swayog.employee.presentation.common.components.*

import com.google.maps.android.clustering.ClusterItem

sealed class MapPinType : ClusterItem {
    data class Amc(val customer: Customer) : MapPinType() {
        override fun getPosition(): LatLng = LatLng(customer.latitude!!, customer.longitude!!)
        override fun getTitle(): String = customer.fullName
        override fun getSnippet(): String = "AMC Site"
        override fun getZIndex(): Float? = null
    }
    data class Complaint(val request: ServiceRequest) : MapPinType() {
        override fun getPosition(): LatLng = LatLng(request.latitude!!, request.longitude!!)
        override fun getTitle(): String = request.title
        override fun getSnippet(): String = "Complaint"
        override fun getZIndex(): Float? = null
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminMapScreen(
    onNavigateBack: () -> Unit,
    onNavigateToEmployees: () -> Unit = {},
    modifier: Modifier = Modifier,
    viewModel: SubAdminMapViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val customers by viewModel.customers.collectAsState()
    val complaints by viewModel.complaints.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var selectedFilter by remember { mutableIntStateOf(0) } // 0: All, 1: AMC, 2: Complaints
    var selectedLocationPins by remember { mutableStateOf<List<MapPinType>?>(null) }
    var selectedComplaintToSchedule by remember { mutableStateOf<ServiceRequest?>(null) }
    var isScheduleOpen by remember { mutableStateOf(false) }
    var isPerformingAction by remember { mutableStateOf(false) }

    val activePins = remember(customers, complaints, selectedFilter) {
        val cityCoords = mapOf(
            "pune" to LatLng(18.5204, 73.8567),
            "mumbai" to LatLng(19.076, 72.8777),
            "delhi" to LatLng(28.7041, 77.1025),
            "bangalore" to LatLng(12.9716, 77.5946),
            "chennai" to LatLng(13.0827, 80.2707),
            "kolkata" to LatLng(22.5726, 88.3639),
            "hyderabad" to LatLng(17.385, 78.4867),
            "ahmedabad" to LatLng(23.0225, 72.5714),
            "jaipur" to LatLng(26.9124, 75.7873),
            "surat" to LatLng(21.1702, 72.8311)
        )
        val list = mutableListOf<MapPinType>()
        if (selectedFilter == 0 || selectedFilter == 1) {
            customers.forEach { cust ->
                val lat = cust.latitude ?: cityCoords[cust.city?.lowercase()?.trim()]?.latitude
                val lng = cust.longitude ?: cityCoords[cust.city?.lowercase()?.trim()]?.longitude
                if (lat != null && lng != null) {
                    list.add(MapPinType.Amc(cust.copy(latitude = lat, longitude = lng)))
                }
            }
        }
        if (selectedFilter == 0 || selectedFilter == 2) {
            complaints.forEach { req ->
                val lat = req.latitude ?: cityCoords[req.customerCity?.lowercase()?.trim()]?.latitude
                val lng = req.longitude ?: cityCoords[req.customerCity?.lowercase()?.trim()]?.longitude
                if (lat != null && lng != null) {
                    list.add(MapPinType.Complaint(req.copy(latitude = lat, longitude = lng)))
                }
            }
        }
        list
    }

    // Camera initial position centering on first pin or defaults to Pune
    val defaultLatLng = LatLng(18.5204, 73.8567)
    val groupedPins = remember(activePins) {
        activePins.groupBy { pin ->
            when (pin) {
                is MapPinType.Amc -> LatLng(pin.customer.latitude!!, pin.customer.longitude!!)
                is MapPinType.Complaint -> LatLng(pin.request.latitude!!, pin.request.longitude!!)
            }
        }
    }
    
    val cameraPositionState = rememberCameraPositionState {
        val firstPin = activePins.firstOrNull()
        val center = when (firstPin) {
            is MapPinType.Amc -> LatLng(firstPin.customer.latitude!!, firstPin.customer.longitude!!)
            is MapPinType.Complaint -> LatLng(firstPin.request.latitude!!, firstPin.request.longitude!!)
            null -> defaultLatLng
        }
        position = CameraPosition.fromLatLngZoom(center, 8f)
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            SwayogTopBar(
                title = "Geospatial Sites Map",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    IconButton(onClick = onNavigateToEmployees) {
                        Icon(Icons.Default.People, contentDescription = "Technicians")
                    }
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Filters Row
                TabRow(selectedTabIndex = selectedFilter) {
                    Tab(selected = selectedFilter == 0, onClick = { selectedFilter = 0; selectedLocationPins = null }, text = { Text("All Sites") })
                    Tab(selected = selectedFilter == 1, onClick = { selectedFilter = 1; selectedLocationPins = null }, text = { Text("AMC Sites") })
                    Tab(selected = selectedFilter == 2, onClick = { selectedFilter = 2; selectedLocationPins = null }, text = { Text("Complaints") })
                }

                // Google Map
                GoogleMap(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    cameraPositionState = cameraPositionState
                ) {
                    Clustering(
                        items = activePins,
                        onClusterClick = { cluster ->
                            selectedLocationPins = cluster.items.toList()
                            true
                        },
                        onClusterItemClick = { item ->
                            selectedLocationPins = listOf(item)
                            true
                        },
                        clusterItemContent = { item ->
                            val (color, icon) = when (item) {
                                is MapPinType.Amc -> Color(0xFF10B981) to "✓" // Green for AMC
                                is MapPinType.Complaint -> {
                                    if (item.request.status.lowercase() == "pending") {
                                        Color(0xFFEF4444) to "!" // Red for pending
                                    } else {
                                        Color(0xFF3B82F6) to "📅" // Blue for scheduled
                                    }
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color.White, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(color, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = icon,
                                        color = Color.White,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    )
                }
            }

            // Error Message Banner
            errorMessage?.let { msg ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .align(Alignment.TopCenter),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Error, contentDescription = "Error", tint = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = msg, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onErrorContainer)
                    }
                }
            }

            // Info Dialog / Details Card Overlay at bottom
            selectedLocationPins?.let { pins ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                ) {
                    SwayogCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 400.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (pins.size > 1) "${pins.size} Sites at this location" else "Site Details",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                IconButton(
                                    onClick = { selectedLocationPins = null },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Close Card")
                                }
                            }
                            
                            val scrollState = rememberScrollState()
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .verticalScroll(scrollState),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                pins.forEachIndexed { index, pin ->
                                    if (index > 0) Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))

                            when (pin) {
                                is MapPinType.Amc -> {
                                    val customer = pin.customer
                                    Text(
                                        text = customer.fullName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Code: ${customer.customerCode} · System: ${customer.systemSizeKw} kW",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        text = "City: ${customer.city} · Address: ${customer.address}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                                is MapPinType.Complaint -> {
                                    val req = pin.request
                                    Text(
                                        text = req.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Customer: ${req.customerName ?: "Unknown"}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Scheduled: ${req.scheduledDate ?: "N/A"} ${req.scheduledTime ?: ""}".trim(),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                    )
                                    Text(
                                        text = "Status: ${req.status.uppercase()}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Bold,
                                        color = if (req.status.lowercase() == "resolved" || req.status.lowercase() == "completed") Color(0xFF10B981) else MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = req.description,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                    req.address?.let {
                                        Text(
                                            text = "Address: $it",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    }

                                    req.assignedEmployeeId?.let { techId ->
                                        val techName = employees.find { it.id == techId }?.fullName ?: "Technician"
                                        Text(
                                            text = "Assigned to: $techName",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.padding(top = 4.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    if (req.status.lowercase() != "resolved") {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Button(
                                                onClick = { 
                                                    selectedComplaintToSchedule = req
                                                    isScheduleOpen = true 
                                                },
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text(if (req.status.lowercase() == "scheduled") "Reschedule" else "Schedule")
                                            }
                                            if (req.status.lowercase() == "scheduled") {
                                                Button(
                                                    onClick = {
                                                        isPerformingAction = true
                                                        viewModel.resolveComplaint(req.id) { res ->
                                                            isPerformingAction = false
                                                            res.onSuccess {
                                                                Toast.makeText(context, "Complaint marked as Resolved!", Toast.LENGTH_SHORT).show()
                                                                selectedLocationPins = null
                                                                viewModel.loadData()
                                                            }.onFailure {
                                                                Toast.makeText(context, it.message ?: "Failed to resolve complaint", Toast.LENGTH_LONG).show()
                                                            }
                                                        }
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Text("Resolve")
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                        }
                    }
                }
            }

            // Visit Scheduling dialog inside map
            if (isScheduleOpen && selectedComplaintToSchedule != null) {
                val req = selectedComplaintToSchedule!!
                ScheduleVisitDialog(
                    employees = employees,
                    onDismiss = { 
                        isScheduleOpen = false
                        selectedComplaintToSchedule = null 
                    },
                    onSubmit = { date, time, techId ->
                        isPerformingAction = true
                        viewModel.scheduleVisit(req.id, date, time, techId) { res ->
                            isPerformingAction = false
                            isScheduleOpen = false
                            res.onSuccess {
                                Toast.makeText(context, "Visit scheduled successfully!", Toast.LENGTH_SHORT).show()
                                selectedComplaintToSchedule = null
                                viewModel.loadData()
                            }.onFailure {
                                Toast.makeText(context, it.message ?: "Failed to schedule visit", Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    isLoading = isPerformingAction
                )
            }
        }
    }
}
