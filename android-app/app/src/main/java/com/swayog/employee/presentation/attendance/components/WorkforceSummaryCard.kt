package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.WorkforceSummary

@Composable
fun WorkforceSummaryCard(
    monthName: String,
    year: Int,
    summary: WorkforceSummary,
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
                .padding(18.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "$monthName $year",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Authoritative Monthly Summary",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Net Difference Badge
                val isDeficit = summary.differenceInRegularHours < 0
                val diffColor = if (isDeficit) Color(0xFFE53935) else Color(0xFF43A047)
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = diffColor.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = if (isDeficit) "${summary.differenceInRegularHours}h" else "+${summary.differenceInRegularHours}h",
                        color = diffColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Primary Hours Row (Expected, Regular Worked, Approved OT)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                HourMetricBox(
                    label = "Expected",
                    value = "${summary.expectedMonthlyHours.toInt()}h",
                    subValue = "${summary.expectedWorkingDays.toInt()} days",
                    backgroundColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                    textColor = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f)
                )
                HourMetricBox(
                    label = "Worked",
                    value = "${summary.regularWorkedHours}h",
                    subValue = "Regular",
                    backgroundColor = Color(0xFFE8F5E9),
                    textColor = Color(0xFF2E7D32),
                    modifier = Modifier.weight(1f)
                )
                HourMetricBox(
                    label = "Approved OT",
                    value = "${summary.approvedOtHours}h",
                    subValue = "Separate",
                    backgroundColor = Color(0xFFFFF3E0),
                    textColor = Color(0xFFE65100),
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(12.dp))

            // Breakdown Chips Grid (Row 1: Present, Half Day, Absent, Leave)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                DayCountChip(label = "Present", count = summary.presentCount.toString(), color = Color(0xFF2E7D32))
                DayCountChip(label = "Half Day", count = summary.halfDayCount.toString(), color = Color(0xFFF57C00))
                DayCountChip(label = "Absent", count = summary.absentCount.toString(), color = Color(0xFFD32F2F))
                DayCountChip(label = "Paid Leave", count = summary.paidLeaveDays.toString(), color = Color(0xFF7B1FA2))
                DayCountChip(label = "Weekly Off", count = summary.weeklyOffs.toString(), color = Color(0xFF1565C0))
                DayCountChip(label = "Holidays", count = summary.companyHolidays.toString(), color = Color(0xFFC2185B))
            }
        }
    }
}

@Composable
private fun HourMetricBox(
    label: String,
    value: String,
    subValue: String,
    backgroundColor: Color,
    textColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        color = backgroundColor
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = textColor.copy(alpha = 0.85f)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = textColor
            )
            Spacer(modifier = Modifier.height(1.dp))
            Text(
                text = subValue,
                fontSize = 10.sp,
                color = textColor.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun DayCountChip(
    label: String,
    count: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(color)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = count,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
        Text(
            text = label,
            fontSize = 10.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
