import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
    id("androidx.room")
}

room {
    schemaDirectory("$projectDir/schemas")
}

val localProperties = Properties().apply {
    val rootFile = rootProject.file("local.properties")
    if (rootFile.exists()) {
        rootFile.inputStream().use { this.load(it) }
    }
    val projectFile = project.file("local.properties")
    if (projectFile.exists()) {
        projectFile.inputStream().use { this.load(it) }
    }
}

fun getLocalProperty(key: String, defaultValue: String): String {
    return (project.findProperty(key) as? String)
        ?: System.getenv(key)
        ?: localProperties.getProperty(key)
        ?: defaultValue
}

// ---------------------------------------------------------------------------
// RELEASE SIGNING CONFIGURATION
// ---------------------------------------------------------------------------
// To generate a release keystore (one-time setup), run:
//
//   keytool -genkey -v -keystore my-release-key.jks \
//     -keyalg RSA -keysize 2048 -validity 10000 \
//     -alias my-key-alias
//
// Then set the following in local.properties (never commit this file):
//
//   RELEASE_STORE_FILE=<absolute path to my-release-key.jks>
//   RELEASE_KEY_ALIAS=my-key-alias
//   RELEASE_STORE_PASSWORD=<your keystore password>
//   RELEASE_KEY_PASSWORD=<your key password>
//
// On CI, set these as environment variables instead.
// ---------------------------------------------------------------------------

