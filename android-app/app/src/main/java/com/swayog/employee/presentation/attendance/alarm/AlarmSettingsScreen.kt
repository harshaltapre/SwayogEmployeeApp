package com.swayog.employee.presentation.attendance.alarm

import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.compose.ui.platform.LocalLifecycleOwner
import com.swayog.employee.core.alarm.AttendanceAlarmManager
import com.swayog.employee.data.model.CompanyAlarmPolicy
import com.swayog.employee.data.model.EmployeeAlarm
import com.swayog.employee.presentation.attendance.AttendanceViewModel
import androidx.hilt.navigation.compose.hiltViewModel

private val DayLabels = listOf(
    1 to "Mon", 2 to "Tue", 3 to "Wed", 4 to "Thu",
    5 to "Fri", 6 to "Sat", 0 to "Sun"
)

private fun daySummary(days: List<Int>): String {
    val sorted = days.sorted()
    if (sorted.size == 7) return "Every day"
    if (sorted == listOf(1, 2, 3, 4, 5, 6)) return "Mon–Sat"
    if (sorted == listOf(1, 2, 3, 4, 5)) return "Weekdays"
    if (sorted == listOf(0, 6)) return "Weekends"
    return sorted.joinToString(" ") { d -> DayLabels.firstOrNull { it.first == d }?.second ?: "" }
        .replace("  ", " ").trim()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmSettingsScreen(
    onNavigateBack: () -> Unit,
    onAddAlarm: () -> Unit,
    onEditAlarm: (String) -> Unit,
    viewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val alarmManager = remember { AttendanceAlarmManager(context) }

    var alarms by remember { mutableStateOf(alarmManager.getAlarms()) }
    var policy by remember { mutableStateOf(alarmManager.getPolicy()) }
    var canScheduleExactAlarms by remember {
        mutableStateOf(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.canScheduleExactAlarms()
            } else true
        )
    }
    var notificationsEnabled by remember { mutableStateOf(alarmManager.areNotificationsEnabled()) }

    fun reload() {
        alarms = alarmManager.getAlarms()
        policy = alarmManager.getPolicy()
        canScheduleExactAlarms =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
        notificationsEnabled = alarmManager.areNotificationsEnabled()
    }

    // Reload whenever the screen resumes (e.g. returning from the edit screen).
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) reload()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val alarmResponse by viewModel.alarmSettings.collectAsState()
    LaunchedEffect(Unit) {
        viewModel.loadAlarmData()
    }
    LaunchedEffect(alarmResponse) {
        val resp = alarmResponse ?: return@LaunchedEffect
        if (resp.policy != null) {
            policy = resp.policy!!
            alarmManager.savePolicy(resp.policy!!)
            // Re-arm company reminders immediately when the admin policy changes.
            alarmManager.rescheduleFromPreferences()
        }
        if (resp.alarms.isNotEmpty()) {
            // Backend is authoritative for the alarm list when present.
            alarms = resp.alarms
        }
        reload()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Attendance Alarms", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onAddAlarm) {
                        Icon(Icons.Default.Add, contentDescription = "Add alarm")
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
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // ── Company attendance info (compact, read-only) ────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        Icons.Default.Business,
                        contentDescription = null,
                        tint = Color(0xFF93C5FD),
                        modifier = Modifier.size(22.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            "Office reporting ${AttendanceAlarmManager.formatAmPm(policy.reportingTime)} IST",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            "${policy.timezone} • Working days ${daySummary(policy.workingDays)}" +
                                (policy.policyNote?.let { " • $it" } ?: ""),
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            // ── Permission banners ──────────────────────────────────────────
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExactAlarms) {
                PermissionBanner(
                    title = "Exact alarm permission needed",
                    message = "Android requires this for precise alarm delivery. Without it, alarms may be delayed.",
                    actionLabel = "Open Settings",
                    onAction = {
                        context.startActivity(
                            Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                                data = android.net.Uri.parse("package:" + context.packageName)
                            }
                        )
                    }
                )
            }
            if (!notificationsEnabled) {
                PermissionBanner(
                    title = "Notifications are off",
                    message = "Alarms will still ring, but reminder notifications may not appear.",
                    actionLabel = "Open Settings",
                    onAction = {
                        context.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                            putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                        })
                    }
                )
            }

            // ── Company reminders (admin-controlled) ─────────────────────────
            Text(
                "COMPANY REMINDERS",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(top = 4.dp)
            )

            CompanyReminderRow(
                label = "Attendance Preparation",
                time = AttendanceAlarmManager.formatAmPm(policy.prepReminderTime),
                enabled = policy.prepReminderEnabled
            )
            CompanyReminderRow(
                label = "Final Reporting Reminder",
                time = AttendanceAlarmManager.formatAmPm(policy.finalReminderTime),
                enabled = policy.finalReminderEnabled
            )

            // ── Personal alarms ──────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "MY ALARMS",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                TextButton(onClick = onAddAlarm, enabled = alarms.size < AttendanceAlarmManager.MAX_ALARMS) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add", fontSize = 13.sp)
                }
            }

            if (alarms.isEmpty()) {
                Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(20.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("No personal alarms", fontWeight = FontWeight.SemiBold)
                        Text(
                            "Tap + to add your first alarm.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                alarms.forEach { alarm ->
                    AlarmRow(
                        alarm = alarm,
                        onToggle = { enabled ->
                            val ok = alarmManager.setAlarmEnabled(alarm.id, enabled)
                            if (ok) {
                                alarms = alarmManager.getAlarms()
                                viewModel.syncAlarms(alarms)
                            } else {
                                Toast.makeText(
                                    context,
                                    "Could not schedule alarm — check exact alarm permission",
                                    Toast.LENGTH_LONG
                                ).show()
                                reload()
                            }
                        },
                        onClick = { onEditAlarm(alarm.id) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PermissionBanner(
    title: String,
    message: String,
    actionLabel: String,
    onAction: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED)),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFEA580C), modifier = Modifier.size(18.dp))
                Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF9A3412))
            }
            Text(message, fontSize = 12.sp, color = Color(0xFFC2410C), modifier = Modifier.padding(top = 4.dp))
            TextButton(onClick = onAction, modifier = Modifier.padding(top = 2.dp)) {
                Text(actionLabel, color = Color(0xFFEA580C), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun CompanyReminderRow(label: String, time: String, enabled: Boolean) {
    Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "$time • Set by company admin",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    if (enabled) "ON" else "OFF",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (enabled) Color(0xFF16A34A) else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Switch(checked = enabled, onCheckedChange = null, enabled = false)
            }
        }
    }
}

@Composable
private fun AlarmRow(
    alarm: EmployeeAlarm,
    onToggle: (Boolean) -> Unit,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    AttendanceAlarmManager.formatAmPm(alarm.time),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (alarm.enabled) MaterialTheme.colorScheme.onSurface
                    else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    alarm.label.ifBlank { "Alarm" },
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    daySummary(alarm.repeatDays) +
                        (alarm.soundName?.let { " • $it" } ?: ""),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Switch(checked = alarm.enabled, onCheckedChange = onToggle)
        }
    }
}
