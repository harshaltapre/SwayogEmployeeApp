package com.swayog.employee.presentation.attendance.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.swayog.employee.data.model.EarningsSummary
import com.swayog.employee.data.model.SalaryRevisionDto

@Composable
fun WorkforceEarningsSection(
    earnings: EarningsSummary?,
    salaryHistory: List<SalaryRevisionDto>,
    modifier: Modifier = Modifier
) {
    val data = earnings ?: EarningsSummary()

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
            // Header with Estimated / Final Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Salary & Earnings",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Authoritative Payroll Breakdown",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                val isFinal = data.isFinalized
                val badgeColor = if (isFinal) Color(0xFF2E7D32) else Color(0xFFE65100)
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = badgeColor.copy(alpha = 0.12f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isFinal) Icons.Default.Verified else Icons.Default.Pending,
                            contentDescription = null,
                            tint = badgeColor,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = data.payrollStatus,
                            color = badgeColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            // Net Estimated / Final Payable Highlight Box
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = if (data.isFinalized) "CONFIRMED NET PAYABLE" else "ESTIMATED NET PAYABLE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "₹${formatCurrency(data.estimatedPayable)}",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (!data.isFinalized) {
                        Text(
                            text = "Subject to final payroll review at end of cycle",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Salary Component Breakdown
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SalaryRow(label = "Base Salary", amount = "₹${formatCurrency(data.baseSalary)}")
                    SalaryRow(label = "Regular Pay", amount = "₹${formatCurrency(data.regularPay)}")
                    SalaryRow(label = "Approved OT Pay (${data.overtimeHours}h)", amount = "+₹${formatCurrency(data.overtimeEarnings)}", valueColor = Color(0xFF2E7D32))
                    SalaryRow(label = "Incentives Earned", amount = "+₹${formatCurrency(data.incentives)}", valueColor = Color(0xFF2E7D32))
                    SalaryRow(label = "Advance Deduction", amount = "-₹${formatCurrency(data.advanceDeduction)}", valueColor = Color(0xFFC62828))
                    SalaryRow(label = "Standard Deductions", amount = "-₹${formatCurrency(data.otherDeductions)}", valueColor = Color(0xFFC62828))
                }
            }

            // Salary Revision History
            if (salaryHistory.isNotEmpty()) {
                Text(
                    text = "Salary Revision History",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    salaryHistory.forEach { rev ->
                        SalaryRevisionItemView(rev)
                    }
                }
            }
        }
    }
}

@Composable
private fun SalaryRow(
    label: String,
    amount: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = amount, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
    }
}

@Composable
private fun SalaryRevisionItemView(rev: SalaryRevisionDto) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Effective: ${rev.effectiveDate}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "₹${formatCurrency(rev.previousSalary)} → ₹${formatCurrency(rev.newSalary)}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (!rev.reason.isNullOrBlank()) {
                    Text(
                        text = rev.reason,
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFFE8F5E9)
            ) {
                Text(
                    text = "+₹${formatCurrency(rev.incrementAmount)} (${rev.incrementPercentage}%)",
                    color = Color(0xFF2E7D32),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                )
            }
        }
    }
}

private fun formatCurrency(amount: Double): String {
    return String.format(java.util.Locale.getDefault(), "%,.0f", amount)
}
