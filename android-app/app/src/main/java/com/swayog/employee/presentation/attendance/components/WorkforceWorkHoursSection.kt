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
import com.swayog.employee.data.model.WorkforceSummary

@Composable
fun WorkforceWorkHoursSection(
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
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Expected vs Actual Hours",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                ) {
                    Text(
                        text = "Policy Rule",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            // Calculation Breakdown Box
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "Dynamic Working-Hours Calculation",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    FormulaRow("Calendar Days", "${summary.calendarDays}")
                    FormulaRow("Minus Weekly Offs (Sundays)", "-${summary.weeklyOffs}")
                    FormulaRow("Minus Company Holidays", "-${summary.companyHolidays}")
                    val leaveDetails = if (summary.approvedLeaveDays > 0) " (${summary.paidLeaveDays.toInt()} Paid, ${summary.unpaidLeaveDays.toInt()} Unpaid)" else ""
                    FormulaRow("Minus Approved Leave", "-${summary.approvedLeaveDays.toInt()}$leaveDetails")
                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                    FormulaRow("Expected Working Days", "${summary.expectedWorkingDays.toInt()} days", isBold = true)
                    FormulaRow("Daily Required Hours", "× ${summary.dailyRequiredHours}h")
                    FormulaRow("Expected Monthly Hours", "${summary.expectedMonthlyHours.toInt()}h", isBold = true, highlightColor = MaterialTheme.colorScheme.primary)
                }
            }

            // Comparison Metrics
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFE8F5E9),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Regular Worked", fontSize = 11.sp, color = Color(0xFF2E7D32))
                        Text("${summary.regularWorkedHours}h", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFFFF3E0),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Approved OT", fontSize = 11.sp, color = Color(0xFFE65100))
                        Text("${summary.approvedOtHours}h", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFFBF360C))
                    }
                }
            }

            // Deficit/Surplus & Remaining Hours
            val isDeficit = summary.differenceInRegularHours < 0
            val statusColor = if (isDeficit) Color(0xFFE53935) else Color(0xFF2E7D32)

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = statusColor.copy(alpha = 0.08f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (isDeficit) "Regular Hours Deficit" else "Regular Hours Surplus",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = statusColor
                        )
                        Text(
                            text = "${summary.differenceInRegularHours}h",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Remaining Required",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${summary.remainingRequiredHours}h",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FormulaRow(
    label: String,
    value: String,
    isBold: Boolean = false,
    highlightColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Medium,
            color = highlightColor
        )
    }
}
