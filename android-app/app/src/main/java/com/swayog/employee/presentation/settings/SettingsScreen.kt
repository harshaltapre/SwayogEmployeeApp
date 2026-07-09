package com.swayog.employee.presentation.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.swayog.employee.presentation.common.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val darkMode by viewModel.darkMode.collectAsState()
    val biometricEnabled by viewModel.biometricEnabled.collectAsState()
    val notificationsEnabled by viewModel.notificationsEnabled.collectAsState()
    val language by viewModel.language.collectAsState()

    val userName by viewModel.userName.collectAsState()
    val userEmail by viewModel.userEmail.collectAsState()
    val userRole by viewModel.userRole.collectAsState()
    val jobRole by viewModel.jobRole.collectAsState()

    var showLanguageDialog by remember { mutableStateOf(false) }
    var cacheSize by remember { mutableStateOf(viewModel.getCacheSize()) }
    var showLogoutConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Settings",
                showBackButton = true,
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Summary Header card
            item {
                SwayogCard {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Avatar view
                        val initials = userName?.split(" ")
                            ?.mapNotNull { it.firstOrNull()?.uppercaseChar() }
                            ?.joinToString("")?.take(2) ?: "U"
                        
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = initials,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = userName ?: "User Profile",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = userEmail ?: "Loading email...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            val displayRole = jobRole ?: when (userRole?.uppercase()) {
                                "SUPER_ADMIN" -> "Super Admin"
                                "ADMIN" -> "Admin"
                                "SUB_ADMIN" -> "Service Coordinator"
                                "TEAM_LEAD" -> "Team Lead"
                                "DEPARTMENT_HEAD" -> "Department Head"
                                else -> "Employee"
                            }
                            Surface(
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.padding(top = 6.dp)
                            ) {
                                Text(
                                    text = displayRole,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            // General & Localization Settings
            item {
                SwayogCard {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(
                            text = "Localization Options",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Divider()
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showLanguageDialog = true }
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Language Preference",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = when (language) {
                                        "hi" -> "हिंदी (Hindi)"
                                        "mr" -> "मराठी (Marathi)"
                                        else -> "English"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Icon(Icons.Default.Translate, contentDescription = "Language", tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }

            // Appearance Settings
            item {
                SwayogCard {
                    Column {
                        Text(
                            text = "Appearance Theme",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        SettingToggle(
                            title = "Dark Mode Theme",
                            description = "Enable dark layout styling",
                            checked = darkMode,
                            onCheckedChange = { viewModel.setDarkMode(it) }
                        )
                    }
                }
            }

            // Security Settings
            item {
                SwayogCard {
                    Column {
                        Text(
                            text = "Security Options",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        SettingToggle(
                            title = "Biometrics Auth",
                            description = "Use fingerprint scans on login screen",
                            checked = biometricEnabled,
                            onCheckedChange = { viewModel.setBiometricEnabled(it) }
                        )
                    }
                }
            }

            // Notification Settings
            item {
                SwayogCard {
                    Column {
                        Text(
                            text = "Notifications Alerts",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        SettingToggle(
                            title = "Push Notifications",
                            description = "Receive task assigned alerts",
                            checked = notificationsEnabled,
                            onCheckedChange = { viewModel.setNotificationsEnabled(it) }
                        )
                    }
                }
            }

            // Data & Storage
            item {
                SwayogCard {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(
                            text = "Data & Storage",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Divider()

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Temporary Cache",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "Size: $cacheSize",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Button(
                                onClick = {
                                    viewModel.clearCache()
                                    cacheSize = viewModel.getCacheSize()
                                    Toast.makeText(context, "Cache cleared successfully!", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer)
                            ) {
                                Text("Clear")
                            }
                        }
                    }
                }
            }

            // Support & Feedback Info Section
            item {
                SwayogCard {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(
                            text = "Help & Support",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Divider()

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    Toast.makeText(context, "Support Hotline: +91-XXXXXXXXXX", Toast.LENGTH_LONG).show()
                                }
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Customer Support",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "Talk to a Swayog coordinator",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Icon(Icons.Default.SupportAgent, contentDescription = "Support", tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }

            // Software details Info Section
            item {
                SwayogCard {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Software Info",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Divider()
                        SettingItem(
                            title = "Application Version",
                            value = "1.1.0-beta"
                        )
                        SettingItem(
                            title = "Software Build ID",
                            value = "102"
                        )
                        SettingItem(
                            title = "Target Backend Server",
                            value = "Swayog Node API"
                        )
                    }
                }
            }

            // Logout Action Button
            item {
                SwayogButton(
                    text = "Logout Session",
                    onClick = { showLogoutConfirm = true },
                    variant = ButtonVariant.Secondary
                )
            }
        }

        // Language Select Dialog modal
        if (showLanguageDialog) {
            Dialog(onDismissRequest = { showLanguageDialog = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .wrapContentHeight(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Select Language",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Divider()

                        val languages = listOf("en" to "English", "hi" to "हिंदी (Hindi)", "mr" to "मराठी (Marathi)")
                        languages.forEach { (code, label) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        viewModel.setLanguage(code)
                                        showLanguageDialog = false
                                        Toast.makeText(context, "Language updated to $label", Toast.LENGTH_SHORT).show()
                                    }
                                    .padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = if (language == code) FontWeight.Bold else FontWeight.Normal
                                )
                                if (language == code) {
                                    Icon(
                                        Icons.Default.Check,
                                        contentDescription = "Selected",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Logout Confirmation Dialog
        if (showLogoutConfirm) {
            AlertDialog(
                onDismissRequest = { showLogoutConfirm = false },
                title = { Text("Logout Confirmation") },
                text = { Text("Are you sure you want to end your session?") },
                confirmButton = {
                    TextButton(onClick = {
                        showLogoutConfirm = false
                        onLogout()
                    }) {
                        Text("Logout", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutConfirm = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun SettingToggle(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
fun SettingItem(
    title: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}
