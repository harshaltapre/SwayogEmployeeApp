package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.OvertimeSessionDto
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun WorkforceTodayCard(
    todayAttendance: AttendanceRecord?,
    todayCalendarDay: com.swayog.employee.data.model.CalendarDayDto? = null,
    activeOtSession: OvertimeSessionDto?,
    liveOtDurationText: String,
    onCheckInClick: () -> Unit,
    onCheckOutClick: () -> Unit,
    onRequestOtClick: () -> Unit,
    onStopOtClick: () -> Unit,
    onOpenMapClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val todayDateFormatted = SimpleDateFormat("EEEE, dd MMMM yyyy", Locale.getDefault()).format(Date())
    
    // Authoritative today state provided directly from backend
    val isSunday = todayCalendarDay?.isSunday == true
    val isHoliday = todayCalendarDay?.isHoliday == true
    val holidayName = todayCalendarDay?.holidayName
    val isLeave = todayCalendarDay?.isPaidLeave == true || todayCalendarDay?.isUnpaidLeave == true || todayAttendance?.status == "LEAVE"
    val isCheckedIn = todayAttendance?.checkInTime != null && todayAttendance.checkOutTime == null
    val isCheckedOut = todayAttendance?.checkOutTime != null
    val isAdminMarked = todayAttendance?.isAdminMarked == true || todayCalendarDay?.isAdminAssigned == true
    val isOtActive = activeOtSession != null && activeOtSession.status == "ACTIVE"
    val isOvertimeAllowed = todayCalendarDay?.overtimeAllowed == true || isSunday || isHoliday

    val statusLabel = when {
        isOtActive -> "OVERTIME ACTIVE"
        isAdminMarked -> "ASSIGNED BY ADMIN"
        isLeave -> "ON LEAVE"
        isHoliday -> if (!holidayName.isNullOrBlank()) "HOLIDAY: ${holidayName.uppercase()}" else "COMPANY HOLIDAY"
        isSunday -> "WEEKLY OFF"
        isCheckedOut -> "ATTENDANCE COMPLETED"
        isCheckedIn -> "CHECKED IN"
        todayAttendance?.status == "HALF_DAY" || todayCalendarDay?.isHalfDay == true -> "HALF DAY"
        todayAttendance?.status == "ABSENT" || todayCalendarDay?.isAbsent == true -> "ABSENT"
        else -> "NOT CHECKED IN"
    }

    val statusColor = when {
        isOtActive -> Color(0xFFE65100)
        isCheckedOut || todayAttendance?.status == "PRESENT" || todayCalendarDay?.isPresent == true -> Color(0xFF2E7D32)
        isAdminMarked -> Color(0xFF1565C0)
        isCheckedIn -> Color(0xFF0288D1)
        isLeave -> Color(0xFF7B1FA2)
        isHoliday -> Color(0xFF8E24AA)
        isSunday -> Color(0xFFC62828)
        todayAttendance?.status == "HALF_DAY" || todayCalendarDay?.isHalfDay == true -> Color(0xFFF57C00)
        else -> Color(0xFF757575)
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp)
        ) {
            // Top Date and Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Today",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = todayDateFormatted,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = statusColor.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = statusLabel,
                        color = statusColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Timings & Hours Box
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Check-in / out times
                    Column {
                        Text(
                            text = "Check-in",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = formatTimeToDisplay(todayAttendance?.checkInTime ?: todayCalendarDay?.checkInTime),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Check-out",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = formatTimeToDisplay(todayAttendance?.checkOutTime ?: todayCalendarDay?.checkOutTime),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    VerticalDivider(
                        modifier = Modifier.height(80.dp),
                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
                    )

                    // Worked, Overtime & Total Hours
                    val regularMins = todayAttendance?.totalMinutes 
                        ?: (todayCalendarDay?.regularHours?.let { (it * 60).toInt() }
                        ?: (if (isCheckedIn) calculateElapsedMinutes(todayAttendance?.checkInTime) else 0))
                    val otMins = (todayCalendarDay?.overtimeHours?.let { (it * 60).toInt() } ?: 0)
                    val totalMins = regularMins + otMins

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Regular worked",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${regularMins / 60}h ${String.format(Locale.getDefault(), "%02dm", regularMins % 60)}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF2E7D32)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isOtActive) "Overtime (Active)" else "Overtime",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (isOtActive) liveOtDurationText else "${otMins / 60}h ${String.format(Locale.getDefault(), "%02dm", otMins % 60)}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isOtActive) Color(0xFFE65100) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Total",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "${totalMins / 60}h ${String.format(Locale.getDefault(), "%02dm", totalMins % 60)}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // Admin Override Remark banner if assigned
            if (isAdminMarked && !todayAttendance?.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFE3F2FD),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Color(0xFF1565C0),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Admin Note: ${todayAttendance?.notes}",
                            fontSize = 11.sp,
                            color = Color(0xFF0D47A1)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Contextual Action Buttons (Never contradictory!)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                when {
                    isOtActive -> {
                        Button(
                            onClick = onStopOtClick,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD84315)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Stop OT Session")
                        }
                    }
                    isAdminMarked -> {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFE8F5E9),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA5D6A7))
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Assigned by Admin", fontWeight = FontWeight.SemiBold, color = Color(0xFF2E7D32), fontSize = 13.sp)
                            }
                        }
                    }
                    isLeave -> {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFF3E5F5),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCE93D8))
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.EventBusy, contentDescription = null, tint = Color(0xFF7B1FA2), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("On Approved Leave", fontWeight = FontWeight.SemiBold, color = Color(0xFF7B1FA2), fontSize = 13.sp)
                            }
                        }
                    }
                    isSunday || isHoliday -> {
                        Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Surface(
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Normal Check-In: Disabled",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            if (isOvertimeAllowed) {
                                OutlinedButton(
                                    onClick = onRequestOtClick,
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Request OT", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                    isCheckedIn -> {
                        Button(
                            onClick = onCheckOutClick,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC62828)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Check Out")
                        }
                    }
                    isCheckedOut -> {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFE8F5E9)
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Attendance Completed", fontWeight = FontWeight.SemiBold, color = Color(0xFF2E7D32), fontSize = 13.sp)
                            }
                        }
                    }
                    else -> {
                        Button(
                            onClick = onCheckInClick,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Check In")
                        }
                    }
                }

                // Map & GPS View Action Button
                FilledTonalIconButton(
                    onClick = onOpenMapClick,
                    shape = RoundedCornerShape(12.dp),
                    colors = IconButtonDefaults.filledTonalIconButtonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
                ) {
                    Icon(Icons.Default.Map, contentDescription = "View Map", tint = MaterialTheme.colorScheme.onSecondaryContainer)
                }
            }
        }
    }
}

private fun formatTimeToDisplay(isoString: String?): String {
    if (isoString.isNullOrBlank()) return "--:--"
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        parser.timeZone = TimeZone.getTimeZone("UTC")
        val date = parser.parse(isoString.substringBefore("."))
        if (date != null) {
            val formatter = SimpleDateFormat("hh:mm a", Locale.getDefault())
            formatter.timeZone = TimeZone.getDefault()
            formatter.format(date)
        } else {
            "--:--"
        }
    } catch (e: Exception) {
        isoString.substringAfter("T").take(5)
    }
}

private fun calculateElapsedMinutes(isoString: String?): Int {
    if (isoString.isNullOrBlank()) return 0
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        parser.timeZone = TimeZone.getTimeZone("UTC")
        val date = parser.parse(isoString.substringBefore("."))
        if (date != null) {
            val diffMs = Math.max(0, System.currentTimeMillis() - date.time)
            (diffMs / (1000 * 60)).toInt()
        } else {
            0
        }
    } catch (e: Exception) {
        0
    }
}
