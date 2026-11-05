package com.swayog.employee.core.alarm

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Snooze
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.ui.theme.Primary

/**
 * Full-screen alarm UI launched by the ringing service's full-screen intent.
 * Stop dismisses the alarm; Snooze re-arms a one-shot without touching the
 * repeating schedule.
 */
class AlarmRingingActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val label = intent.getStringExtra(AlarmRingingService.EXTRA_LABEL) ?: "Attendance Alarm"
        val time = intent.getStringExtra(AlarmRingingService.EXTRA_TIME) ?: ""
        val snoozeMinutes = intent?.getIntExtra(
            AlarmRingingService.EXTRA_SNOOZE_MINUTES,
            AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES
        ) ?: AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES
        val snoozeRemaining = intent?.getIntExtra(
            AttendanceAlarmManager.EXTRA_SNOOZE_REMAINING,
            AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT
        ) ?: AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT

        setContent {
            AlarmRingingContent(
                label = label,
                time = time,
                snoozeMinutes = snoozeMinutes,
                canSnooze = snoozeRemaining > 0,
                onDismiss = {
                    AlarmRingingService.stop(this)
                    finish()
                },
                onSnooze = {
                    AlarmRingingService.snooze(this)
                    finish()
                }
            )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // A second alarm ringing while this screen is open: just refresh is
        // unnecessary — the service owns playback; keep the existing UI.
    }
}

@Composable
private fun AlarmRingingContent(
    label: String,
    time: String,
    snoozeMinutes: Int,
    canSnooze: Boolean,
    onDismiss: () -> Unit,
    onSnooze: () -> Unit
) {
    Scaffold(containerColor = Color(0xFF0F172A)) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.Alarm,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(72.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            if (time.isNotBlank()) {
                Text(
                    time,
                    color = Color.White,
                    fontSize = 56.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Text(
                label,
                color = Color(0xFF94A3B8),
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                "Attendance Alarm — Swayog",
                color = Color(0xFF64748B),
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(48.dp))

            Button(
                onClick = onDismiss,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
            ) {
                Text("Dismiss", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }

            if (canSnooze) {
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedButton(
                    onClick = onSnooze,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Snooze, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Snooze $snoozeMinutes min", fontSize = 17.sp)
                }
            }
        }
    }
}
