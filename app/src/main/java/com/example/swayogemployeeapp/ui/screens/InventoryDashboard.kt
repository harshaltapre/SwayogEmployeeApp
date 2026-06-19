package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryDashboard(viewModel: MainViewModel) {
    val itemsState by viewModel.inventory.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    var showScannerDialog by remember { mutableStateOf(false) }
    var scannerResult by remember { mutableStateOf<String?>(null) }
    var selectedItemForAdjust by remember { mutableStateOf<InventoryItemEntity?>(null) }
    var showAdjustDialog by remember { mutableStateOf(false) }
    var showDispatchDialog by remember { mutableStateOf(false) }

    // Mock initial data if db is empty
    LaunchedEffect(itemsState) {
        if (itemsState.isEmpty()) {
            viewModel.addInventoryItem(InventoryItemEntity("itm_001", "Mono PERC 450W Solar Panels", "Module", 124.0, "Units", "HASH_PANEL_MONO"))
            viewModel.addInventoryItem(InventoryItemEntity("itm_002", "Growatt 5000TL3-S Inverter", "Inverter", 12.0, "Pcs", "HASH_INV_GWT5000"))
            viewModel.addInventoryItem(InventoryItemEntity("itm_003", "4sqmm DC Red Solar Cable", "Cable", 1200.0, "Meters", "HASH_CABLE_DC_4"))
            viewModel.addInventoryItem(InventoryItemEntity("itm_004", "Galvanized Solar Structure Brackets", "Structure", 3.0, "Sets", "HASH_STRUCT_BRACKET")) // Lower stock triggers alert!
            viewModel.addInventoryItem(InventoryItemEntity("itm_005", "MC4 Branch Connectors", "BOS", 80.0, "Pairs", "HASH_BOS_MC4"))
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Stock Alert summary
        val lowStockItems = itemsState.filter { (it.category == "Structure" && it.quantityInStock < 5) || (it.category == "Inverter" && it.quantityInStock < 3) }
        if (lowStockItems.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D)),
                border = BorderStroke(1.dp, Color(0xFFEF4444)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Color(0xFFFCA5A5))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("CRITICAL STOCK LIMIT ALERTS", color = Color(0xFFFCA5A5), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        lowStockItems.forEach {
                            Text("${it.itemName} is low in stock: ${it.quantityInStock} ${it.unit} left!", color = Color.White, fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Action Quick buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { showScannerDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Icon(imageVector = Icons.Default.QrCodeScanner, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("SCAN QR / BARCODE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { showDispatchDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Icon(imageVector = Icons.Default.LocalShipping, contentDescription = null, tint = BackgroundDark)
                Spacer(modifier = Modifier.width(6.dp))
                Text("DISPATCH DESK", color = BackgroundDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Warehouse Stock List
        Text("ACTIVE STOCK LEDGER (OFFLINE COMPATIBLE)", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.weight(1f).fillMaxWidth()
        ) {
            LazyColumn(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(itemsState) { item ->
                    val isLow = (item.category == "Structure" && item.quantityInStock < 5) || (item.category == "Inverter" && item.quantityInStock < 3)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(BackgroundDark)
                            .clickable {
                                selectedItemForAdjust = item
                                showAdjustDialog = true
                            }
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(item.itemName, color = NeutralText, fontWeight = FontWeight.Bold)
                            Text("Category: ${item.category} • QR Hash: ${item.qrCodeHash ?: "None"}", fontSize = 12.sp, color = MutedText)
                        }
                        Text(
                            text = "${item.quantityInStock} ${item.unit}",
                            color = if (isLow) Color(0xFFEF4444) else SuccessGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }
    }

    // Modal: Scanner Dialog Simulation
    if (showScannerDialog) {
        var scanningState by remember { mutableStateOf("READY TO SCAN") }
        
        AlertDialog(
            onDismissRequest = { showScannerDialog = false },
            title = { Text("Warehouse QR/Barcode Scanner", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth().height(160.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(imageVector = Icons.Default.CameraAlt, contentDescription = null, tint = MutedText, modifier = Modifier.size(56.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(scanningState, color = NeutralText, fontWeight = FontWeight.Bold)
                    Text("Point camera at inverter serial code barcode.", color = MutedText, fontSize = 12.sp)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        scanningState = "SCANNING..."
                        coroutineScope.launch {
                            delay(1000)
                            scannerResult = "SWAYOG-GWT-5000-TL3-982736"
                            scanningState = "SCANNED: $scannerResult"
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                ) {
                    Text("MOCK SCAN CODE", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showScannerDialog = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }

    // Modal: Offline Stock Adjust
    if (showAdjustDialog && selectedItemForAdjust != null) {
        val item = selectedItemForAdjust!!
        var adjustQtyStr by remember { mutableStateOf(item.quantityInStock.toString()) }

        AlertDialog(
            onDismissRequest = { showAdjustDialog = false },
            title = { Text("Adjust Stock Count Offline", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Directly edit warehouse stock ledger count for ${item.itemName}.", color = NeutralText)
                    OutlinedTextField(
                        value = adjustQtyStr,
                        onValueChange = { adjustQtyStr = it },
                        label = { Text("Stock Level (${item.unit})", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val qty = adjustQtyStr.toDoubleOrNull()
                        if (qty != null && qty >= 0.0) {
                            viewModel.adjustStock(item.id, qty)
                        }
                        showAdjustDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
                ) {
                    Text("SAVE CHANGES", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAdjustDialog = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }

    // Modal: Dispatch Desk list
    if (showDispatchDialog) {
        val dispatchRequests = listOf(
            MockDispatch("SW-101 (John Doe)", "Mono PERC Panels (10 Units), Growatt 5000TL (1 Pc)", "Pending Release"),
            MockDispatch("SW-204 (Jane Smith)", "4sqmm DC Solar Cables (100 meters)", "Pending Release"),
            MockDispatch("SW-302 (Rajesh Kumar)", "Galvanized Structures Brackets (1 Set)", "Pending Release")
        )

        AlertDialog(
            onDismissRequest = { showDispatchDialog = false },
            title = { Text("SC Material Dispatch Orders Desk", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth().height(260.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Releasing materials automatically updates warehouse stock count.", color = MutedText, fontSize = 12.sp)
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(dispatchRequests) { dispatch ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = BackgroundDark),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(dispatch.customer, color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    Text(dispatch.items, color = MutedText, fontSize = 11.sp)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(dispatch.status, color = PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        Button(
                                            onClick = {
                                                // Deduct panel or inverter stocks as released
                                                if (dispatch.customer.contains("SW-101")) {
                                                    viewModel.issueInventory("itm_001", 10.0) {}
                                                    viewModel.issueInventory("itm_002", 1.0) {}
                                                } else if (dispatch.customer.contains("SW-204")) {
                                                    viewModel.issueInventory("itm_003", 100.0) {}
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Text("RELEASE", color = BackgroundDark, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { showDispatchDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber)
                ) {
                    Text("DONE", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

data class MockDispatch(
    val customer: String,
    val items: String,
    val status: String
)
