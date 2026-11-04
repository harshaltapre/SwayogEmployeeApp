package com.swayog.employee.presentation.attendance.alarm

import android.app.TimePickerDialog
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.core.alarm.AttendanceAlarmManager
import com.swayog.employee.data.model.EmployeeAlarmSetting
import com.swayog.employee.presentation.attendance.AttendanceViewModel
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmSettingsScreen(
    onNavigateBack: () -> Unit,
    viewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val alarmManager = remember { AttendanceAlarmManager(context) }
    val initialLocal = remember { alarmManager.getLocalSettings() }

    var enabled by remember { mutableStateOf(initialLocal.enabled) }
    var personalTime by remember { mutableStateOf(initialLocal.personalAlarmTime) }
    var reminder1Time by remember { mutableStateOf(initialLocal.reminder1Time ?: "10:00") }
    var reminder2Time by remember { mutableStateOf(initialLocal.reminder2Time ?: "10:15") }
    var reminder1Enabled by remember { mutableStateOf(!initialLocal.reminder1Time.isNullOrBlank()) }
    var reminder2Enabled by remember { mutableStateOf(!initialLocal.reminder2Time.isNullOrBlank()) }
    var selectedDays by remember { mutableStateOf(initialLocal.repeatDays.toSet()) }
    var vibrationEnabled by remember { mutableStateOf(initialLocal.vibrationEnabled) }
    var snoozeEnabled by remember { mutableStateOf(initialLocal.snoozeEnabled) }
    var isSaving by remember { mutableStateOf(false) }

    val daysOfWeek = listOf(
        1 to "Mon",
        2 to "Tue",
        3 to "Wed",
        4 to "Thu",
        5 to "Fri",
        6 to "Sat"
    )

    fun showTimePicker(currentTime: String, onTimeSelected: (String) -> Unit) {
        val parts = currentTime.split(":").mapNotNull { it.toIntOrNull() }
        val hour = if (parts.size == 2) parts[0] else 9
        val minute = if (parts.size == 2) parts[1] else 30

        TimePickerDialog(context, { _, h, m ->
            val formatted = String.format("%02d:%02d", h, m)
            onTimeSelected(formatted)
        }, hour, minute, false).show()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Smart Attendance Alarms", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── Official Company Reporting Time (Read Only) ─────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp))
                        Text(
                            "OFFICIAL COMPANY REPORTING TIME",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "10:30 AM IST",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Timezone: Asia/Kolkata • Managed by Company Administrator",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )
                }
            }

            // ── Monthly Late Policy Banner ───────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(20.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            "Company Late Arrival Allowance Policy",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color(0xFF1E3A8A)
                        )
                        Text(
                            "• First 3 late arrivals per month are classified as Present.\n• 4th and subsequent late arrivals are classified as Half-Day.\n• Sundays are Weekly Off and do not consume allowances.",
                            fontSize = 12.sp,
                            color = Color(0xFF1E40AF),
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // ── Master Switch ───────────────────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Enable Alarms & Reminders", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        Text("Receive smart alerts before 10:30 AM reporting cutoff", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = enabled,
                        onCheckedChange = { enabled = it }
                    )
                }
            }

            if (enabled) {
                // ── 1. Personal Alarm ───────────────────────────────────────
                Card(shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Alarm, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("1. Personal Morning Alarm", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                        Text("Wake up and prepare for the workday", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        OutlinedCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showTimePicker(personalTime) { personalTime = it } },
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(personalTime, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                Text("Change Time", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
                            }
                        }
                    }
                }

                // ── 2. Preparation Reminder ──────────────────────────────────
                Card(shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = Color(0xFF0284C7))
                                Text("2. Attendance Preparation", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                            Switch(checked = reminder1Enabled, onCheckedChange = { reminder1Enabled = it })
                        }
                        Text("30-minute advance notice to start commute or reach office", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        if (reminder1Enabled) {
                            OutlinedCard(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { showTimePicker(reminder1Time) { reminder1Time = it } },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(reminder1Time, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                    Text("Change Time", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }

                // ── 3. Final Reminder ────────────────────────────────────────
                Card(shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFDC2626))
                                Text("3. Final Call Reminder", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                            Switch(checked = reminder2Enabled, onCheckedChange = { reminder2Enabled = it })
                        }
                        Text("15-minute final notice before the 10:30 AM cutoff", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        if (reminder2Enabled) {
                            OutlinedCard(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { showTimePicker(reminder2Time) { reminder2Time = it } },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(reminder2Time, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                    Text("Change Time", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }

                // ── Repeat Days ──────────────────────────────────────────────
                Card(shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Repeat Working Days", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Sunday is weekly off and excluded automatically", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            daysOfWeek.forEach { (dayNum, label) ->
                                val isSelected = selectedDays.contains(dayNum)
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant)
                                        .clickable {
                                            selectedDays = if (isSelected) {
                                                if (selectedDays.size > 1) selectedDays - dayNum else selectedDays
                                            } else {
                                                selectedDays + dayNum
                                            }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        label,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                // ── Sound & Vibration ────────────────────────────────────────
                Card(shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Vibration, contentDescription = null)
                                Text("Vibrate with Reminders", fontSize = 14.sp)
                            }
                            Switch(checked = vibrationEnabled, onCheckedChange = { vibrationEnabled = it })
                        }
                        Divider()
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Snooze, contentDescription = null)
                                Text("Allow Snooze (5 Minutes)", fontSize = 14.sp)
                            }
                            Switch(checked = snoozeEnabled, onCheckedChange = { snoozeEnabled = it })
                        }
                    }
                }
            }

            // ── Save & Test Buttons ──────────────────────────────────────────
            Button(
                onClick = {
                    isSaving = true
                    val setting = EmployeeAlarmSetting(
                        personalAlarmTime = personalTime,
                        reminder1Time = if (reminder1Enabled) reminder1Time else null,
                        reminder2Time = if (reminder2Enabled) reminder2Time else null,
                        repeatDays = selectedDays.toList().sorted(),
                        vibrationEnabled = vibrationEnabled,
                        snoozeEnabled = snoozeEnabled,
                        enabled = enabled
                    )

                    // 1. Schedule native Android Alarm
                    val scheduled = alarmManager.saveAndScheduleAlarms(setting)

                    // 2. Sync to Backend
                    viewModel.saveAlarmSettings(setting) { success ->
                        isSaving = false
                        if (scheduled) {
                            Toast.makeText(context, "Attendance alarms saved and scheduled successfully!", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "Alarm saved, but exact alarm permission may be needed in Android Settings.", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Save, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save & Apply Alarms", fontWeight = FontWeight.Bold)
                }
            }

            OutlinedButton(
                onClick = {
                    // Test notification trigger
                    val testIntent = android.content.Intent(context, com.swayog.employee.core.alarm.AttendanceAlarmReceiver::class.java).apply {
                        action = AttendanceAlarmManager.ACTION_ATTENDANCE_ALARM
                        putExtra(AttendanceAlarmManager.EXTRA_ALARM_TYPE, "PERSONAL")
                        putExtra(AttendanceAlarmManager.EXTRA_ALARM_LABEL, "Test Attendance Alarm Notification")
                    }
                    context.sendBroadcast(testIntent)
                    Toast.makeText(context, "Test notification dispatched!", Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Notifications, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Test Alarm Notification")
            }
        }
    }
}

