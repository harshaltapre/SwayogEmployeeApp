package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
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

data class CalendarEventItem(
    val date: String,
    val title: String,
    val type: String,
    val time: String,
    val assignedTo: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubAdminCalendar(viewModel: MainViewModel) {
    var selectedMonth by remember { mutableStateOf("June 2026") }

    val tasksState by viewModel.tasks.collectAsState()
    
    // Sync tasks when screen loads
    LaunchedEffect(Unit) {
        viewModel.invalidateCache(com.example.swayogemployeeapp.data.sync.DataType.TASKS)
    }

    val events = remember(tasksState) {
        tasksState.map { task ->
            CalendarEventItem(
                date = task.scheduledTime.substringBefore("T"),
                title = task.description,
                type = task.jobType,
                time = task.scheduledTime.substringAfter("T").substringBefore("+").takeIf { it.isNotEmpty() } ?: "TBD",
                assignedTo = task.customerName
            )
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("CALENDAR & FIELD SCHEDULES", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

        // Month Navigation Card
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark), shape = RoundedCornerShape(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {}) { Icon(imageVector = Icons.Default.ChevronLeft, contentDescription = "Previous", tint = PrimaryAmber) }
                Text(selectedMonth, style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
                IconButton(onClick = {}) { Icon(imageVector = Icons.Default.ChevronRight, contentDescription = "Next", tint = PrimaryAmber) }
            }
        }

        Text("UPCOMING SCHEDULED EVENTS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(events) { event ->
                Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark), shape = RoundedCornerShape(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(event.date, color = PrimaryAmber, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(EngineeringBlue.copy(alpha = 0.2f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(event.type, color = EngineeringBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(event.title, color = NeutralText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Assigned to: ${event.assignedTo}", color = MutedText, fontSize = 12.sp)
                        }
                        Text(event.time, color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
