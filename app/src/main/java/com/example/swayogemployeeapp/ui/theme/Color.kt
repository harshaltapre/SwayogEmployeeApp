package com.example.swayogemployeeapp.ui.theme

import androidx.compose.ui.graphics.Color

// ── Google Material Design 3 Color Palette ──

// Brand Colors (Accents)
val GoogleBlue = Color(0xFF4285F4)          // Primary actions, text links, active tabs
val GoogleRed = Color(0xFFEA4335)           // Destructive actions, errors, notifications
val GoogleYellow = Color(0xFFFBBC05)        // Warnings, stars/favorites, secondary accents
val GoogleGreen = Color(0xFF34A853)         // Success states, secure indicators, confirm buttons

// Light Mode Theme (Default)
val BackgroundLight = Color(0xFFFFFFFF)     // Main application background
val SurfaceLight = Color(0xFFF8F9FA)         // Cards, sidebars, navigation drawers
val SurfaceVariantLight = Color(0xFFE8EAED) // Hover states, secondary containers
val PrimaryTextLight = Color(0xFF202124)    // Main headings and body text
val SecondaryTextLight = Color(0xFF5F6368) // Subtitles, helper text, inactive icons
val DividerLight = Color(0xFFDADCE0)        // Borders, outlines, horizontal rules

// Dark Mode Theme
val BackgroundDark = Color(0xFF202124)      // Main application background
val SurfaceDark = Color(0xFF292A2D)         // Cards, sidebars, navigation drawers
val SurfaceVariantDark = Color(0xFF3C4043)  // Hover states, secondary containers
val PrimaryTextDark = Color(0xFFE8EAED)     // Main headings and body text
val SecondaryTextDark = Color(0xFF9AA0A6)   // Subtitles, helper text, inactive icons
val DividerDark = Color(0xFF5F6368)          // Borders, outlines, horizontal rules

// Backward compatibility mappings to preserve screen compiles and ensure readable contrast
val BrandPrimary = GoogleBlue               // Primary brand color (#4285F4)
val BrandSecondary = GoogleBlue            // Secondary brand color (#4285F4)
val BrandAccent = GoogleBlue               // Accent/CTA color (Google Blue pill buttons)
val BrandSuccess = GoogleGreen             // Success state (#34A853)
val BrandWarning = GoogleYellow            // Warning state (#FBBC05)
val BrandError = GoogleRed                 // Error state (#EA4335)
val PrimaryAmber = GoogleYellow            // Clean-Tech Amber / Gold accent
val EngineeringBlue = GoogleBlue           // Electric Blue technical
val SuccessGreen = GoogleGreen             // Success Green
val NeutralText = PrimaryTextDark          // Primary readable text (#E8EAED)
val MutedText = SecondaryTextDark          // Secondary readable text (#9AA0A6)
val BorderGray = DividerDark               // Dividers and outlines (#5F6368)
val CardHeaderDark = SurfaceDark           // Card header background (#292A2D)
val SurfaceDarkElevated = SurfaceVariantDark // Elevated surface colors (#3C4043)