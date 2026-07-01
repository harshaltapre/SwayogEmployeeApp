package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*

data class AmcContract(
    val id: String,
    val customerName: String,
    val city: String,
    val systemSizeKw: Double,
    val amcStatus: String,
    val nextCleaningDate: String,
    val assignedTech: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmcManagement(viewModel: MainViewModel) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("All Contracts") }
    
    // Sync customers and AMC visits when screen loads
    LaunchedEffect(Unit) {
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.CUSTOMERS)
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.AMC_VISITS)
    }

    var contracts by remember {
        mutableStateOf(
            listOf(
                AmcContract("1", "John Doe", "Mumbai", 10.0, "Active", "2026-07-05", "Mohsin Ali"),
                AmcContract("2", "Jane Smith", "Pune", 15.0, "Active", "2026-07-10", "Deepak R."),
                AmcContract("3", "Amit Patel", "Nagpur", 25.0, "Due for Renewal", "2026-06-30", "Sanjay M.")
            )
        )
    }

    val filteredContracts = remember(contracts, searchQuery, selectedFilter) {
        contracts.filter {
            val queryMatch = it.customerName.contains(searchQuery, ignoreCase = true) || it.city.contains(searchQuery, ignoreCase = true)
            val filterMatch = when (selectedFilter) {
                "Active" -> it.amcStatus == "Active"
                "Due Renewal" -> it.amcStatus == "Due for Renewal"
                else -> true
            }
            queryMatch && filterMatch
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("AMC MANAGEMENT HUB", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search client name or city...", color = MutedText) },
            leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = MutedText) },
            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("All Contracts", "Active", "Due Renewal").forEach { filter ->
                val active = selectedFilter == filter
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (active) PrimaryAmber else SurfaceDark)
                        .clickable { selectedFilter = filter }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(filter, color = if (active) BackgroundDark else NeutralText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(filteredContracts) { contract ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(contract.customerName, color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text(
                                contract.amcStatus,
                                color = if (contract.amcStatus == "Active") SuccessGreen else PrimaryAmber,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text("${contract.systemSizeKw} kW • ${contract.city}", color = MutedText, fontSize = 13.sp)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Next Visit: ${contract.nextCleaningDate}", color = PrimaryAmber, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("Tech: ${contract.assignedTech}", color = EngineeringBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
