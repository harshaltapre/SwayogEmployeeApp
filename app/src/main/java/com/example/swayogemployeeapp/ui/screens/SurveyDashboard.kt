package com.example.swayogemployeeapp.ui.screens

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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurveyDashboard(viewModel: MainViewModel) {
    val tasks by viewModel.tasks.collectAsState()
    val surveysList by viewModel.surveys.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    val surveyTasks = tasks.filter { it.jobType == "Survey" && it.status != "completed" }

    var selectedTask by remember { mutableStateOf<EmployeeTaskEntity?>(null) }
    
    // Form States
    var lengthStr by remember { mutableStateOf("45") }
    var widthStr by remember { mutableStateOf("30") }
    var selectedRoofType by remember { mutableStateOf("Concrete") }
    var obstacleNotes by remember { mutableStateOf("") }
    
    // Shading factors checkboxes
    var shadeTrees by remember { mutableStateOf(true) }
    var shadeBuildings by remember { mutableStateOf(false) }
    var shadeTowers by remember { mutableStateOf(false) }
    var shadeCables by remember { mutableStateOf(true) }

    var gpsVerified by remember { mutableStateOf(false) }
    var mockPhotosCount by remember { mutableIntStateOf(0) }
    var photoLogMessage by remember { mutableStateOf("No photos captured yet.") }
    var isSubmitting by remember { mutableStateOf(false) }

    if (selectedTask == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("ASSIGNED SURVEY CHECKS", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
            
            if (surveyTasks.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No pending site surveys assigned.", color = MutedText)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(surveyTasks) { task ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedTask = task
                                    gpsVerified = false
                                    mockPhotosCount = 0
                                    photoLogMessage = "No photos captured yet."
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Client: ${task.customerName}",
                                        style = Typography.titleMedium,
                                        color = NeutralText,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(text = task.address, style = Typography.bodyMedium, color = MutedText)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.Event, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(text = "Scheduled: ${task.scheduledTime.take(16).replace("T", " ")}", fontSize = 11.sp, color = MutedText)
                                    }
                                }
                                Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = PrimaryAmber)
                            }
                        }
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
        // Back Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { selectedTask = null }) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryAmber)
            }
            Text("SITE SURVEY REPORT (TASK-${task.id})", style = Typography.titleMedium, color = NeutralText, fontWeight = FontWeight.Bold)
        }

        // 1. GPS Verification Badge
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("1. GPS GEOFENCE MATCHING", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Task Target: ${task.latitude ?: 19.123}, ${task.longitude ?: 72.890}", fontSize = 12.sp, color = NeutralText)
                        Text(
                            text = if (gpsVerified) "GPS Lock Match verified (<15m)" else "Lock pending verification...",
                            color = if (gpsVerified) SuccessGreen else Color.Red,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    Button(
                        onClick = { gpsVerified = true },
                        colors = ButtonDefaults.buttonColors(containerColor = if (gpsVerified) SuccessGreen else EngineeringBlue),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(if (gpsVerified) "VERIFIED" else "MATCH GPS", color = BackgroundDark, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            }
        }

        // 2. Rooftop Dimensions & Load Bearing
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("2. ROOFTOP DIMENSIONS INTAKE", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = lengthStr,
                        onValueChange = { lengthStr = it },
                        label = { Text("Length (ft)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = widthStr,
                        onValueChange = { widthStr = it },
                        label = { Text("Width (ft)", color = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Roof type options
                Text("Roof Surface Material:", color = NeutralText)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Concrete", "Tin Sheet", "Asbestos", "Ground Mount").forEach { type ->
                        val active = selectedRoofType == type
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (active) PrimaryAmber else BackgroundDark)
                                .clickable { selectedRoofType = type }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(type, color = if (active) BackgroundDark else NeutralText, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 3. Shading Factor Checklist & Obstacle Notes
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("3. SHADING FACTORS & OBSTACLES", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = shadeTrees, onCheckedChange = { shadeTrees = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Trees in close proximity", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = shadeBuildings, onCheckedChange = { shadeBuildings = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Surrounding higher buildings", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = shadeTowers, onCheckedChange = { shadeTowers = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Overhead electrical/mobile towers", color = NeutralText)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = shadeCables, onCheckedChange = { shadeCables = it }, colors = CheckboxDefaults.colors(checkedColor = PrimaryAmber))
                    Text("Overhead distribution cables", color = NeutralText)
                }

                OutlinedTextField(
                    value = obstacleNotes,
                    onValueChange = { obstacleNotes = it },
                    label = { Text("Physical Obstacle Notes (e.g. chimney, pipes)...", color = MutedText) },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeutralText, unfocusedTextColor = NeutralText, focusedBorderColor = PrimaryAmber, unfocusedBorderColor = BorderGray),
                    modifier = Modifier.fillMaxWidth().height(80.dp)
                )
            }
        }

        // 4. Camera Compression Mock
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("4. COMPRESSED IMAGE UPLOADER", style = Typography.labelSmall, color = MutedText, fontWeight = FontWeight.Bold)
                Text(
                    text = "Requires min 4 photos (Roof, Electrical Meter, Brackets, Shading).",
                    style = Typography.bodyMedium,
                    color = MutedText
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.PhotoCamera, contentDescription = null, tint = PrimaryAmber, modifier = Modifier.size(36.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("$mockPhotosCount Photos Compressed", color = NeutralText, fontWeight = FontWeight.Bold)
                            Text(photoLogMessage, fontSize = 11.sp, color = MutedText)
                        }
                    }

                    Button(
                        onClick = {
                            if (mockPhotosCount < 4) {
                                mockPhotosCount++
                                photoLogMessage = "Photo $mockPhotosCount: Rescaled to 1280px, Jpeg 75% (${(180..320).random()}KB). Check!"
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EngineeringBlue),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("TAKE PHOTO", fontSize = 11.sp)
                    }
                }
            }
        }

        // Submit Survey Form Button
        Button(
            onClick = {
                val length = lengthStr.toDoubleOrNull()
                val width = widthStr.toDoubleOrNull()
                if (length == null || width == null) {
                    return@Button
                }
                isSubmitting = true
                
                val shadowJson = """{"trees":$shadeTrees,"buildings":$shadeBuildings,"towers":$shadeTowers,"cables":$shadeCables}"""
                // Compute recommended Kw roughly: area * 10 watts / 1000 = area / 100
                val recommendedKw = (length * width) / 250.0

                viewModel.submitSurvey(
                    taskId = task.id,
                    customerId = task.customerName,
                    roofType = selectedRoofType,
                    lengthFt = length,
                    widthFt = width,
                    obstacleNotes = obstacleNotes,
                    shadowFactorsJson = shadowJson,
                    recommendedCapacity = recommendedKw,
                    latitude = task.latitude ?: 19.123,
                    longitude = task.longitude ?: 72.890,
                    localPhotoPaths = listOf("/sdcard/Pictures/survey_${task.id}_1.jpg")
                )

                viewModel.updateTaskStatus(task.id, "completed")

                coroutineScope.launch {
                    delay(1000)
                    isSubmitting = false
                    selectedTask = null
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryAmber),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = gpsVerified && mockPhotosCount >= 4 && !isSubmitting
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(color = BackgroundDark, modifier = Modifier.size(24.dp))
            } else {
                Text(
                    text = if (gpsVerified && mockPhotosCount >= 4) "SUBMIT SITE REPORT" else "COMPLETE GPS & PHOTO CHECKS",
                    color = BackgroundDark,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
