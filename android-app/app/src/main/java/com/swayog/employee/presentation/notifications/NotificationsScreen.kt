package com.swayog.employee.presentation.notifications

import android.app.TimePickerDialog
import android.media.RingtoneManager
import android.widget.Toast
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.core.alarm.AttendanceAlarmManager
import com.swayog.employee.data.model.EmployeeAlarmSetting
import com.swayog.employee.data.model.Notification
import com.swayog.employee.presentation.attendance.AttendanceViewModel
import com.swayog.employee.presentation.common.components.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onNavigateBack: () -> Unit,
    viewModel: NotificationsViewModel = hiltViewModel(),
    attendanceViewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val alarmManager = remember { AttendanceAlarmManager(context) }
    val initialLocal = remember { alarmManager.getLocalSettings() }

    val notificationsState by viewModel.notificationsState.collectAsState()
    val notifications by viewModel.notifications.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()

    // Alarm state
    var alarmEnabled by remember { mutableStateOf(initialLocal.enabled) }
    var alarmTime by remember { mutableStateOf(initialLocal.personalAlarmTime) }
    var alarmSound by remember { mutableStateOf("Default") }
    var showAlarmSettings by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }

    LaunchedEffect(notificationsState) {
        if (notificationsState is NotificationsState.Error) {
            // Could show error toast here
        }
    }

    // Time picker callback
    if (showTimePicker) {
        val parts = alarmTime.split(":").mapNotNull { it.toIntOrNull() }
        val hour = if (parts.size == 2) parts[0] else 9
        val minute = if (parts.size == 2) parts[1] else 30

        TimePickerDialog(context, { _, h, m ->
            alarmTime = String.format("%02d:%02d", h, m)
            showTimePicker = false
        }, hour, minute, false).show()
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Notifications & Alarms",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    if (unreadCount > 0) {
                        IconButton(onClick = { viewModel.markAllAsRead() }) {
                            Icon(Icons.Default.MarkEmailRead, contentDescription = "Mark all as read")
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            // Alarm Section
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Alarm, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "Company Alarm",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Switch(
                            checked = alarmEnabled,
                            onCheckedChange = { enabled ->
                                alarmEnabled = enabled
                                if (!enabled) {
                                    // Disable alarm
                                    val setting = EmployeeAlarmSetting(
                                        personalAlarmTime = alarmTime,
                                        reminder1Time = null,
                                        reminder2Time = null,
                                        repeatDays = listOf(1, 2, 3, 4, 5, 6),
                                        vibrationEnabled = true,
                                        snoozeEnabled = true,
                                        enabled = false
                                    )
                                    alarmManager.saveAndScheduleAlarms(setting)
                                    Toast.makeText(context, "Alarm disabled", Toast.LENGTH_SHORT).show()
                                }
                            }
                        )
                    }

                    if (alarmEnabled) {
                        Divider()
                        
                        // Time selection
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showTimePicker = true }
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Alarm Time",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = alarmTime,
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Icon(Icons.Default.AccessTime, contentDescription = "Change time")
                        }

                        Divider()

                        // Sound selection
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showAlarmSettings = true }
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Alarm Sound",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = alarmSound,
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Icon(Icons.Default.MusicNote, contentDescription = "Change sound")
                        }

                        Divider()

                        // Save button
                        Button(
                            onClick = {
                                val setting = EmployeeAlarmSetting(
                                    personalAlarmTime = alarmTime,
                                    reminder1Time = null,
                                    reminder2Time = null,
                                    repeatDays = listOf(1, 2, 3, 4, 5, 6),
                                    vibrationEnabled = true,
                                    snoozeEnabled = true,
                                    enabled = true
                                )
                                val scheduled = alarmManager.saveAndScheduleAlarms(setting)
                                attendanceViewModel.saveAlarmSettings(setting) { success ->
                                    if (scheduled) {
                                        Toast.makeText(context, "Alarm scheduled for $alarmTime", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Alarm saved. Enable exact alarm permission in Settings for precise timing.", Toast.LENGTH_LONG).show()
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Save Alarm")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Unread count badge
            if (unreadCount > 0) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFD1603D).copy(alpha = 0.1f))
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Notifications,
                            contentDescription = null,
                            tint = Color(0xFFD1603D)
                        )
                        Text(
                            text = "$unreadCount unread notification${if (unreadCount > 1) "s" else ""}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFD1603D)
                        )
                    }
                }
            }

            if (notifications.isEmpty() && notificationsState !is NotificationsState.Loading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No notifications",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    notifications.forEach { notification ->
                        NotificationCard(
                            notification = notification,
                            onClick = {
                                if (!notification.isRead) {
                                    viewModel.markAsRead(notification.id)
                                }
                            }
                        )
                    }
                }
            }

            if (notificationsState is NotificationsState.Loading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
    }

    // Sound selection dialog
    if (showAlarmSettings) {
        AlertDialog(
            onDismissRequest = { showAlarmSettings = false },
            title = { Text("Select Alarm Sound") },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Default", "Morning Bell", "Chime", "Gentle Wake", "Alarm Clock").forEach { sound ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    alarmSound = sound
                                    showAlarmSettings = false
                                }
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(sound)
                            if (alarmSound == sound) {
                                Icon(Icons.Default.Check, contentDescription = "Selected", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showAlarmSettings = false }) {
                    Text("Close")
                }
            }
        )
    }
}

@Composable
fun NotificationCard(
    notification: Notification,
    onClick: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("MMM dd, yyyy 'at' hh:mm a", Locale.getDefault()) }
    val formattedDate = try {
        dateFormat.format(Date(notification.createdAt))
    } catch (e: Exception) {
        notification.createdAt
    }

    val backgroundColor = if (notification.isRead) {
        MaterialTheme.colorScheme.surface
    } else {
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (!notification.isRead) {
                        Surface(
                            color = Color(0xFFD1603D),
                            modifier = Modifier.size(8.dp),
                            shape = MaterialTheme.shapes.small
                        ) {}
                    }
                    Text(
                        text = notification.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = if (notification.isRead) FontWeight.Normal else FontWeight.Bold
                    )
                }
                if (notification.isRead) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Read",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Text(
                text = notification.message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
            )

            notification.type?.let { type ->
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = type.replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }

            Text(
                text = formattedDate,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
        }
    }
}
