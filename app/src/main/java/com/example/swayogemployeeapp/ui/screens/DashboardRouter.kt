package com.example.swayogemployeeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardRouter(
    viewModel: MainViewModel,
    onNavigateBackToClock: () -> Unit,
    onLogout: () -> Unit
) {
    val sessionState by viewModel.session.collectAsState()
    
    // Live Outbox Queue Count for the top bar badge
    val context = androidx.compose.ui.platform.LocalContext.current
    val db = remember { AppDatabase.getDatabase(context) }
    var pendingSyncCount by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        while(true) {
            val list = db.outboxQueueDao().getQueue()
            pendingSyncCount = list.size
            delay(3000) // Poll every 3 seconds for local demo outbox count
        }
    }

    if (sessionState == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = PrimaryAmber)
        }
        return
    }

    val session = sessionState!!

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = session.jobRole.uppercase(),
                            style = Typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = PrimaryAmber,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = "Workspace Panel • ${session.name}",
                            style = Typography.labelSmall,
                            color = MutedText
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBackToClock) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back to Clock", tint = NeutralText)
                    }
                },
                actions = {
                    // Outbox Sync Queue Status Badge
                    if (pendingSyncCount > 0) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .padding(end = 12.dp)
                                .background(EngineeringBlue.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CloudSync,
                                contentDescription = "Offline Pending sync",
                                tint = EngineeringBlue,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "$pendingSyncCount Outbox",
                                color = EngineeringBlue,
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            )
                        }
                    } else {
                        Icon(
                            imageVector = Icons.Default.CloudUpload,
                            contentDescription = "Synced",
                            tint = SuccessGreen,
                            modifier = Modifier.padding(end = 16.dp).size(20.dp)
                        )
                    }

                    IconButton(onClick = onLogout) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = "Logout", tint = Color(0xFFEF4444))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark)
            )
        },
        containerColor = BackgroundDark
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (session.jobRole) {
                "Service Coordinator" -> CoordinatorDashboard(viewModel)
                "Site Survey Engineer" -> SurveyDashboard(viewModel)
                "Solar Design Engineer" -> DesignDashboard(viewModel)
                "Electrical Engineer" -> ElectricalDashboard(viewModel)
                "Inventory Executive" -> InventoryDashboard(viewModel)
                "O&M Technician" -> MaintenanceDashboard(viewModel)
                "Service Engineer" -> ServiceDashboard(viewModel)
                "Monitoring Analyst" -> MonitoringDashboard(viewModel)
                "Intern" -> InternDashboard(viewModel)
                else -> {
                    // Fallback
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = "Generic Dashboard: Role not mapped yet",
                            color = NeutralText,
                            style = Typography.bodyLarge
                        )
                    }
                }
            }
        }
    }
}
