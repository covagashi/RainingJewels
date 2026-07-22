plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.covaga.jewelrain"
    // Compile against Android 16 (API 36) — required by Google Play from Aug 31, 2026
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    signingConfigs {
        create("release") {
            keyAlias = "upload"
            keyPassword = "android"
            storeFile = file("upload-keystore.jks")
            storePassword = "android"
        }
    }

    defaultConfig {
        applicationId = "com.covaga.jewelrain"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = 36  // Android 16 — Google Play target API requirement (Aug 2026)
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

dependencies {
    // Required for edge-to-edge support on Android 15+
    implementation("androidx.core:core-ktx:1.16.0")
}

flutter {
    source = "../.."
}
