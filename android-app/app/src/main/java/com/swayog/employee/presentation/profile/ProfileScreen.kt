package com.swayog.employee.presentation.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.swayog.employee.presentation.common.components.*

@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Profile",
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
            // Profile Header
            SwayogCard {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "JD",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "John Doe",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Service Coordinator",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = "EMP-12345",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    )
                }
            }
            
            // Profile Details
            SwayogCard {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    ProfileItem(
                        icon = Icons.Default.Email,
                        label = "Email",
                        value = "john.doe@swayog.com"
                    )
                    ProfileItem(
                        icon = Icons.Default.Phone,
                        label = "Phone",
                        value = "+91 98765 43210"
                    )
                    ProfileItem(
                        icon = Icons.Default.LocationOn,
                        label = "Zone",
                        value = "Pune West"
                    )
                    ProfileItem(
                        icon = Icons.Default.Badge,
                        label = "Department",
                        value = "Operations"
                    )
                }
            }
            
            // Actions
            SwayogCard {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SwayogButton(
                        text = "Edit Profile",
                        onClick = { /* TODO: Navigate to edit profile */ },
                        variant = ButtonVariant.Secondary
                    )
                    SwayogButton(
                        text = "Change Password",
                        onClick = { /* TODO: Navigate to change password */ },
                        variant = ButtonVariant.Secondary
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary
        )
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
