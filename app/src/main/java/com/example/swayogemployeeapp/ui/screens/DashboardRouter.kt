package com.example.swayogemployeeapp.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.List
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.outlined.Assignment
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.ui.theme.*

private data class TabItem(
    val route: String,
    val label: String,
    val unselectedIcon: ImageVector,
    val selectedIcon: ImageVector
)

private fun getTabsForRole(jobRole: String): List<TabItem> {
    return when (jobRole) {
        "Field Technician" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks", "Tasks", Icons.AutoMirrored.Outlined.Assignment, Icons.AutoMirrored.Filled.Assignment),
            TabItem("attendance", "Attendance", Icons.Outlined.PinDrop, Icons.Filled.PinDrop),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Team Lead" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("team", "Team", Icons.Outlined.People, Icons.Filled.People),
            TabItem("tasks", "Tasks", Icons.AutoMirrored.Outlined.Assignment, Icons.AutoMirrored.Filled.Assignment),
            TabItem("attendance", "Attendance", Icons.Outlined.PinDrop, Icons.Filled.PinDrop),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Department Head" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("team_dept", "Department", Icons.Outlined.Cabin, Icons.Filled.Cabin),
            TabItem("team", "Teams", Icons.Outlined.People, Icons.Filled.People),
            TabItem("tasks_reports", "Reports", Icons.Outlined.Assessment, Icons.Filled.Assessment),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Sub-Admin", "Service Coordinator" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("complaints", "Complaints", Icons.Outlined.Report, Icons.Filled.Report),
            TabItem("tasks_amc", "AMC", Icons.Outlined.Build, Icons.Filled.Build),
            TabItem("team_emp", "Employees", Icons.Outlined.People, Icons.Filled.People),
            TabItem("financials", "Financials", Icons.Outlined.AttachMoney, Icons.Filled.AttachMoney),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Inventory Executive" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_inv", "Inventory", Icons.Outlined.Inventory, Icons.Filled.Inventory),
            TabItem("tasks_disp", "Dispatch", Icons.Outlined.Cabin, Icons.Filled.Cabin),
            TabItem("team_cust", "Customers", Icons.Outlined.Group, Icons.Filled.Group),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Monitoring Analyst" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_mon", "Monitoring", Icons.Outlined.Info, Icons.Filled.Info),
            TabItem("tasks_alerts", "Alerts", Icons.Outlined.Warning, Icons.Filled.Warning),
            TabItem("team_analytics", "Analytics", Icons.Outlined.Assessment, Icons.Filled.Assessment),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Service Engineer" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_req", "Requests", Icons.Outlined.Build, Icons.Filled.Build),
            TabItem("tasks_inst", "Installations", Icons.Outlined.Build, Icons.Filled.Build),
            TabItem("attendance_hist", "History", Icons.AutoMirrored.Outlined.List, Icons.AutoMirrored.Filled.List),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Solar Design Engineer" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_design", "Designs", Icons.Outlined.Edit, Icons.Filled.Edit),
            TabItem("tasks_bom", "BOM", Icons.AutoMirrored.Outlined.List, Icons.AutoMirrored.Filled.List),
            TabItem("attendance_calc", "Calculations", Icons.Outlined.Calculate, Icons.Filled.Calculate),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Site Survey Engineer" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_surveys", "Surveys", Icons.AutoMirrored.Outlined.Assignment, Icons.AutoMirrored.Filled.Assignment),
            TabItem("tasks_photos", "Photos", Icons.Outlined.PhotoCamera, Icons.Filled.PhotoCamera),
            TabItem("team_equip", "Equipment", Icons.Outlined.Settings, Icons.Filled.Settings),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Electrical Engineer" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_elec", "Designs", Icons.Outlined.ElectricBolt, Icons.Filled.ElectricBolt),
            TabItem("tasks_insp", "Inspections", Icons.Outlined.Search, Icons.Filled.Search),
            TabItem("attendance_calc", "Calculations", Icons.Outlined.Calculate, Icons.Filled.Calculate),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "O&M Technician" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks_maint", "Maintenance", Icons.Outlined.Build, Icons.Filled.Build),
            TabItem("tasks_amc", "AMC", Icons.Outlined.Build, Icons.Filled.Build),
            TabItem("team_mon", "Monitoring", Icons.Outlined.Info, Icons.Filled.Info),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        "Intern" -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks", "Tasks", Icons.AutoMirrored.Outlined.Assignment, Icons.AutoMirrored.Filled.Assignment),
            TabItem("attendance", "Attendance", Icons.Outlined.PinDrop, Icons.Filled.PinDrop),
            TabItem("commits", "Commits", Icons.Outlined.EditNote, Icons.Filled.EditNote),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
        else -> listOf(
            TabItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home),
            TabItem("tasks", "Tasks", Icons.AutoMirrored.Outlined.Assignment, Icons.AutoMirrored.Filled.Assignment),
            TabItem("team_tools", "Tools", Icons.Outlined.Build, Icons.Filled.Build),
            TabItem("settings", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
        )
    }
}

