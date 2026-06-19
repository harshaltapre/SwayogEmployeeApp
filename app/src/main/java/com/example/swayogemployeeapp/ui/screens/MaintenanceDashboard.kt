package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.Image
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
fun MaintenanceDashboard(viewModel: MainViewModel) {
    val tasks by viewModel.tasks.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    val amcTasks = tasks.filter { it.jobType == "AMC Visit" }

    var selectedTask by remember { mutableStateOf<EmployeeTaskEntity?>(null) }
    
    // Checklist state
    var checkedDustClean by remember { mutableStateOf(false) }
    var checkedClampsTight by remember { mutableStateOf(false) }
    var checkedCableInspect by remember { mutableStateOf(false) }
    var checkedWaterPress by remember { mutableStateOf(false) }

    var beforePhoto by remember { mutableStateOf<String?>(null) }
    var afterPhoto by remember { mutableStateOf<String?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }

    if (selectedTask == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("DAILY SCHEDULED AMC VISITS & CLEANINGS", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

            if (amcTasks.isEmpty()) {
                val mockTasks = listOf(
                    EmployeeTaskEntity(301, "AMC Visit", "Quarterly panel wash & structure audit", "2026-06-19T09:30:00Z", "assigned", "Rajesh Khanna", "+91 99228 83377", "Sector 3, Charkop, Kandivali, Mumbai", 19.2, 72.82, null, null, null),
                    EmployeeTaskEntity(302, "AMC Visit", "Semi-annual cabling alignment", "2026-06-19T13:00:00Z", "assigned", "HDFC Bank Roof", "+91 88776 65544", "Bandra Kurla Complex, Mumbai", 19.06, 72.86, null, null, null)
                )
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(mockTasks) { t ->
                        AMCTaskItem(t) { selectedTask = t }
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(amcTasks) { t ->
                        AMCTaskItem(t) { selectedTask = t }
                    }
                }
            }
        }
        return
    }

    val task = selectedTask!!

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { selectedTask = null }) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryAmber)
            }
            Text("AMC PANEL CLEANING CHECK", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // Navigation route trigger
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Row(
                modifier = Modifier.padding(12.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("OPTIMIZED ROUTE NAVIGATION", style = Typography.labelSmall, color = EngineeringBlue, fontWeight = FontWeight.Bold)
                    Text("Address: ${task.address}", fontSize = 12.sp, color = MutedText)
                }
                Button(
                    onClick = {
                        // Normally fires Google Maps Intent
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BackgroundDark),
                    contentPadding = PaddingValues(horizontal = 12.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(imageVector = Icons.Default.Directions, contentDescription = null, tint = EngineeringBlue, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("NAVIGATE", color = EngineeringBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Before/After Photo Box comparison
        Text("REQUIRED AUDIT PHOTOS (WATERMARKED)", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Before Photo Box
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier
                    .weight(1f)
                    .height(140.dp)
                    .clickable {
                        beforePhoto = "before_clean_${task.id}.jpg"
                    }
            ) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    if (beforePhoto == null) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(imageVector = Icons.Default.PhotoCamera, contentDescription = null, tint = MutedText)
                            Text("Take BEFORE", color = MutedText, fontSize = 11.sp)
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.6f))
                                .padding(8.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("BEFORE (DIRTY)", color = Color.Red, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                            Spacer(modifier = Modifier.weight(1f))
                            Text("Lat: 19.12 • Jun 19 2026", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // After Photo Box
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                modifier = Modifier
                    .weight(1f)
                    .height(140.dp)
                    .clickable {
                        afterPhoto = "after_clean_${task.id}.jpg"
                    }
            ) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    if (afterPhoto == null) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(imageVector = Icons.Default.PhotoCamera, contentDescription = null, tint = MutedText)
                            Text("Take AFTER", color = MutedText, fontSize = 11.sp)
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.6f))
                                .padding(8.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("AFTER (CLEANED)", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                            Spacer(modifier = Modifier.weight(1f))
                            Text("Lat: 19.12 • Jun 19 2026", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Maintenance Checklist
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("AMC AUDIT INSPECTION LIST", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedDustClean, onCheckedChange = { checkedDustClean = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Dust layer completely washed and dried", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedClampsTight, onCheckedChange = { checkedClampsTight = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Checked structural clamps for physical looseness", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedCableInspect, onCheckedChange = { checkedCableInspect = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Visual check for micro-cracks/hot spots", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedWaterPress, onCheckedChange = { checkedWaterPress = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Site water pressure & availability validated", color = NeutralText)
                }
            }
        }

        // Complete AMC Visit button
        Button(
            onClick = {
                isSubmitting = true
                val desc = "Completed panel cleaning. Brackets checked. Shading: none."
                val receipt = "https://swayog-dashboard-delta.vercel.app/uploads/receipts/rec-${task.id}.pdf"
                
                viewModel.completeTask(task.id, desc, receipt)

                coroutineScope.launch {
                    delay(1200)
                    isSubmitting = false
                    selectedTask = null
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = beforePhoto != null && afterPhoto != null && checkedDustClean && checkedClampsTight && !isSubmitting
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
            } else {
                Text("COMPLETE AMC CLEANING VISIT", color = BackgroundDark, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun AMCTaskItem(task: EmployeeTaskEntity, onClick: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Customer: ${task.customerName}",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Target: ${task.address}", color = MutedText, fontSize = 13.sp)
            }
            Icon(imageVector = Icons.Default.CleanHands, contentDescription = null, tint = PrimaryAmber)
        }
    }
}
