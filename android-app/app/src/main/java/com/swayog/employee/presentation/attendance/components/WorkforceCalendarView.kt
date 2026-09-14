package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.CalendarDayDto

@Composable
fun WorkforceCalendarView(
    month: Int,
    year: Int,
    days: List<CalendarDayDto>,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onDayClick: (CalendarDayDto) -> Unit,
    modifier: Modifier = Modifier
) {
    val monthNames = listOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )
    val monthName = monthNames.getOrElse(month - 1) { "Month" }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Month Header with Navigation
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$monthName $year",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onPreviousMonth) {
                        Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Month")
                    }
                    IconButton(onClick = onNextMonth) {
                        Icon(Icons.Default.ChevronRight, contentDescription = "Next Month")
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Weekday Headers (Sun to Sat)
            val weekHeaders = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                weekHeaders.forEach { dayName ->
                    Text(
                        text = dayName,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (dayName == "Sun") Color(0xFFE53935) else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.width(36.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Calendar Day Grid
            // Calculate leading empty offset for the 1st of the month
            val firstDayOfWeek = days.firstOrNull()?.dayOfWeek ?: 0
            val totalCells = firstDayOfWeek + days.size
            val rows = (totalCells + 6) / 7

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (row in 0 until rows) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        for (col in 0 until 7) {
                            val cellIndex = row * 7 + col
                            val dayIndex = cellIndex - firstDayOfWeek
                            if (dayIndex in days.indices) {
                                val dayDto = days[dayIndex]
                                CalendarDayCell(
                                    day = dayDto,
                                    onClick = { onDayClick(dayDto) }
                                )
                            } else {
                                Spacer(modifier = Modifier.size(36.dp))
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
            Spacer(modifier = Modifier.height(10.dp))

            // Color-coded Legend
            CalendarLegend()
        }
    }
}

@Composable
private fun CalendarDayCell(
    day: CalendarDayDto,
    onClick: () -> Unit
) {
    // Determine cell styling
    val (dotColor, backgroundColor, textColor) = when {
        day.isSunday -> Triple(Color(0xFFE53935), Color(0xFFFFEBEE), Color(0xFFC62828))
        day.isHoliday -> Triple(Color(0xFF8E24AA), Color(0xFFF3E5F5), Color(0xFF6A1B9A))
        day.isPaidLeave || day.isUnpaidLeave -> Triple(Color(0xFF3949AB), Color(0xFFE8EAF6), Color(0xFF283593))
        day.isPresent -> Triple(Color(0xFF2E7D32), Color(0xFFE8F5E9), Color(0xFF1B5E20))
        day.isHalfDay -> Triple(Color(0xFFF57C00), Color(0xFFFFF3E0), Color(0xFFE65100))
        day.isAbsent -> Triple(Color(0xFFD32F2F), Color(0xFFFFEBEE), Color(0xFFB71C1C))
        else -> Triple(Color.Transparent, MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), MaterialTheme.colorScheme.onSurface)
    }

    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .border(
                width = if (day.isAdminAssigned || day.hasPendingCorrection) 1.5.dp else 0.dp,
                color = if (day.hasPendingCorrection) Color(0xFFFFB300) else if (day.isAdminAssigned) Color(0xFF1976D2) else Color.Transparent,
                shape = RoundedCornerShape(10.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "${day.dayNumber}",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = textColor
            )
            if (dotColor != Color.Transparent || day.overtimeHours > 0) {
                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    if (dotColor != Color.Transparent) {
                        Box(
                            modifier = Modifier
                                .size(4.dp)
                                .clip(CircleShape)
                                .background(dotColor)
                        )
                    }
                    if (day.overtimeHours > 0) {
                        Box(
                            modifier = Modifier
                                .size(4.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFF6F00))
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CalendarLegend() {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Legend",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            LegendItem(color = Color(0xFF2E7D32), label = "Present")
            LegendItem(color = Color(0xFFF57C00), label = "Half Day")
            LegendItem(color = Color(0xFFE53935), label = "Sunday")
            LegendItem(color = Color(0xFF8E24AA), label = "Holiday")
            LegendItem(color = Color(0xFF3949AB), label = "Leave")
            LegendItem(color = Color(0xFFFF6F00), label = "OT")
        }
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(3.dp))
        Text(text = label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ── Day Details Dialog ──────────────────────────────────────────────────────

@Composable
fun DayDetailsDialog(
    day: CalendarDayDto,
    onDismiss: () -> Unit,
    onRequestOvertime: (CalendarDayDto) -> Unit,
    onRequestCorrection: (CalendarDayDto) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = day.date,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Text(
                        text = day.status.replace("_", " "),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (day.holidayName != null) {
                    DetailRow(label = "Holiday Name", value = day.holidayName, valueColor = Color(0xFF8E24AA))
                }
                if (day.isSunday || day.isHoliday) {
                    DetailRow(label = "Normal Check-In", value = "Disabled", valueColor = Color(0xFF757575))
                }
                if (day.checkInTime != null) {
                    DetailRow(label = "Check-in", value = day.checkInTime.substringAfter("T").take(5))
                }
                if (day.checkOutTime != null) {
                    DetailRow(label = "Check-out", value = day.checkOutTime.substringAfter("T").take(5))
                }
                val regHours = day.regularHours.toInt()
                val regMins = ((day.regularHours - regHours) * 60).toInt()
                DetailRow(label = "Regular hours", value = "${regHours}h ${String.format(java.util.Locale.getDefault(), "%02dm", regMins)}")

                val otHours = day.overtimeHours.toInt()
                val otMins = ((day.overtimeHours - otHours) * 60).toInt()
                DetailRow(label = "Overtime", value = "${otHours}h ${String.format(java.util.Locale.getDefault(), "%02dm", otMins)}", valueColor = Color(0xFFE65100))

                val totHours = day.totalHours.toInt()
                val totMins = ((day.totalHours - totHours) * 60).toInt()
                DetailRow(label = "Total", value = "${totHours}h ${String.format(java.util.Locale.getDefault(), "%02dm", totMins)}", valueColor = MaterialTheme.colorScheme.primary)

                if (day.isAdminAssigned) {
                    DetailRow(label = "Source", value = "Assigned by Admin", valueColor = Color(0xFF1565C0))
                }
                if (day.hasPendingCorrection) {
                    DetailRow(label = "Correction", value = "Pending Approval", valueColor = Color(0xFFF57C00))
                }
                if (!day.notes.isNullOrBlank()) {
                    DetailRow(label = "Notes", value = day.notes)
                }
            }
        },
        confirmButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (day.overtimeAllowed) {
                    TextButton(onClick = {
                        onDismiss()
                        onRequestOvertime(day)
                    }) {
                        Text("Request OT")
                    }
                }
                if (day.isPresent || day.isAbsent || day.isHalfDay) {
                    TextButton(onClick = {
                        onDismiss()
                        onRequestCorrection(day)
                    }) {
                        Text("Request Correction")
                    }
                }
                TextButton(onClick = onDismiss) {
                    Text("Close")
                }
            }
        }
    )
}

@Composable
private fun DetailRow(
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
    }
}