private data class StatItem(
    val icon: ImageVector,
    val value: String,
    val label: String,
    val color: Color
)

private fun getStatsForRole(jobRole: String): List<StatItem> {
    return when (jobRole) {
        "Team Lead", "Department Head" -> listOf(
            StatItem(Icons.AutoMirrored.Filled.Assignment, "12", "Active Tasks", BrandAccent),
            StatItem(Icons.Default.Groups, "8", "Team Online", BrandSecondary),
            StatItem(Icons.Default.CheckCircle, "3", "Pending Reviews", BrandSuccess)
        )
        "Site Survey Engineer", "Solar Design Engineer", "Electrical Engineer" -> listOf(
            StatItem(Icons.AutoMirrored.Filled.Assignment, "5", "Pending Surveys", BrandAccent),
            StatItem(Icons.Default.Build, "3", "Designs Due", BrandSecondary),
            StatItem(Icons.Default.CheckCircle, "96%", "Compliance", BrandSuccess)
        )
        "Monitoring Analyst" -> listOf(
            StatItem(Icons.Default.Warning, "14", "Active Alerts", BrandError),
            StatItem(Icons.Default.Info, "98.4%", "Systems Online", BrandSuccess),
            StatItem(Icons.Default.ElectricBolt, "4.8 kW", "Power Output", BrandAccent)
        )
        "O&M Technician", "Service Engineer" -> listOf(
            StatItem(Icons.Default.Build, "4", "Maintenance Jobs", BrandAccent),
            StatItem(Icons.Default.Directions, "12 km", "Distance", BrandSecondary),
            StatItem(Icons.Default.CheckCircle, "2", "Completed Today", BrandSuccess)
        )
        else -> listOf(
            StatItem(Icons.AutoMirrored.Filled.Assignment, "3", "Assigned Tasks", BrandAccent),
            StatItem(Icons.Default.CheckCircle, "100%", "Completion", BrandSuccess),
            StatItem(Icons.Default.PlayArrow, "32 hrs", "Hours Logged", BrandSecondary)
        )
    }
}