android {
    namespace = "com.swayog.employee"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.swayog.employee"
        minSdk = 26
        targetSdk = 34
        versionCode = (project.findProperty("versionCode") as? String)?.toIntOrNull()
            ?: (localProperties.getProperty("versionCode"))?.toIntOrNull()
            ?: 21 // Version 21 > Production Baseline 20
        versionName = (project.findProperty("versionName") as? String)
            ?: (localProperties.getProperty("versionName"))
            ?: "1.0.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        vectorDrawables {
            useSupportLibrary = true
        }

        // BuildConfig fields for API configuration
        buildConfigField("String", "API_BASE_URL", "\"${getLocalProperty("API_BASE_URL", "https://swayog-dashboard.vercel.app/api/v1/")}\"")
        buildConfigField("String", "WS_BASE_URL", "\"${getLocalProperty("WS_BASE_URL", "wss://swayog-dashboard.vercel.app")}\"")
        val rawDistUrl = getLocalProperty("PUBLIC_DISTRIBUTION_URL", "https://swayog-dashboard.vercel.app")
        val safeDistUrl = if (rawDistUrl.contains(".r2.cloudflarestorage.com") || rawDistUrl.contains("your-public-domain.com") || rawDistUrl.isBlank()) {
            "https://swayog-dashboard.vercel.app"
        } else {
            rawDistUrl
        }
        buildConfigField("String", "PUBLIC_DISTRIBUTION_URL", "\"$safeDistUrl\"")

        // Memory optimization settings
        ndk {
            abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a"))
        }
    }

    signingConfigs {
        // Debug signing — generated automatically by Android Studio.
        // getByName("debug") is available by default.

        // Release signing — credentials come from local.properties, project properties, environment variables, or workspace release-key.jks.
        create("release") {
            var keystoreFile: java.io.File? = null
            val explicitPath = getLocalProperty("RELEASE_STORE_FILE", System.getenv("RELEASE_STORE_FILE") ?: "")
            if (explicitPath.isNotBlank()) {
                val f1 = file(explicitPath)
                val f2 = rootProject.file(explicitPath)
                if (f1.exists()) {
                    keystoreFile = f1
                } else if (f2.exists()) {
                    keystoreFile = f2
                }
            }

            // Auto-detect release-key.jks if not found yet
            if (keystoreFile == null || !keystoreFile.exists()) {
                val repoRootKeystore = rootProject.file("../release-key.jks")
                val projectKeystore = rootProject.file("release-key.jks")
                val appKeystore = file("release-key.jks")
                if (repoRootKeystore.exists()) {
                    keystoreFile = repoRootKeystore
                } else if (projectKeystore.exists()) {
                    keystoreFile = projectKeystore
                } else if (appKeystore.exists()) {
                    keystoreFile = appKeystore
                }
            }

            val keyAliasStr = (System.getenv("RELEASE_KEY_ALIAS")
                ?: getLocalProperty("RELEASE_KEY_ALIAS", "")).trim()
            val storePassStr = (System.getenv("RELEASE_STORE_PASSWORD")
                ?: getLocalProperty("RELEASE_STORE_PASSWORD", "")).trim()
            var keyPassStr = (System.getenv("RELEASE_KEY_PASSWORD")
                ?: getLocalProperty("RELEASE_KEY_PASSWORD", "")).trim()
            if (keyPassStr.isBlank() && storePassStr.isNotBlank()) {
                keyPassStr = storePassStr
            }
            val rawStoreType = (System.getenv("RELEASE_STORE_TYPE")
                ?: getLocalProperty("RELEASE_STORE_TYPE", "")).trim()

            val isReleaseBuildRequested = gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }
            val isCI = System.getenv("CI") == "true"

            if (keystoreFile != null && keystoreFile.exists()) {
                val header = keystoreFile.inputStream().use { stream ->
                    val buf = ByteArray(4)
                    val read = stream.read(buf)
                    if (read >= 4) buf else byteArrayOf()
                }
                // JKS magic is 0xFEEDFEED (0xFE, 0xED, 0xFE, 0xED); PKCS12 starts with ASN.1 Sequence (0x30, 0x82)
                val isJksMagic = header.size >= 4 &&
                    header[0] == 0xFE.toByte() && header[1] == 0xED.toByte() &&
                    header[2] == 0xFE.toByte() && header[3] == 0xED.toByte()
                val resolvedStoreType = if (isJksMagic || (rawStoreType.equals("JKS", ignoreCase = true) && isJksMagic)) "JKS" else "PKCS12"

                if (keyAliasStr.isNotBlank() && storePassStr.isNotBlank() && keyPassStr.isNotBlank()) {
                    storeFile = keystoreFile
                    storeType = resolvedStoreType
                    this.keyAlias = keyAliasStr
                    storePassword = storePassStr
                    keyPassword = keyPassStr
                    println("Release signing configured with keystore: ${keystoreFile.canonicalPath} (format: $resolvedStoreType)")
                } else if (isCI || isReleaseBuildRequested) {
                    throw GradleException("Release signing credentials are incomplete. Configure RELEASE_KEY_ALIAS, RELEASE_STORE_PASSWORD, and RELEASE_KEY_PASSWORD.")
                } else {
                    println("ℹ️  Release keystore found, but credentials are not set in environment or local.properties. Release signing will be required for assembleRelease.")
                }
            } else {
                if (isCI || isReleaseBuildRequested) {
                    throw GradleException("RELEASE_STORE_FILE must be configured for production releases.")
                } else {
                    println("⚠️  WARNING: Production keystore file not found (checked: '$explicitPath', repo root, project root).")
                }
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            
            val releaseConfig = signingConfigs.getByName("release")
            if (releaseConfig.storeFile != null && releaseConfig.storeFile!!.exists() && !releaseConfig.keyAlias.isNullOrBlank()) {
                signingConfig = releaseConfig
            } else if (System.getenv("CI") == "true" || gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }) {
                throw GradleException(
                    "Cannot build release APK: Production release keystore was not found or credentials incomplete. " +
                    "Debug fallback is prohibited to prevent package conflict errors during app updates. " +
                    "Please configure RELEASE_STORE_FILE in local.properties or provide release-key.jks in the repository root."
                )
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "API_BASE_URL", "\"${getLocalProperty("API_BASE_URL", "https://swayog-dashboard.vercel.app/api/v1/")}\"")
            buildConfigField("String", "WS_BASE_URL", "\"${getLocalProperty("WS_BASE_URL", "wss://swayog-dashboard.vercel.app")}\"")
            
            // Memory optimization for release builds
            isJniDebuggable = false
        }
        debug {
            isDebuggable = true
            buildConfigField("String", "API_BASE_URL", "\"${getLocalProperty("API_BASE_URL", "https://swayog-dashboard.vercel.app/api/v1/")}\"")
            buildConfigField("String", "WS_BASE_URL", "\"${getLocalProperty("WS_BASE_URL", "wss://swayog-dashboard.vercel.app")}\"")
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = freeCompilerArgs + listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=androidx.compose.ui.ExperimentalComposeUiApi",
            "-opt-in=androidx.compose.foundation.ExperimentalFoundationApi",
            "-opt-in=com.google.accompanist.permissions.ExperimentalPermissionsApi"
        )
    }
    
    buildFeatures {
        compose = true
        buildConfig = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
    
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    testOptions {
        unitTests {
            isReturnDefaultValues = true
            isIncludeAndroidResources = true
        }
    }
}

hilt {
    enableAggregatingTask = true
}

ksp {
    arg("room.incremental", "false")
    arg("hilt.correctErrorTypes", "true")
    arg("hilt.incremental", "false")
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.1")
    
    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.04.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")
    
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.6.2")
    
    // Hilt
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-android-compiler:2.52")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Local Storage
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    
    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // Maps & Location
    implementation("com.google.android.gms:play-services-maps:18.2.0")
    implementation("com.google.android.gms:play-services-location:21.0.1")
    implementation("com.google.maps.android:maps-compose:4.3.0")
    implementation("com.google.maps.android:maps-compose-utils:4.3.0")
    
    // Camera
    implementation("androidx.camera:camera-core:1.4.1")
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
    implementation("androidx.camera:camera-view:1.4.1")
    
    // ML Kit & TensorFlow Lite for Face Recognition
    implementation("com.google.mlkit:face-detection:16.1.7")
    implementation("org.tensorflow:tensorflow-lite:2.16.1")
    implementation("org.tensorflow:tensorflow-lite-support:0.4.4")
    
    // Biometrics
    implementation("androidx.biometric:biometric:1.1.0")
    
    // Permissions
    implementation("com.google.accompanist:accompanist-permissions:0.32.0")
    
    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("androidx.hilt:hilt-work:1.2.0")
    ksp("androidx.hilt:hilt-compiler:1.2.0")
    
    
    // Charts
    implementation("com.github.PhilJay:MPAndroidChart:3.1.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.04.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

afterEvaluate {
    tasks.withType<Test>().configureEach {
        val runtimeJar = layout.buildDirectory.file("intermediates/runtime_app_classes_jar/debug/bundleDebugClassesToRuntimeJar/classes.jar")
        val compileJar = layout.buildDirectory.file("intermediates/compile_app_classes_jar/debug/bundleDebugClassesToCompileJar/classes.jar")
        val debugKotlinDir = layout.buildDirectory.dir("tmp/kotlin-classes/debug")
        classpath = classpath + files(runtimeJar, compileJar, debugKotlinDir)
    }
}

// Clean task to force Room code regeneration
tasks.register("cleanRoom") {
    doLast {
        delete(file("${project.projectDir}/build/generated"))
        delete(file("${project.projectDir}/app/build/generated"))
    }
}




