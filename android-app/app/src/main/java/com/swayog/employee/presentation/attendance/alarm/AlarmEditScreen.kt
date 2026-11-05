package com.swayog.employee.presentation.attendance.alarm

import android.app.TimePickerDialog
import android.content.Intent
import android.media.RingtoneManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import com.swayog.employee.core.alarm.AlarmSoundPlayer
import com.swayog.employee.core.alarm.AttendanceAlarmManager
import com.swayog.employee.data.model.CompanyRingtone
import com.swayog.employee.data.model.EmployeeAlarm
import com.swayog.employee.presentation.attendance.AttendanceViewModel
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch

private val EditDayLabels = listOf(
    1 to "Mon", 2 to "Tue", 3 to "Wed", 4 to "Thu",
    5 to "Fri", 6 to "Sat", 0 to "Sun"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmEditScreen(
    alarmId: String?,
    onNavigateBack: () -> Unit,
    onDeleted: () -> Unit,
    viewModel: AttendanceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val alarmManager = remember { AttendanceAlarmManager(context) }
    val scope = rememberCoroutineScope()

    val existing = remember(alarmId) {
        alarmId?.let { id -> alarmManager.getAlarms().firstOrNull { it.id == id } }
    }
    val isNew = existing == null

    var time by remember { mutableStateOf(existing?.time ?: "09:30") }
    var label by remember { mutableStateOf(existing?.label ?: "") }
    var selectedDays by remember { mutableStateOf(existing?.repeatDays?.toSet() ?: AttendanceAlarmManager.DEFAULT_REPEAT_DAYS.toSet()) }
    var soundType by remember { mutableStateOf(existing?.soundType ?: EmployeeAlarm.SoundType.BUILTIN) }
    var soundUri by remember { mutableStateOf<String?>(existing?.soundUri ?: "alarm_classic") }
    var soundName by remember { mutableStateOf<String?>(existing?.soundName ?: "Classic Alarm") }
    var vibrationEnabled by remember { mutableStateOf(existing?.vibrationEnabled ?: true) }
    var snoozeEnabled by remember { mutableStateOf(existing?.snoozeEnabled ?: true) }
    var snoozeMinutes by remember { mutableStateOf(existing?.snoozeMinutes ?: AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES) }
    var snoozeCount by remember { mutableStateOf(existing?.snoozeCount ?: AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var previewPlayer by remember { mutableStateOf<android.media.MediaPlayer?>(null) }

    val companyRingtones by viewModel.companyRingtones.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadAlarmData() }

    fun currentSpec(): AlarmSoundPlayer.SoundSpec = when (soundType) {
        EmployeeAlarm.SoundType.DEVICE -> AlarmSoundPlayer.SoundSpec(soundType, soundUri, soundName)
        EmployeeAlarm.SoundType.COMPANY -> AlarmSoundPlayer.SoundSpec(soundType, soundUri, soundName)
        else -> AlarmSoundPlayer.SoundSpec.builtin(soundUri ?: "alarm_classic", soundName)
    }

    fun previewSound() {
        scope.launch {
            previewPlayer?.release()
            previewPlayer = AlarmSoundPlayer.preparePreviewPlayer(context, currentSpec())
            previewPlayer?.setOnCompletionListener { it.release(); previewPlayer = null }
            runCatching { previewPlayer?.start() }
                .onFailure {
                    Toast.makeText(context, "Could not play this sound", Toast.LENGTH_SHORT).show()
                }
        }
    }

    DisposableEffect(Unit) {
        onDispose { previewPlayer?.release() }
    }

    // Device ringtone picker
    val ringtonePicker = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val uri = result.data?.getParcelableExtra<android.net.Uri>(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
        if (uri != null) {
            soundType = EmployeeAlarm.SoundType.DEVICE
            soundUri = uri.toString()
            val title = runCatching {
                context.contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)
                    ?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
            }.getOrNull()
            soundName = title ?: "Device ringtone"
        }
    }

    fun pickDeviceRingtone() {
        val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
            putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
            putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Select alarm sound")
            putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, soundUri?.let { android.net.Uri.parse(it) })
        }
        ringtonePicker.launch(intent)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isNew) "Add alarm" else "Edit alarm", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (!isNew) {
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFDC2626))
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // ── Time picker ──────────────────────────────────────────────────
            Card(shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("ALARM TIME", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 1.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        AttendanceAlarmManager.formatAmPm(time),
                        fontSize = 44.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    OutlinedButton(
                        onClick = {
                            val parts = time.split(":").mapNotNull { it.toIntOrNull() }
                            TimePickerDialog(
                                context,
                                { _, h, m -> time = String.format("%02d:%02d", h, m) },
                                parts.getOrElse(0) { 9 },
                                parts.getOrElse(1) { 30 },
                                false
                            ).show()
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                        Text("Change time")
                    }
                }
            }

            // ── Label ───────────────────────────────────────────────────────
            OutlinedTextField(
                value = label,
                onValueChange = { label = it.take(40) },
                label = { Text("Alarm name") },
                placeholder = { Text("e.g. Morning Alarm") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )

            // ── Repeat days ─────────────────────────────────────────────────
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Repeat", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        EditDayLabels.forEach { (dayNum, dayLabel) ->
                            val selected = selectedDays.contains(dayNum)
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (selected) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.surfaceVariant
                                    )
                                    .clickable {
                                        selectedDays = if (selected) selectedDays - dayNum else selectedDays + dayNum
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    dayLabel,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // ── Sound ───────────────────────────────────────────────────────
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Sound", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = ::previewSound, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Preview", tint = MaterialTheme.colorScheme.primary)
                            }
                            Text(soundName ?: "None", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                        }
                    }

                    SoundSourceChip(
                        label = "Device sound",
                        selected = soundType == EmployeeAlarm.SoundType.DEVICE,
                        subtitle = if (soundType == EmployeeAlarm.SoundType.DEVICE) soundName else null,
                        onClick = ::pickDeviceRingtone
                    )

                    AlarmSoundPlayer.BUILTIN_SOUNDS.forEach { spec ->
                        SoundSourceChip(
                            label = spec.soundName ?: spec.soundUri ?: "Sound",
                            selected = soundType == EmployeeAlarm.SoundType.BUILTIN && soundUri == spec.soundUri,
                            onClick = {
                                soundType = EmployeeAlarm.SoundType.BUILTIN
                                soundUri = spec.soundUri
                                soundName = spec.soundName
                            }
                        )
                    }

                    if (companyRingtones.isNotEmpty()) {
                        Text(
                            "COMPANY SOUNDS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        companyRingtones.forEach { ringtone ->
                            SoundSourceChip(
                                label = ringtone.name,
                                selected = soundType == EmployeeAlarm.SoundType.COMPANY && soundUri == (ringtone.url ?: ringtone.objectKey),
                                onClick = {
                                    soundType = EmployeeAlarm.SoundType.COMPANY
                                    soundUri = ringtone.url ?: ringtone.objectKey
                                    soundName = ringtone.name
                                }
                            )
                        }
                    }
                }
            }

            // ── Vibration ───────────────────────────────────────────────────
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Icon(Icons.Default.Vibration, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text("Vibration", fontWeight = FontWeight.SemiBold)
                    }
                    Switch(checked = vibrationEnabled, onCheckedChange = { vibrationEnabled = it })
                }
            }

            // ── Snooze ──────────────────────────────────────────────────────
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(Icons.Default.Snooze, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("Snooze", fontWeight = FontWeight.SemiBold)
                        }
                        Switch(checked = snoozeEnabled, onCheckedChange = { snoozeEnabled = it })
                    }
                    if (snoozeEnabled) {
                        Text("Duration", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf(1, 3, 5, 10, 15).forEach { m ->
                                FilterChip(
                                    selected = snoozeMinutes == m,
                                    onClick = { snoozeMinutes = m },
                                    label = { Text("${m}m") }
                                )
                            }
                        }
                        Text("Max snoozes", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf(1, 2, 3, 5).forEach { c ->
                                FilterChip(
                                    selected = snoozeCount == c,
                                    onClick = { snoozeCount = c },
                                    label = { Text("$c") }
                                )
                            }
                        }
                    }
                }
            }

            // ── Actions ─────────────────────────────────────────────────────
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = onNavigateBack,
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(12.dp)
                ) { Text("Cancel") }
                Button(
                    onClick = {
                        if (AttendanceAlarmManager.normalizeTime(time) == null) {
                            Toast.makeText(context, "Pick a valid time", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (selectedDays.isEmpty()) {
                            Toast.makeText(context, "Select at least one day", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        val alarm = EmployeeAlarm(
                            id = existing?.id ?: java.util.UUID.randomUUID().toString(),
                            time = time,
                            label = label.ifBlank { "Alarm" },
                            repeatDays = selectedDays.sorted(),
                            enabled = existing?.enabled ?: true,
                            soundType = soundType,
                            soundUri = soundUri,
                            soundName = soundName,
                            vibrationEnabled = vibrationEnabled,
                            snoozeEnabled = snoozeEnabled,
                            snoozeMinutes = snoozeMinutes,
                            snoozeCount = snoozeCount,
                            requestCode = existing?.requestCode ?: 0
                        )
                        val ok = alarmManager.upsertAlarm(alarm)
                        if (ok) {
                            viewModel.syncAlarms(alarmManager.getAlarms())
                            Toast.makeText(context, "Alarm saved", Toast.LENGTH_SHORT).show()
                            onNavigateBack()
                        } else {
                            Toast.makeText(
                                context,
                                "Could not schedule — enable exact alarm permission in Settings",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    },
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) { Text("Save", fontWeight = FontWeight.Bold) }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete alarm?") },
            text = { Text("\"${label.ifBlank { "Alarm" }}\" at ${AttendanceAlarmManager.formatAmPm(time)} will be removed.") },
            confirmButton = {
                TextButton(onClick = {
                    showDeleteConfirm = false
                    existing?.let {
                        alarmManager.deleteAlarm(it.id)
                        viewModel.syncAlarms(alarmManager.getAlarms())
                    }
                    onDeleted()
                }) { Text("Delete", color = Color(0xFFDC2626)) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun SoundSourceChip(
    label: String,
    selected: Boolean,
    subtitle: String? = null,
    onClick: () -> Unit
) {
    val borderColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .border(1.dp, borderColor, RoundedCornerShape(10.dp))
            .background(if (selected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            if (subtitle != null) {
                Text(subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            }
        }
        if (selected) {
            Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
        }
    }
}
