package com.swayog.employee.presentation.attendance

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.swayog.employee.presentation.common.components.*

@Composable
fun AttendanceScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Attendance",
                showBackButton = true,
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Attendance Calendar
            SwayogCard {
                Text(
                    text = "Attendance Calendar",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(16.dp))
                // TODO: Implement calendar view
                Text(
                    text = "Calendar view will be implemented here",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
            
            // Check-in/Check-out Actions
            SwayogCard {
                Text(
                    text = "Today's Actions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    SwayogButton(
                        text = "Check In",
                        onClick = { /* TODO: Implement check-in with camera */ },
                        modifier = Modifier.weight(1f)
                    )
                    SwayogButton(
                        text = "Check Out",
                        onClick = { /* TODO: Implement check-out */ },
                        modifier = Modifier.weight(1f),
                        variant = ButtonVariant.Secondary
                    )
                }
            }
            
            // Attendance Stats
            SwayogCard {
                Text(
                    text = "This Month",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column {
                        Text(
                            text = "22",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Present",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Column {
                        Text(
                            text = "2",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = "Absent",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Column {
                        Text(
                            text = "1",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.secondary
                        )
                        Text(
                            text = "Late",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}
