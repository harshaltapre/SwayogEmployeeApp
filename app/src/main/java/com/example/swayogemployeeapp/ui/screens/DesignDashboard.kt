package com.example.swayogemployeeapp.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts

import androidx.compose.foundation.background
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
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DesignDashboard(viewModel: MainViewModel) {
    val surveys by viewModel.surveys.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    var selectedSurvey by remember { mutableStateOf<SiteSurveyEntity?>(null) }
    
    // Technical parameters
    var tiltAngle by remember { mutableStateOf("15.0") }
    var panelBrandCount by remember { mutableStateOf("12 Panels (Mono PERC 450W)") }
    var inverterSizeKw by remember { mutableStateOf("5.4") }
    var wiringSpecs by remember { mutableStateOf("4sqmm DC Solar Cables, 32A AC MCB") }
    
    var cadFileAttached by remember { mutableStateOf<String?>(null) }
    var sldFileAttached by remember { mutableStateOf<String?>(null) }
    var uploadStatusMessage by remember { mutableStateOf("") }
    var isUploading by remember { mutableStateOf(false) }

    val cadLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            cadFileAttached = uri.toString()
        }
    }

    val sldLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            sldFileAttached = uri.toString()
        }
    }

    fun getFileName(uriString: String?): String {
        if (uriString == null) return "No drawing attached"
        return uriString.substringAfterLast("/")
    }

    if (selectedSurvey == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("SURVEY REPORTS QUEUED FOR DESIGNING", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)

            if (surveys.isEmpty()) {
                // If local database SiteSurveys is empty, supply mock list
                val mockSurveys = listOf(
                    SiteSurveyEntity(1, 101, "Jane Smith", "Concrete", 45.0, 30.0, "Trees to SW", "{}", 5.4, 19.12, 72.89, "", false),
                    SiteSurveyEntity(2, 102, "John Doe", "Tin Sheet", 60.0, 40.0, "High parapet wall", "{}", 10.0, 19.14, 72.88, "", false)
                )
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(mockSurveys) { s ->
                        DesignSurveyListItem(s) { selectedSurvey = s }
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(surveys) { s ->
                        DesignSurveyListItem(s) { selectedSurvey = s }
                    }
                }
            }
        }
        return
    }

    val s = selectedSurvey!!

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { selectedSurvey = null }) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryAmber)
            }
            Text("DRAFTING WORKSPACE: ${s.customerId}", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // Survey details card
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("DOWNLOADED SITE SURVEY SUMMARY", style = Typography.labelSmall, color = EngineeringBlue, fontWeight = FontWeight.Bold)
                Text("Dimensions: ${s.lengthFt}ft x ${s.widthFt}ft (${s.roofType})", color = NeutralText)
                Text("Obstacle Notes: ${s.obstacleNotes.ifEmpty { "None recorded." }}", color = NeutralText)
                Text("Suggested Capacity: ${s.recommendedCapacityKw} kW", color = PrimaryAmber, fontWeight = FontWeight.Bold)
                Text("GPS Lat: ${s.coordinatesLatitude}, Lng: ${s.coordinatesLongitude}", color = MutedText, fontSize = 12.sp)
            }
        }

        // Technical specs intake form
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("ENTER SYSTEM DESIGN PARAMETERS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = tiltAngle,
                    onValueChange = { tiltAngle = it },
                    label = { Text("Structural Tilt Angle (Degrees)", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = panelBrandCount,
                    onValueChange = { panelBrandCount = it },
                    label = { Text("Panel Modules Count & Brand", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = inverterSizeKw,
                    onValueChange = { inverterSizeKw = it },
                    label = { Text("Inverter Recommended Size (kW)", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = wiringSpecs,
                    onValueChange = { wiringSpecs = it },
                    label = { Text("Cable / Wiring Specifications", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // CAD & SLD Upload Hub
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("UPLOAD STRUCTURAL & ELECTRICAL LAYOUTS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)

                // CAD Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                        Text("CAD Structural Drawing (.dwg/.pdf)", color = NeutralText, fontWeight = FontWeight.Bold)
                        Text(text = if (cadFileAttached != null) getFileName(cadFileAttached) else "No drawing attached", fontSize = 12.sp, color = MutedText)
                    }
                    Button(
                        onClick = { cadLauncher.launch("*/*") },
                        colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("ATTACH", fontSize = 11.sp)
                    }
                }

                Divider(color = BorderGray)

                // SLD Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                        Text("Single Line Diagram SLD (.pdf)", color = NeutralText, fontWeight = FontWeight.Bold)
                        Text(text = if (sldFileAttached != null) getFileName(sldFileAttached) else "No schematic attached", fontSize = 12.sp, color = MutedText)
                    }
                    Button(
                        onClick = { sldLauncher.launch("application/pdf") },
                        colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("ATTACH", fontSize = 11.sp)
                    }
                }
            }
        }

        // Status pipeline tracker
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("DESIGN REVIEW PIPELINE STATUS", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    PipelineStep("Survey", true)
                    PipelineStep("Drafting", true)
                    PipelineStep("SC Audit", false)
                    PipelineStep("Approved", false)
                }
            }
        }

        // Submit Layout Button
        Button(
            onClick = {
                val panels = panelBrandCount.split(" ").firstOrNull()?.toIntOrNull() ?: 12
                val capacity = inverterSizeKw.toDoubleOrNull() ?: s.recommendedCapacityKw
                val tilt = tiltAngle.toDoubleOrNull() ?: 15.0

                isUploading = true
                viewModel.submitDesign(
                    customerId = s.customerId,
                    panelCount = panels,
                    inverterModel = "Growatt 5000TL3-S",
                    systemCapacityKw = capacity,
                    tiltAngle = tilt,
                    cadLayoutPath = "/sdcard/Documents/" + (cadFileAttached ?: "layout.pdf"),
                    sldDiagramPath = "/sdcard/Documents/" + (sldFileAttached ?: "sld.pdf")
                )

                coroutineScope.launch {
                    delay(1200)
                    isUploading = false
                    uploadStatusMessage = "Draft design successfully submitted to Outbox Sync Queue!"
                    delay(800)
                    selectedSurvey = null
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = cadFileAttached != null && sldFileAttached != null && !isUploading
        ) {
            if (isUploading) {
                CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
            } else {
                Text("SUBMIT DESIGN BUNDLE", color = BackgroundDark, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun DesignSurveyListItem(survey: SiteSurveyEntity, onClick: () -> Unit) {
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
                    text = "Customer: ${survey.customerId}",
                    style = Typography.titleMedium,
                    color = NeutralText,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Rooftop: ${survey.lengthFt}ft x ${survey.widthFt}ft (${survey.roofType})", color = MutedText)
            }
            Icon(imageVector = Icons.Default.Draw, contentDescription = null, tint = PrimaryAmber)
        }
    }
}

@Composable
fun PipelineStep(name: String, active: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (active) SuccessGreen else BorderGray),
            contentAlignment = Alignment.Center
        ) {
            if (active) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = BackgroundDark, modifier = Modifier.size(14.dp))
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(name, fontSize = 10.sp, color = if (active) NeutralText else MutedText, fontWeight = FontWeight.Bold)
    }
}
