# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

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

# Jetpack Compose
-keep class androidx.compose.** { *; }
-keep interface androidx.compose.** { *; }

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

# Keep data models intact for serialization/deserialization
-keep class com.swayog.employee.data.model.** { *; }

# Keep database entities and DAOs intact for Room DB mappings
-keep class com.swayog.employee.data.local.entity.** { *; }
-keep class com.swayog.employee.data.local.dao.** { *; }
