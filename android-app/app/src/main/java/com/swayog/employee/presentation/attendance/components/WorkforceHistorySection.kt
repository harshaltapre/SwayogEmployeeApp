package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EditCalendar
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.CalendarDayDto

@Composable
fun WorkforceHistorySection(
    days: List<CalendarDayDto>,
    onRequestCorrection: (CalendarDayDto) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Attendance History",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Complete Authoritative Day-by-Day Record",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Text(
                        text = "${days.size} Days",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            if (days.isEmpty()) {
                Text(
                    text = "No attendance history available for this month.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                // Show in reverse chronological order (latest days first)
                val reversedDays = days.reversed()
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    reversedDays.forEach { day ->
                        AttendanceHistoryRowItem(
                            day = day,
                            onRequestCorrection = { onRequestCorrection(day) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AttendanceHistoryRowItem(
    day: CalendarDayDto,
    onRequestCorrection: () -> Unit
) {
    val statusColor = when {
        day.isPresent -> Color(0xFF2E7D32)
        day.isHalfDay -> Color(0xFFF57C00)
        day.isPaidLeave || day.isUnpaidLeave -> Color(0xFF7B1FA2)
        day.isHoliday -> Color(0xFF8E24AA)
        day.isSunday -> Color(0xFFC62828)
        day.isAbsent -> Color(0xFFD32F2F)
        else -> Color(0xFF757575)
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Top row: Date & Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = day.date,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (day.holidayName != null) {
                        Text(
                            text = day.holidayName,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF8E24AA)
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = statusColor.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = day.status.replace("_", " "),
                        color = statusColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                    )
                }
            }

            // Middle row: Check In / Out and Regular / OT hours
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    val inTime = day.checkInTime?.substringAfter("T")?.take(5) ?: "--:--"
                    val outTime = day.checkOutTime?.substringAfter("T")?.take(5) ?: "--:--"
                    Text(
                        text = "In: $inTime  •  Out: $outTime",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (day.isAdminAssigned) {
                        Text(
                            text = "Assigned by Admin",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF1565C0)
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    val regH = day.regularHours.toInt()
                    val regM = ((day.regularHours - regH) * 60).toInt()
                    Text(
                        text = "${regH}h ${String.format(java.util.Locale.getDefault(), "%02dm", regM)} worked",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (day.regularHours > 0) Color(0xFF2E7D32) else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (day.overtimeHours > 0) {
                        val otH = day.overtimeHours.toInt()
                        val otM = ((day.overtimeHours - otH) * 60).toInt()
                        Text(
                            text = "+${otH}h ${String.format(java.util.Locale.getDefault(), "%02dm", otM)} OT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFE65100)
                        )
                    }
                }
            }

            // Correction option if day can have correction requested
            if (day.isPresent || day.isAbsent || day.isHalfDay) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    if (day.hasPendingCorrection) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(0xFFFFF3E0)
                        ) {
                            Text(
                                text = "Correction Pending Review",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFFE65100),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    } else {
                        TextButton(
                            onClick = onRequestCorrection,
                            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                        ) {
                            Icon(Icons.Default.EditCalendar, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Request Correction", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}
