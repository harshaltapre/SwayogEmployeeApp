package com.example.swayogemployeeapp.data.sync

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner

/**
 * Observer for app lifecycle events to manage polling and sync behavior
 * Mirrors the web dashboard's visibility-based polling
 */
class AppLifecycleObserver(
    private val onForeground: () -> Unit,
    private val onBackground: () -> Unit
) : DefaultLifecycleObserver {
    
    override fun onResume(owner: LifecycleOwner) {
        onForeground()
    }
    
    override fun onPause(owner: LifecycleOwner) {
        onBackground()
    }
}
