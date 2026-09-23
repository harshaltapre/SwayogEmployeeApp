# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Keep source file name for better crash reports
-keepattributes *Annotation*

# Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**
-dontwarn java.lang.ClassValue

# DataStore
-dontwarn androidx.datastore.**

# Jetpack Compose - Optimize for better shrinking
-keep class androidx.compose.** { *; }
-keep interface androidx.compose.** { *; }
-keep class androidx.compose.ui.tooling.** { *; }

# Firebase
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Maps
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Camera
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# Biometric
-keep class androidx.biometric.** { *; }
-dontwarn androidx.biometric.**

# TensorFlow Lite
-keep class org.tensorflow.** { *; }
-keep class org.tensorflow.lite.** { *; }
-dontwarn org.tensorflow.**

# Keep data models with specific annotations only (allow better shrinking)
-keep @com.google.gson.annotations.SerializedName class com.swayog.employee.data.model.** { *; }
-keepclassmembers class com.swayog.employee.data.model.** {
  @com.google.gson.annotations.SerializedName <fields>;
}

# Keep database entities and DAOs intact for Room DB mappings
-keep class com.swayog.employee.data.local.entity.** { *; }
-keepclassmembers class com.swayog.employee.data.local.entity.** { *; }
-keep class com.swayog.employee.data.local.dao.** { *; }
-keepclassmembers class com.swayog.employee.data.local.dao.** { *; }
-keep @androidx.room.Entity class * { *; }
-keepclassmembers @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }
-keepclassmembers @androidx.room.Dao interface * { *; }

# Keep AppUpdate models and deserializers intact
-keep class com.swayog.employee.data.model.AppUpdateManifest { *; }
-keepclassmembers class com.swayog.employee.data.model.AppUpdateManifest { *; }
-keep class com.swayog.employee.data.model.ReleaseNotesDeserializer { *; }
-keep class com.swayog.employee.data.model.AppUpdateState { *; }

# Prevent R8 from removing entity getters/setters/constructors
-keepclassmembers class * extends androidx.room.RoomDatabase { *; }
-keepclassmembers class * {
    @androidx.room.* <methods>;
}

# Keep centralized AppConfig class intact for R8 / ProGuard release builds
-keep class com.swayog.employee.core.config.AppConfig { *; }
-keepclassmembers class com.swayog.employee.core.config.AppConfig { *; }

-allowaccessmodification
