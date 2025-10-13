package com.covaga.jewelrain

import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable edge-to-edge display for Android 15+ compatibility
        // Using WindowCompat which is compatible with FlutterActivity
        WindowCompat.setDecorFitsSystemWindows(window, false)
    }

    override fun onDestroy() {
        super.onDestroy()
        // The Flutter engine will handle audio cleanup through the Flutter lifecycle
    }

    override fun onStop() {
        super.onStop()
        // App is no longer visible to user, Flutter lifecycle will handle audio
    }
}