package com.example.swayogemployeeapp.ui.screens

import android.widget.Toast
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.ui.theme.*

data class ComplaintTicket(
    val id: String,
    val ticketCode: String,
    val customerName: String,
    val phone: String,
    val city: String,
    val issueType: String,
    val description: String,
    val priority: String,
    val status: String,
    val assignedTech: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminComplaints(viewModel: MainViewModel) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("All Tickets") }
    var showAssignModal by remember { mutableStateOf(false) }
    var selectedTicket by remember { mutableStateOf<ComplaintTicket?>(null) }
    
    val tasksState by viewModel.tasks.collectAsState()
    
    // Sync tasks when screen loads
    LaunchedEffect(Unit) {
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.TASKS)
    }

    var tickets by remember {
        mutableStateOf(
            listOf(
                ComplaintTicket("1", "TKT-101", "John Doe", "+91 98765 43210", "Mumbai", "Inverter Offline", "Growatt inverter red light glowing, no generation.", "High", "Pending", "Mohsin Ali"),
                ComplaintTicket("2", "TKT-102", "Jane Smith", "+91 98765 43211", "Pune", "Panel Damage", "Storm damaged glass on panel #4.", "Medium", "In Progress", "Deepak R."),
                ComplaintTicket("3", "TKT-103", "Amit Patel", "+91 98765 43212", "Nagpur", "Grid Tripping", "MCB trips during peak solar generation.", "High", "Resolved", "Rajesh K.")
            )
        )
    }

    val filteredTickets = remember(tickets, searchQuery, selectedFilter) {
        tickets.filter {
            val queryMatch = it.customerName.contains(searchQuery, ignoreCase = true) || it.ticketCode.contains(searchQuery, ignoreCase = true)
            val filterMatch = when (selectedFilter) {
                "Pending" -> it.status == "Pending"
                "In Progress" -> it.status == "In Progress"
                "Resolved" -> it.status == "Resolved"
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
        Text("COMPLAINTS MANAGEMENT", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by ticket code or customer...", color = MutedText) },
            leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = MutedText) },
            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("All Tickets", "Pending", "In Progress", "Resolved").forEach { status ->
                val active = selectedFilter == status
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (active) PrimaryAmber else SurfaceDark)
                        .clickable { selectedFilter = status }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(status, color = if (active) BackgroundDark else NeutralText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(filteredTickets) { ticket ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(ticket.ticketCode, color = PrimaryAmber, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(if (ticket.priority == "High") Color.Red.copy(alpha = 0.2f) else PrimaryAmber.copy(alpha = 0.2f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(ticket.priority, color = if (ticket.priority == "High") Color.Red else PrimaryAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Text(
                                ticket.status,
                                color = when (ticket.status) {
                                    "Resolved" -> SuccessGreen
                                    "In Progress" -> EngineeringBlue
                                    else -> Color.Red
                                },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text("${ticket.customerName} • ${ticket.city}", color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(ticket.description, color = MutedText, fontSize = 12.sp)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Tech: ${ticket.assignedTech}", color = EngineeringBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Button(
                                onClick = {
                                    selectedTicket = ticket
                                    showAssignModal = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = BackgroundDark),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Reassign / Update", color = PrimaryAmber, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAssignModal && selectedTicket != null) {
        var techName by remember { mutableStateOf(selectedTicket!!.assignedTech) }
        var newStatus by remember { mutableStateOf(selectedTicket!!.status) }

        AlertDialog(
            onDismissRequest = { showAssignModal = false },
            title = { Text("Update Ticket #${selectedTicket!!.ticketCode}", color = PrimaryAmber, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Customer: ${selectedTicket!!.customerName}", color = NeutralText, fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = techName,
                        onValueChange = { techName = it },
                        label = { Text("Assigned Field Technician", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("Pending", "In Progress", "Resolved").forEach { status ->
                            val active = newStatus == status
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (active) PrimaryAmber else BackgroundDark)
                                    .clickable { newStatus = status }
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text(status, color = if (active) BackgroundDark else NeutralText, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        tickets = tickets.map {
                            if (it.id == selectedTicket!!.id) it.copy(assignedTech = techName, status = newStatus) else it
                        }
                        Toast.makeText(context, "Ticket updated successfully!", Toast.LENGTH_SHORT).show()
                        showAssignModal = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                ) {
                    Text("SAVE CHANGES", color = BackgroundDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAssignModal = false }) {
                    Text("CANCEL", color = MutedText)
                }
            },
            containerColor = SurfaceDark
        )
    }
}
