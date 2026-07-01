package com.example.swayogemployeeapp.ui.screens

import android.graphics.Bitmap
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceDashboard(viewModel: MainViewModel) {
    val tasks by viewModel.tasks.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    val complaintTasks = tasks.filter { it.jobType == "Complaint" }

    var selectedTask by remember { mutableStateOf<EmployeeTaskEntity?>(null) }
    
    // Offline Error codes directory states
    var errorSearchQuery by remember { mutableStateOf("") }
    var errorDescriptionResult by remember { mutableStateOf<String?>(null) }

    // Spare parts consumption state
    var selectedSparePart by remember { mutableStateOf("None") }
    var workDoneText by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    // Signature path state
    val signaturePaths = remember { mutableStateListOf<Path>() }
    var currentPath by remember { mutableStateOf<Path?>(null) }

    // Offline Error Code list simulation
    val errorCodesList = mapOf(
        "117" to "PV Voltage High. Check series string size and Voc calculation.",
        "120" to "Inverter Over-temperature. Check ventilation fans and ambient workspace.",
        "301" to "AC Grid Out of Range. Voltage phase sequence or frequency mismatch.",
        "402" to "Leakage Current Fault. Insulation resistance breakdown in DC wiring.",
        "105" to "Boost Sensor Fault. DC-DC converter sensor error."
    )

    if (selectedTask == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("CLIENT COMPLAINT & SERVICE TICKETS", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

            if (complaintTasks.isEmpty()) {
                val mockTasks = listOf(
                    EmployeeTaskEntity(401, "Complaint", "Growatt Red light error 117", "2026-06-19T11:00:00Z", "assigned", "David Miller", "+91 99338 84433", "Hiranandani Gardens, Powai, Mumbai", 19.11, 72.90, null, null, null),
                    EmployeeTaskEntity(402, "Complaint", "No power output generation since morning", "2026-06-19T15:00:00Z", "assigned", "Karthik Pillai", "+91 88776 65544", "Mulund West, Mumbai", 19.17, 72.95, null, null, null)
                )
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(mockTasks) { t ->
                        ComplaintTaskItem(t) { selectedTask = t }
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(complaintTasks) { t ->
                        ComplaintTaskItem(t) { selectedTask = t }
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
            Text("RESOLVE COMPLAINT: TICKET #${task.id}", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // 1. Offline Diagnostic Directory Search
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("1. OFFLINE DIAGNOSTIC DIRECTORY MANUAL", style = Typography.labelSmall, color = EngineeringBlue, fontWeight = FontWeight.Bold)
                
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = errorSearchQuery,
                        onValueChange = {
                            errorSearchQuery = it
                            errorDescriptionResult = errorCodesList[it.trim()]
                        },
                        placeholder = { Text("Search error code... e.g. 117", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = PrimaryAmber)
                }

                errorDescriptionResult?.let {
                    Card(colors = CardDefaults.cardColors(containerColor = BackgroundDark)) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = PrimaryAmber)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Code $errorSearchQuery: $it", color = NeutralText, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // 2. Spare Parts & Work Done
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("2. SERVICE & PARTS RECORD", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                Text("Spares Consumed:", color = NeutralText)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("None", "MC4 Connector", "32A AC MCB", "PV Fuse 15A").forEach { part ->
                        val active = selectedSparePart == part
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (active) PrimaryAmber else BackgroundDark)
                                .clickable { selectedSparePart = part }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(part, color = if (active) BackgroundDark else NeutralText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                OutlinedTextField(
                    value = workDoneText,
                    onValueChange = { workDoneText = it },
                    label = { Text("Describe work done / repairs performed...", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth().height(80.dp)
                )
            }
        }

        // 3. Digital Signature pad
        Text("3. CLIENT DIGITAL SIGNATURE SIGN-OFF", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .border(1.dp, BorderGray, RoundedCornerShape(8.dp))
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.White.copy(alpha = 0.05f))
                        .pointerInput(Unit) {
                            detectDragGestures(
                                onDragStart = { offset ->
                                    val path = Path().apply { moveTo(offset.x, offset.y) }
                                    currentPath = path
                                    signaturePaths.add(path)
                                },
                                onDrag = { change, _ ->
                                    currentPath?.lineTo(change.position.x, change.position.y)
                                    // Trigger canvas redraw
                                    val temp = currentPath
                                    currentPath = null
                                    currentPath = temp
                                }
                            )
                        }
                ) {
                    signaturePaths.forEach { path ->
                        drawPath(
                            path = path,
                            color = PrimaryAmber,
                            style = Stroke(width = 5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                        )
                    }
                }

                // Signature placeholder text
                if (signaturePaths.isEmpty()) {
                    Text(
                        text = "Sign here with finger...",
                        color = MutedText,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                IconButton(
                    onClick = { signaturePaths.clear() },
                    modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp)
                ) {
                    Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear", tint = Color.Red)
                }
            }
        }

        // Submit closure CTA
        Button(
            onClick = {
                isSubmitting = true
                val msg = "Resolved complaint. Work: $workDoneText. Part used: $selectedSparePart."
                val receipt = "https://swayog-dashboard-delta.vercel.app/uploads/receipts/rec-${task.id}.pdf"
                
                viewModel.completeTask(task.id, msg, receipt)

                coroutineScope.launch {
                    delay(1200)
                    isSubmitting = false
                    selectedTask = null
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = signaturePaths.isNotEmpty() && workDoneText.isNotEmpty() && !isSubmitting
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
            } else {
                Text("SOLVE & CLOSE COMPLAINT TICKET", color = BackgroundDark, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ComplaintTaskItem(task: EmployeeTaskEntity, onClick: () -> Unit) {
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
                    text = "Ticket: #${task.id} • ${task.customerName}",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Issue: ${task.description}", color = MutedText, fontSize = 13.sp)
            }
            Icon(imageVector = Icons.Default.Build, contentDescription = null, tint = PrimaryAmber)
        }
    }
}
