package com.swayog.employee.core.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.google.gson.Gson
import com.swayog.employee.data.model.EmployeeAlarm
import com.swayog.employee.presentation.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Foreground service that owns alarm playback: looping sound + vibration until the
 * employee dismisses or snoozes. Launched by [AttendanceAlarmReceiver] via a
 * full-screen intent notification.
 */
class AlarmRingingService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var player: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var alarmJson: String? = null
    private var companyType: String? = null
    private var alarmLabel: String = "Attendance Alarm"
    private var alarmTime: String = ""
    private var vibrationEnabled: Boolean = true
    private var snoozeMinutes: Int = AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES
    private var snoozeRemaining: Int = AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT
    private var notificationId: Int = NOTIFICATION_ID_BASE

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> { stopRinging(); return START_NOT_STICKY }
            ACTION_SNOOZE -> {
                handleSnooze()
                stopRinging()
                return START_NOT_STICKY
            }
        }

        // (Re)start ringing with the supplied alarm spec.
        alarmJson = intent?.getStringExtra(AttendanceAlarmManager.EXTRA_ALARM_JSON)
        companyType = intent?.getStringExtra(AttendanceAlarmManager.EXTRA_COMPANY_TYPE)
        alarmLabel = intent?.getStringExtra(EXTRA_LABEL) ?: alarmLabel
        alarmTime = intent?.getStringExtra(EXTRA_TIME) ?: alarmTime
        vibrationEnabled = intent?.getBooleanExtra(EXTRA_VIBRATION, true) ?: true
        snoozeMinutes = intent?.getIntExtra(EXTRA_SNOOZE_MINUTES, AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES)
            ?: AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES
        snoozeRemaining = intent?.getIntExtra(AttendanceAlarmManager.EXTRA_SNOOZE_REMAINING, AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT)
            ?: AttendanceAlarmManager.DEFAULT_SNOOZE_COUNT
        notificationId = intent?.getIntExtra(AttendanceAlarmManager.EXTRA_NOTIFICATION_ID, NOTIFICATION_ID_BASE) ?: NOTIFICATION_ID_BASE

        startForegroundWithNotification()
        startPlayback()
        return START_NOT_STICKY
    }

    private fun startForegroundWithNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    AttendanceAlarmManager.RINGING_CHANNEL_ID,
                    "Ringing alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Sound and vibration while an attendance alarm is ringing"
                    setSound(null, null)
                    enableVibration(false)
                }
            )
        }

        val launchIntent = Intent(this, AlarmRingingActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_LABEL, alarmLabel)
            putExtra(EXTRA_TIME, alarmTime)
            putExtra(AttendanceAlarmManager.EXTRA_ALARM_JSON, alarmJson)
            putExtra(AttendanceAlarmManager.EXTRA_COMPANY_TYPE, companyType)
            putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra(AttendanceAlarmManager.EXTRA_SNOOZE_REMAINING, snoozeRemaining)
        }
        val fullScreenIntent = PendingIntent.getActivity(
            this, notificationId, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, AlarmRingingService::class.java).setAction(ACTION_STOP)
        val stopPending = PendingIntent.getService(
            this, notificationId + 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, AttendanceAlarmManager.RINGING_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $alarmLabel")
            .setContentText(if (alarmTime.isNotBlank()) "Alarm set for $alarmTime" else "Time to get ready for office")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(fullScreenIntent)
            .setFullScreenIntent(fullScreenIntent, true)
            .addAction(android.R.drawable.ic_media_pause, "Dismiss", stopPending)

        if (snoozeRemaining > 0) {
            val snoozeIntent = Intent(this, AlarmRingingService::class.java).setAction(ACTION_SNOOZE)
            val snoozePending = PendingIntent.getService(
                this, notificationId + 2, snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(
                android.R.drawable.ic_lock_idle_alarm,
                "Snooze ${snoozeMinutes}m",
                snoozePending
            )
        }

        val notification: Notification = builder.build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(notificationId, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun startPlayback() {
        stopPlayback()
        val spec = soundSpecFromExtras()
        serviceScope.launch {
            val mp = AlarmSoundPlayer.prepareAlarmPlayer(this@AlarmRingingService, spec)
            if (mp == null) {
                android.util.Log.w(TAG, "No alarm sound available; falling back to system alarm tone")
                return@launch
            }
            player = mp
            runCatching { mp.start() }
        }
        if (vibrationEnabled) startVibration()
    }

    private fun soundSpecFromExtras(): AlarmSoundPlayer.SoundSpec {
        alarmJson?.let {
            return try {
                AlarmSoundPlayer.SoundSpec.from(Gson().fromJson(it, EmployeeAlarm::class.java))
            } catch (e: Exception) { AlarmSoundPlayer.SoundSpec.builtin("alarm_classic") }
        }
        companyType?.let {
            return companySpecFor()
        }
        return AlarmSoundPlayer.SoundSpec.builtin("alarm_classic")
    }

    /** Company reminders use the published company sound when configured. */
    private fun companySpecFor(): AlarmSoundPlayer.SoundSpec {
        val policy = AttendanceAlarmManager(this).getPolicy()
        if (!policy.companySoundUrl.isNullOrBlank()) {
            return AlarmSoundPlayer.SoundSpec(
                EmployeeAlarm.SoundType.COMPANY,
                policy.companySoundUrl,
                policy.companySoundName
            )
        }
        return AlarmSoundPlayer.SoundSpec.builtin("alarm_classic")
    }

    private fun startVibration() {
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        vibrator?.vibrate(
            VibrationEffect.createWaveform(VIBRATION_PATTERN, 0)
        )
    }

    private fun handleSnooze() {
        val manager = AttendanceAlarmManager(this)
        val minutes = if (snoozeMinutes > 0) snoozeMinutes else AttendanceAlarmManager.DEFAULT_SNOOZE_MINUTES
        val ok = manager.snooze(
            alarmJson = alarmJson,
            companyType = companyType,
            minutes = minutes,
            remaining = snoozeRemaining - 1
        )
        if (!ok) {
            android.util.Log.w(TAG, "Snooze failed to schedule (exact alarm permission?)")
        }
    }

    private fun stopRinging() {
        stopPlayback()
        stopVibration()
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(notificationId)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun stopPlayback() {
        runCatching {
            player?.stop()
            player?.release()
        }
        player = null
    }

    private fun stopVibration() {
        runCatching { vibrator?.cancel() }
        vibrator = null
    }

    companion object {
        private const val TAG = "AlarmRingingService"
        const val ACTION_STOP = "com.swayog.employee.ACTION_STOP_RINGING"
        const val ACTION_SNOOZE = "com.swayog.employee.ACTION_SNOOZE_RINGING"
        const val EXTRA_LABEL = "EXTRA_LABEL"
        const val EXTRA_TIME = "EXTRA_TIME"
        const val EXTRA_VIBRATION = "EXTRA_VIBRATION"
        const val EXTRA_SNOOZE_MINUTES = "EXTRA_SNOOZE_MINUTES"
        const val NOTIFICATION_ID_BASE = 9000
        private val VIBRATION_PATTERN = longArrayOf(0, 600, 300, 600)

        fun stop(context: Context) {
            context.startService(Intent(context, AlarmRingingService::class.java).setAction(ACTION_STOP))
        }

        fun snooze(context: Context) {
            context.startService(Intent(context, AlarmRingingService::class.java).setAction(ACTION_SNOOZE))
        }

        fun isRinging(): Boolean = instance != null
        private var instance: AlarmRingingService? = null
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onDestroy() {
        instance = null
        serviceScope.cancel()
        stopPlayback()
        stopVibration()
        super.onDestroy()
    }
}