@Composable
fun OneUIHeader(
    session: EmployeeSessionEntity,
    viewModel: MainViewModel,
    onLogout: () -> Unit
) {
    var showNotifications by remember { mutableStateOf(false) }
    val isSyncing by viewModel.isSyncing.collectAsState()
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    val greeting = when (hour) {
        in 5..11 -> "Good Morning"
        in 12..16 -> "Good Afternoon"
        in 17..20 -> "Good Evening"
        else -> "Good Night"
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(BackgroundDark)
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        // Top Row: Weather & Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Weather / Date Widget (Subtle glassmorphism)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Cloud,
                        contentDescription = null,
                        tint = BrandSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "28°C · Overcast",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Right side: Sync Database, Bell & Profile
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Sync Database Action Button
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(GoogleBlue.copy(alpha = 0.2f))
                        .border(1.dp, GoogleBlue.copy(alpha = 0.4f), CircleShape)
                        .clickable(enabled = !isSyncing) { viewModel.syncAllDataFromServer() },
                    contentAlignment = Alignment.Center
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.CloudSync,
                            contentDescription = "Sync Database",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                // Notification Bell with Badge
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.08f))
                        .clickable { showNotifications = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                    // Red Dot Badge
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(top = 8.dp, end = 8.dp)
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(BrandError)
                    )
                }

                // Profile Avatar with Online Dot
                Box(
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(BrandPrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = session.name.firstOrNull()?.uppercase() ?: "?",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(BrandSuccess)
                            .border(2.dp, BackgroundDark, CircleShape)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Large One UI Header Title
        Text(
            text = "$greeting,",
            style = MaterialTheme.typography.titleLarge,
            color = MutedText,
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = session.name,
            style = MaterialTheme.typography.displaySmall,
            color = Color.White,
            fontWeight = FontWeight.Black,
            fontSize = 30.sp,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Dynamic Stats Cards Row (Horizontal Scroll)
        val stats = getStatsForRole(session.jobRole)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            stats.forEach { stat ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.width(150.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(stat.color.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = stat.icon,
                                contentDescription = null,
                                tint = stat.color,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = stat.value,
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = stat.label,
                                color = MutedText,
                                fontSize = 10.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }

    if (showNotifications) {
        AlertDialog(
            onDismissRequest = { showNotifications = false },
            confirmButton = {
                TextButton(onClick = { showNotifications = false }) {
                    Text("Close", color = BrandSecondary)
                }
            },
            title = { Text("Recent Alerts", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    listOf(
                        "New high priority task assigned by system admin.",
                        "Team member Vijay Patil checked in today.",
                        "Sync completed: 3 local submissions saved to server."
                    ).forEach { text ->
                        Row(verticalAlignment = Alignment.Top) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 4.dp, end = 8.dp)
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(BrandAccent)
                            )
                            Text(text, color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                        }
                    }
                }
            },
            containerColor = SurfaceDarkElevated
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalAnimationApi::class)
@Composable
fun DashboardRouter(
    viewModel: MainViewModel,
    onNavigateBackToClock: () -> Unit,
    onLogout: () -> Unit
) {
    val sessionState by viewModel.session.collectAsState(initial = null)
    val context = LocalContext.current
    val db = remember { AppDatabase.getDatabase(context) }
    
    val pendingSyncItems by db.outboxQueueDao().getQueueFlow().collectAsState(initial = emptyList())
    val pendingSyncCount = pendingSyncItems.size

    val session = sessionState ?: return
    var activeTab by remember { mutableStateOf("home") }
    
    // Start polling based on role when dashboard loads
    LaunchedEffect(session.jobRole) {
        val role = session.jobRole ?: "employee"
        when (role.lowercase()) {
            "admin", "service coordinator", "sub-admin" -> {
                viewModel.startPolling(
                    com.example.swayogemployeeapp.data.sync.DataType.CUSTOMERS,
                    com.example.swayogemployeeapp.data.sync.DataType.TASKS,
                    com.example.swayogemployeeapp.data.sync.DataType.INVOICES,
                    com.example.swayogemployeeapp.data.sync.DataType.PAYMENTS
                )
            }
            "super admin" -> {
                viewModel.startPolling(
                    com.example.swayogemployeeapp.data.sync.DataType.CUSTOMERS,
                    com.example.swayogemployeeapp.data.sync.DataType.EMPLOYEES,
                    com.example.swayogemployeeapp.data.sync.DataType.INVENTORY,
                    com.example.swayogemployeeapp.data.sync.DataType.INVOICES
                )
            }
            "customer" -> {
                viewModel.startPolling(
                    com.example.swayogemployeeapp.data.sync.DataType.CUSTOMER_NOTIFICATIONS,
                    com.example.swayogemployeeapp.data.sync.DataType.CUSTOMER_TASKS
                )
            }
            else -> {
                viewModel.startPolling(
                    com.example.swayogemployeeapp.data.sync.DataType.TASKS
                )
            }
        }
    }
    
    // Cleanup polling on dispose
    DisposableEffect(Unit) {
        onDispose {
            viewModel.stopPolling(
                com.example.swayogemployeeapp.data.sync.DataType.CUSTOMERS,
                com.example.swayogemployeeapp.data.sync.DataType.TASKS,
                com.example.swayogemployeeapp.data.sync.DataType.EMPLOYEES,
                com.example.swayogemployeeapp.data.sync.DataType.INVENTORY,
                com.example.swayogemployeeapp.data.sync.DataType.INVOICES,
                com.example.swayogemployeeapp.data.sync.DataType.PAYMENTS,
                com.example.swayogemployeeapp.data.sync.DataType.CUSTOMER_NOTIFICATIONS,
                com.example.swayogemployeeapp.data.sync.DataType.CUSTOMER_TASKS
            )
        }
    }

    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            if (activeTab != "home" && !activeTab.startsWith("attendance")) {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = activeTab.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBackToClock) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    actions = {
                        UserAvatar(name = session.name) {
                            // User Profile actions
                        }
                        IconButton(onClick = onLogout) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Logout,
                                contentDescription = "Logout",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    },
                    scrollBehavior = scrollBehavior,
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        scrolledContainerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(3.dp)
                    )
                )
            }
        },
        bottomBar = {
            // Samsung One UI Floating Pill Bottom Nav Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Transparent)
                    .navigationBarsPadding()
                    .padding(start = 16.dp, end = 16.dp, bottom = 12.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = SurfaceDark.copy(alpha = 0.95f),
                    border = BorderStroke(1.dp, DividerDark),
                    shadowElevation = 8.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    NavigationBar(
                        containerColor = Color.Transparent,
                        modifier = Modifier.height(72.dp),
                        windowInsets = WindowInsets(0, 0, 0, 0)
                    ) {
                        val tabs = getTabsForRole(session.jobRole)

                        tabs.forEach { tab ->
                            val isSelected = activeTab == tab.route
                            NavigationBarItem(
                                selected = isSelected,
                                onClick = { activeTab = tab.route },
                                icon = { 
                                    Icon(
                                        imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon, 
                                        contentDescription = tab.label,
                                        modifier = Modifier.size(22.dp)
                                    ) 
                                },
                                label = { Text(tab.label, style = MaterialTheme.typography.labelSmall, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                alwaysShowLabel = true,
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.White,
                                    selectedTextColor = GoogleBlue,
                                    indicatorColor = GoogleBlue,
                                    unselectedIconColor = SecondaryTextDark,
                                    unselectedTextColor = SecondaryTextDark
                                )
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = MaterialTheme.colorScheme.background
        ) {
            Column {
                if (activeTab == "home") {
                    OneUIHeader(session = session, viewModel = viewModel, onLogout = onLogout)
                }

                // Info Chip for Sync Status (Google-style)
                if (pendingSyncCount > 0) {
                    SyncStatusHeader(count = pendingSyncCount, onSyncClick = { viewModel.syncAllDataFromServer() })
                }

                Box(modifier = Modifier.fillMaxSize()) {
                    AnimatedContent(
                        targetState = activeTab,
                        transitionSpec = {
                            fadeIn() togetherWith fadeOut()
                        },
                        label = "TabTransition"
                    ) { targetTab ->
                        when {
                            targetTab == "calendar" -> SubAdminCalendar(viewModel)
                            targetTab == "complaints" -> SubAdminComplaints(viewModel)
                            targetTab == "team_emp" -> SubAdminEmployees(viewModel)
                            targetTab == "financials" -> SubAdminFinancials(viewModel)
                            targetTab == "tasks_amc" -> AmcManagement(viewModel)
                            targetTab == "inverter" -> CoordinatorDashboard(viewModel)
                            targetTab.startsWith("tasks") -> UnifiedTasksScreen(viewModel)
                            targetTab.startsWith("team") -> EmployeesUnderMeScreen(viewModel)
                            targetTab.startsWith("commits") -> DailyCommitScreen(viewModel)
                            targetTab.startsWith("attendance") -> {
                                AttendanceScreen(
                                    viewModel = viewModel,
                                    onNavigateToDashboard = {},
                                    onLogout = onLogout
                                )
                            }
                            targetTab.startsWith("settings") -> SettingsScreen(viewModel)
                            else -> DashboardContent(session.jobRole, viewModel, onNavigateToTeam = { activeTab = "team" })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SyncStatusHeader(count: Int, onSyncClick: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AssistChip(
            onClick = onSyncClick,
            label = { Text("$count tasks pending sync (Tap to Sync)") },
            leadingIcon = {
                Icon(
                    Icons.Default.CloudSync,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            },
            colors = AssistChipDefaults.assistChipColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                labelColor = MaterialTheme.colorScheme.onSecondaryContainer
            )
        )
    }
}

@Composable
fun UserAvatar(name: String, onClick: () -> Unit) {
    val initial = name.firstOrNull()?.uppercase() ?: "?"
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = MaterialTheme.colorScheme.primaryContainer,
        modifier = Modifier
            .padding(end = 4.dp)
            .size(32.dp)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = initial,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun DashboardContent(role: String, viewModel: MainViewModel, onNavigateToTeam: () -> Unit = {}) {
    when (role) {
        "Service Coordinator" -> CoordinatorDashboard(viewModel)
        "Site Survey Engineer" -> SurveyDashboard(viewModel)
        "Solar Design Engineer" -> DesignDashboard(viewModel)
        "Electrical Engineer" -> ElectricalDashboard(viewModel)
        "Inventory Executive" -> InventoryDashboard(viewModel)
        "O&M Technician" -> MaintenanceDashboard(viewModel)
        "Service Engineer" -> ServiceDashboard(viewModel)
        "Monitoring Analyst" -> MonitoringDashboard(viewModel)
        "Intern" -> InternDashboard(viewModel, onNavigateToTeam = onNavigateToTeam)
        "Department Head" -> DepartmentHeadDashboard(viewModel)
        "Team Lead" -> TeamLeadDashboard(viewModel)
        "Other Position" -> OtherPositionDashboard(viewModel)
        else -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = "Role Dashboard Not Found\nContact Administrator",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
