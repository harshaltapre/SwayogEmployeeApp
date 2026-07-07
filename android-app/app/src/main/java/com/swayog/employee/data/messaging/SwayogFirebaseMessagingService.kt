package com.swayog.employee.data.messaging

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.swayog.employee.R
import com.swayog.employee.presentation.MainActivity

class SwayogFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Handle FCM messages here
        remoteMessage.notification?.let {
            sendNotification(it.title ?: "SWAYOG", it.body ?: "New notification")
        }
        
        // Handle data messages
        remoteMessage.data.isNotEmpty().let {
            val title = remoteMessage.data["title"]
            val message = remoteMessage.data["message"]
            val type = remoteMessage.data["type"]
            
            when (type) {
                "task_assigned" -> {
                    sendNotification(
                        title ?: "New Task Assigned",
                        message ?: "You have been assigned a new task"
                    )
                }
                "attendance_reminder" -> {
                    sendNotification(
                        title ?: "Attendance Reminder",
                        message ?: "Don't forget to check in today"
                    )
                }
                "task_update" -> {
                    sendNotification(
                        title ?: "Task Update",
                        message ?: "Your task has been updated"
                    )
                }
                else -> {
                    sendNotification(
                        title ?: "SWAYOG",
                        message ?: "New notification"
                    )
                }
            }
        }
    }
    
    override fun onNewToken(token: String) {
        // Send token to server
        // TODO: Implement token refresh logic
    }
    
    private fun sendNotification(title: String, message: String) {
        val channelId = "swayog_employee_channel"
        
        // Create intent for notification tap
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
        
        val notificationManager = NotificationManagerCompat.from(this)
        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }
}
