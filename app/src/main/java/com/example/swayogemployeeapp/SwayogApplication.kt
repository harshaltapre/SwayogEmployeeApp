package com.example.swayogemployeeapp

import android.app.Application
import com.example.swayogemployeeapp.data.local.AppDatabase

class SwayogApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Eagerly initialize the database
        AppDatabase.getDatabase(this)
    }
}
