package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ElectricalDashboard(viewModel: MainViewModel) {
    val tasks by viewModel.tasks.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    val electricalTasks = tasks.filter { it.jobType == "Installation" || it.jobType == "Service" }

    var selectedTask by remember { mutableStateOf<EmployeeTaskEntity?>(null) }
    
    // Commissioning parameters
    var earthingResistance by remember { mutableStateOf("1.8") }
    var dcVocVoltage by remember { mutableStateOf("480") }
    var acVoltageLine by remember { mutableStateOf("232") }
    var netMeterNo by remember { mutableStateOf("NM-98273612-B") }
    
    // Checklist state
    var checkedMegger by remember { mutableStateOf(true) }
    var checkedGrounding by remember { mutableStateOf(true) }
    var checkedNetMeter by remember { mutableStateOf(false) }
    var checkedSurge by remember { mutableStateOf(false) }

    var scanDocumentAttached by remember { mutableStateOf<String?>(null) }
    var scanningMessage by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    if (selectedTask == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("COMMISSIONING & GRID CODE COMPLIANCE QUEUE", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

            if (electricalTasks.isEmpty()) {
                // Return generic list if database empty
                val mockTasks = listOf(
                    EmployeeTaskEntity(201, "Installation", "Verify 5kW AC grid commissioning", "2026-06-19T10:00:00Z", "assigned", "Alice Carter", "+91 99887 76655", "Plot 4B, Sector 15, Vashi, Mumbai", 19.08, 73.0, null, null, null),
                    EmployeeTaskEntity(202, "Installation", "AMC Pit Commissioning Audits", "2026-06-19T14:30:00Z", "assigned", "Rajesh Khanna", "+91 88776 65544", "Charkop, Kandivali West, Mumbai", 19.20, 72.82, null, null, null)
                )
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(mockTasks) { t ->
                        ElectricalTaskItem(t) { selectedTask = t }
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(electricalTasks) { t ->
                        ElectricalTaskItem(t) { selectedTask = t }
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
            Text("COMMISSIONING CHECKS: TASK-${task.id}", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // SLD Diagram Inspector Canvas
        Text("SINGLE LINE DIAGRAM (SLD) VECTOR SCHEMATIC", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                val canvasWidth = size.width
                val canvasHeight = size.height
                
                // Draw PV String block
                drawRect(
                    color = EngineeringBlue,
                    topLeft = Offset(20f, canvasHeight / 2f - 40f),
                    size = androidx.compose.ui.geometry.Size(120f, 80f),
                    style = Stroke(3f)
                )
                // PV string text normally requires drawing, we simplify with lines inside
                drawLine(EngineeringBlue, Offset(40f, canvasHeight / 2f - 20f), Offset(120f, canvasHeight / 2f - 20f), 3f)
                drawLine(EngineeringBlue, Offset(40f, canvasHeight / 2f), Offset(120f, canvasHeight / 2f), 3f)
                drawLine(EngineeringBlue, Offset(40f, canvasHeight / 2f + 20f), Offset(120f, canvasHeight / 2f + 20f), 3f)

                // Draw DC fuse line
                drawLine(PrimaryAmber, Offset(140f, canvasHeight / 2f), Offset(220f, canvasHeight / 2f), 4f)
                
                // Draw Inverter block
                drawRect(
                    color = PrimaryAmber,
                    topLeft = Offset(220f, canvasHeight / 2f - 50f),
                    size = androidx.compose.ui.geometry.Size(160f, 100f),
                    style = Stroke(3f)
                )
                // Draw DC/AC wave
                drawLine(PrimaryAmber, Offset(230f, canvasHeight / 2f - 20f), Offset(270f, canvasHeight / 2f - 20f), 3f)
                drawLine(SuccessGreen, Offset(330f, canvasHeight / 2f + 20f), Offset(370f, canvasHeight / 2f + 20f), 3f)

                // Draw AC cable line
                drawLine(SuccessGreen, Offset(380f, canvasHeight / 2f), Offset(460f, canvasHeight / 2f), 4f)

                // Draw Net-meter circle block
                drawCircle(
                    color = SuccessGreen,
                    center = Offset(510f, canvasHeight / 2f),
                    radius = 45f,
                    style = Stroke(3f)
                )
                // Draw Net-meter pulse
                drawLine(SuccessGreen, Offset(485f, canvasHeight / 2f), Offset(535f, canvasHeight / 2f), 3f)
                drawLine(SuccessGreen, Offset(510f, canvasHeight / 2f - 20f), Offset(510f, canvasHeight / 2f + 20f), 3f)

                // Draw grid line connection
                drawLine(NeutralText, Offset(555f, canvasHeight / 2f), Offset(650f, canvasHeight / 2f), 4f)

                // Draw Grid pole triangle
                drawLine(NeutralText, Offset(650f, canvasHeight / 2f), Offset(680f, canvasHeight / 2f - 40f), 3f)
                drawLine(NeutralText, Offset(650f, canvasHeight / 2f), Offset(680f, canvasHeight / 2f + 40f), 3f)
                drawLine(NeutralText, Offset(680f, canvasHeight / 2f - 40f), Offset(680f, canvasHeight / 2f + 40f), 3f)
            }
        }
        Text("Schematic: 1x PV Array 5.4kWp -> 1x 5kW Growatt Inv -> Bi-directional Net-Meter -> Utility Grid", style = Typography.labelSmall, color = MutedText, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.fillMaxWidth())

        // Commissioning Checklist
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("AC/DC COMPLIANCE TESTING CHECKLIST", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedMegger, onCheckedChange = { checkedMegger = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("AC Cable Insulation Resistance Test (Megger Check)", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedGrounding, onCheckedChange = { checkedGrounding = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Inverter Grounding & Earthing Resistance (<2 Ohm)", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedNetMeter, onCheckedChange = { checkedNetMeter = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Solar Net-Meter Installation Verified", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = checkedSurge, onCheckedChange = { checkedSurge = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("ACDB / DCDB Internal Surge Protection check", color = NeutralText)
                }
            }
        }

        // Technical Specs inputs
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("MEASURED SYSTEM VALUES", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = earthingResistance,
                    onValueChange = { earthingResistance = it },
                    label = { Text("Earthing Pit Resistance (Ohms)", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = dcVocVoltage,
                        onValueChange = { dcVocVoltage = it },
                        label = { Text("DC Open Circuit Voc (V)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = acVoltageLine,
                        onValueChange = { acVoltageLine = it },
                        label = { Text("AC Voltage (V)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = netMeterNo,
                    onValueChange = { netMeterNo = it },
                    label = { Text("Net Meter Serial ID No.", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // Commissioning Sheet Scanner Box
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("AUDITED COMMISSIONING REPORT DOCUMENT", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.DocumentScanner, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(36.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = scanDocumentAttached ?: "No document scanned", color = NeutralText, fontWeight = FontWeight.Bold)
                            Text(text = scanningMessage.ifEmpty { "Attach signed paper audits PDF" }, fontSize = 11.sp, color = MutedText)
                        }
                    }
                    Button(
                        onClick = {
                            scanDocumentAttached = "commissioning_${task.id}_signed.pdf"
                            scanningMessage = "Scanned: converted layout to high-contrast B&W PDF (284 KB)"
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("SCAN", fontSize = 11.sp)
                    }
                }
            }
        }

        // Submit for Audit button
        Button(
            onClick = {
                isSubmitting = true
                val pitRes = earthingResistance.toDoubleOrNull() ?: 1.8
                
                // Formulate completion message
                val msg = "Commissioned. Grounding: ${pitRes}Ohm. Voc: ${dcVocVoltage}V. Net Meter: $netMeterNo"
                val reportUrl = "https://swayog-dashboard-delta.vercel.app/uploads/receipts/rec-${task.id}.pdf"
                
                viewModel.completeTask(task.id, msg, reportUrl)

                coroutineScope.launch {
                    delay(1200)
                    isSubmitting = false
                    selectedTask = null
                }
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (checkedMegger && checkedGrounding && scanDocumentAttached != null) SuccessGreen else PrimaryAmber
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = checkedMegger && checkedGrounding && scanDocumentAttached != null && !isSubmitting
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
            } else {
                Text(
                    text = if (checkedMegger && checkedGrounding && scanDocumentAttached != null) "SUBMIT COMMISSIONING FOR AUDIT" else "COMPLETE SAFETY TESTING & DOCUMENT SCAN",
                    color = BackgroundDark,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun ElectricalTaskItem(task: EmployeeTaskEntity, onClick: () -> Unit) {
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
                    text = "Project: ${task.customerName}",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Job: ${task.description}", color = MutedText, fontSize = 13.sp)
                Text(text = "Site: ${task.address}", color = MutedText, fontSize = 12.sp)
            }
            Icon(imageVector = Icons.Default.ElectricBolt, contentDescription = null, tint = PrimaryAmber)
        }
    }
}
