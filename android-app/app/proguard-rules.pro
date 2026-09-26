# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Keep all annotations (required by Gson, Hilt, Retrofit, Room, etc.)
-keepattributes *Annotation*

# ===========================================================================
# ROOT CAUSE FIX: Retrofit + R8 Full Mode — Generic Type Signature Erasure
# ===========================================================================
# AGP 8.0+ enables R8 "full mode" by default. In full mode, R8 strips generic
# type Signature attributes from class files unless explicitly preserved.
# Retrofit uses reflection (method.getGenericReturnType()) to resolve the
# parameterized response type (e.g. Response<ApiResponse<AuthResponse>>).
# When R8 strips the Signature attribute from ApiService methods, the runtime
# type is a raw Class instead of a ParameterizedType, causing:
#   java.lang.Class cannot be cast to java.lang.reflect.ParameterizedType
# This is the exact crash seen in the GitHub Actions release build but NOT
# in the Android Studio debug build (debug builds skip R8 entirely).
#
# The fix: keep Signature attributes on ALL classes. This is the minimal
# correct fix recommended by the Retrofit and Gson documentation for R8.
-keepattributes Signature

# Also required: InnerClasses + EnclosingMethod so R8 correctly resolves
# anonymous/inner class types used in Gson TypeToken and Retrofit internals.
-keepattributes InnerClasses,EnclosingMethod

# ===========================================================================

# Retrofit — keep the library and the application service interface.
# ApiService uses Retrofit.create() proxy generation which requires the interface
# to be kept at runtime. The generic return types (Response<ApiResponse<T>>) are
# protected by -keepattributes Signature at the top of this file.
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keep interface com.swayog.employee.data.api.** { *; }
-keepattributes Exceptions

# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Gson — keep the library and all model classes used for JSON deserialization.
# Gson uses reflection to read field names at runtime. R8 will rename or remove
# fields that are not annotated with @Keep unless they are explicitly preserved.
# Note: -keepattributes Signature at the top ensures TypeToken generics survive.
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

# Data models — keep ALL model classes and their fields intact.
# These classes are deserialized by Gson via reflection. R8 renames or removes
# fields not otherwise referenced, breaking JSON parsing at runtime.
#
# NOTE: The previous rule was:
#   -keep @com.google.gson.annotations.SerializedName class com.swayog.employee.data.model.** { *; }
# This is WRONG because @SerializedName is placed on FIELDS, not on the class
# declaration itself. None of the model classes carry @SerializedName at the
# class level, so the selector matched zero classes — all models were renamed.
-keep class com.swayog.employee.data.model.** { *; }

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
