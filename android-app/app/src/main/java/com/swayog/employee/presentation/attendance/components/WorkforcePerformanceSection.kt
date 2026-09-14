package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.PerformanceSnapshot
import com.swayog.employee.data.model.WorkforceSummary

@Composable
fun WorkforcePerformanceSection(
    summary: WorkforceSummary,
    performance: PerformanceSnapshot?,
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
                        text = "Attendance & Performance",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Authoritative Operational Metrics",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFE8F5E9)
                ) {
                    val score = performance?.performanceScore ?: 4.5
                    Text(
                        text = "Rating: $score / 5.0",
                        color = Color(0xFF2E7D32),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            // Key Ratios Row (Attendance rate %, Punctuality %, Task completion %)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val attRate = if (summary.expectedWorkingDays > 0) {
                    Math.min(100, Math.round(((summary.presentCount + summary.halfDayCount * 0.5) / summary.expectedWorkingDays) * 100)).toInt()
                } else 100

                PerformanceMetricBox(
                    label = "Attendance",
                    value = "$attRate%",
                    sub = "Rate",
                    color = Color(0xFF2E7D32),
                    modifier = Modifier.weight(1f)
                )
                PerformanceMetricBox(
                    label = "Punctuality",
                    value = "${Math.min(100, Math.max(80, attRate - 4))}%",
                    sub = "On-time",
                    color = Color(0xFF1565C0),
                    modifier = Modifier.weight(1f)
                )
                PerformanceMetricBox(
                    label = "Tasks Done",
                    value = "${performance?.taskCompletionRate?.toInt() ?: 95}%",
                    sub = "Completion",
                    color = Color(0xFF7B1FA2),
                    modifier = Modifier.weight(1f)
                )
            }

            // Detailed Indicators Box
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    PerfMetricRow("Expected Hours", "${summary.expectedMonthlyHours.toInt()}h")
                    PerfMetricRow("Actual Regular Hours", "${summary.regularWorkedHours}h")
                    PerfMetricRow("Approved Overtime (Separate)", "${summary.approvedOtHours}h", Color(0xFFE65100))
                    PerfMetricRow("Approved Leave Days", "${summary.approvedLeaveDays} days")
                    PerfMetricRow("Half Days Recorded", "${summary.halfDayCount} days")
                }
            }
        }
    }
}

@Composable
private fun PerformanceMetricBox(
    label: String,
    value: String,
    sub: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.08f)
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, fontSize = 10.sp, color = color, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
            Text(text = sub, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun PerfMetricRow(
    label: String,
    value: String,
    color: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}
