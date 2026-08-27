package com.swayog.employee.presentation.profile

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.SubcomposeAsyncImage
import com.swayog.employee.presentation.common.components.*
import com.swayog.employee.presentation.common.utils.ImageUtils

@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val user by viewModel.currentUser.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()
    val profilePhotoUrl by viewModel.profilePhotoUrl.collectAsState()
    val profilePhotoCacheKey by viewModel.profilePhotoCacheKey.collectAsState()
    val uploadingPhoto by viewModel.uploadingPhoto.collectAsState()
    val uploadError by viewModel.uploadError.collectAsState()

    var showPhotoPickerChoice by remember { mutableStateOf(false) }

    LaunchedEffect(uploadError) {
        if (uploadError != null) {
            Toast.makeText(context, uploadError, Toast.LENGTH_SHORT).show()
            viewModel.clearUploadError()
        }
    }

    val processBitmapAndUpload = { bitmap: Bitmap ->
        try {
            val scaled = Bitmap.createScaledBitmap(bitmap, 480, 480, true)
            val tempFile = java.io.File(context.cacheDir, "profile_upload_${System.currentTimeMillis()}.jpg")
            java.io.FileOutputStream(tempFile).use { out ->
                scaled.compress(Bitmap.CompressFormat.JPEG, 85, out)
            }
            android.util.Log.d("PROFILE_UPLOAD", "Image file saved to: ${tempFile.absolutePath}, size: ${tempFile.length()} bytes")
            viewModel.uploadProfilePhotoFile(tempFile)
        } catch (e: Exception) {
            android.util.Log.e("PROFILE_UPLOAD", "Error saving bitmap for upload: ${e.message}", e)
            Toast.makeText(context, "Error saving photo for upload: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
        }
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        bitmap?.let { processBitmapAndUpload(it) }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            try {
                cameraLauncher.launch()
            } catch (e: Exception) {
                Toast.makeText(context, "Failed to launch camera: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context, "Camera permission is required to take a photo", Toast.LENGTH_SHORT).show()
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                context.contentResolver.openInputStream(it)?.use { stream ->
                    BitmapFactory.decodeStream(stream, null, options)
                }

                var inSampleSize = 1
                val reqWidth = 480
                val reqHeight = 480
                val height = options.outHeight
                val width = options.outWidth
                if (height > reqHeight || width > reqWidth) {
                    val halfHeight = height / 2
                    val halfWidth = width / 2
                    while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
                        inSampleSize *= 2
                    }
                }

                options.inSampleSize = inSampleSize
                options.inJustDecodeBounds = false
                context.contentResolver.openInputStream(it)?.use { stream ->
                    val bitmap = BitmapFactory.decodeStream(stream, null, options)
                    if (bitmap != null) {
                        processBitmapAndUpload(bitmap)
                    } else {
                        Toast.makeText(context, "Failed to read image", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error loading image: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    if (showPhotoPickerChoice) {
        AlertDialog(
            onDismissRequest = { showPhotoPickerChoice = false },
            title = { Text("Update Profile Photo") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("Choose an option to update your photo:")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Button(onClick = {
                            showPhotoPickerChoice = false
                            cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
                        }) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Camera")
                        }
                        Button(onClick = {
                            showPhotoPickerChoice = false
                            galleryLauncher.launch("image/*")
                        }) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Gallery")
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showPhotoPickerChoice = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            SwayogTopBar(
                title = "Profile",
                showBackButton = true,
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (user == null) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                val currentUser = user
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Profile Header
                    SwayogCard {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            val activePhotoUrl = profilePhotoUrl ?: currentUser?.profilePhotoUrl
                            val imageRequest = ImageUtils.rememberImageRequest(
                                context = context,
                                photoUrl = activePhotoUrl,
                                serverUrl = serverUrl,
                                cacheKey = profilePhotoCacheKey
                            )

                            val initials = currentUser?.fullName?.split(" ")
                                ?.mapNotNull { it.firstOrNull()?.toString() }
                                ?.take(2)
                                ?.joinToString("")?.uppercase() ?: "EM"

                            Box(
                                modifier = Modifier
                                    .size(100.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primaryContainer)
                                    .clickable { showPhotoPickerChoice = true },
                                contentAlignment = Alignment.Center
                            ) {
                                if (imageRequest != null) {
                                    SubcomposeAsyncImage(
                                        model = imageRequest,
                                        contentDescription = "Profile Photo",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop,
                                        loading = {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(32.dp),
                                                color = MaterialTheme.colorScheme.primary,
                                                strokeWidth = 2.dp
                                            )
                                        },
                                        error = {
                                            Text(
                                                text = initials,
                                                style = MaterialTheme.typography.headlineMedium,
                                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    )
                                } else {
                                    Text(
                                        text = initials,
                                        style = MaterialTheme.typography.headlineMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                // Edit overlay icon
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Edit,
                                        contentDescription = "Edit Photo",
                                        tint = MaterialTheme.colorScheme.onPrimary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                if (uploadingPhoto) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(36.dp),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = currentUser?.fullName ?: "Employee Name",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = currentUser?.jobRole ?: currentUser?.designationTitle ?: "Field Engineer",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Text(
                                text = currentUser?.loginId ?: "EMP-XXXXX",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            )
                        }
                    }
                    
                    // Profile Details
                    SwayogCard {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            ProfileItem(
                                icon = Icons.Default.Email,
                                label = "Email",
                                value = currentUser?.email ?: "Not Provided"
                            )
                            ProfileItem(
                                icon = Icons.Default.Phone,
                                label = "Phone",
                                value = currentUser?.phoneNumber ?: "Not Provided"
                            )
                            ProfileItem(
                                icon = Icons.Default.LocationOn,
                                label = "Zone",
                                value = currentUser?.zone ?: "Unassigned"
                            )
                            ProfileItem(
                                icon = Icons.Default.Badge,
                                label = "Role Code",
                                value = currentUser?.role ?: "EMPLOYEE"
                            )
                        }
                    }
                    
                    // Actions
                    SwayogCard {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            SwayogButton(
                                text = "Refresh Details",
                                onClick = { viewModel.loadProfile() },
                                variant = ButtonVariant.Secondary
                            )
                        }
                    }
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
