package com.swayog.employee.presentation.common.utils

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object WatermarkHelper {

    fun addWatermark(
        bitmap: Bitmap,
        latitude: Double?,
        longitude: Double?
    ): Bitmap {
        val result = bitmap.copy(bitmap.config, true)
        val canvas = Canvas(result)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = result.width * 0.05f // Dynamic text size based on image width
            setShadowLayer(4f, 2f, 2f, Color.BLACK)
        }

        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#80000000") // Semi-transparent black
        }

        val timeFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val timestamp = timeFormat.format(Date())
        
        val locationText = if (latitude != null && longitude != null) {
            "Lat: %.4f, Lng: %.4f".format(latitude, longitude)
        } else {
            "Location: Unavailable"
        }

        val padding = 20f
        val textHeight = paint.fontMetrics.bottom - paint.fontMetrics.top
        
        val yTime = result.height - padding - textHeight
        val yLocation = result.height - padding
        
        // Draw background rectangle for better visibility
        canvas.drawRect(
            0f,
            result.height - (textHeight * 2.5f) - padding,
            result.width.toFloat(),
            result.height.toFloat(),
            bgPaint
        )

        canvas.drawText(timestamp, padding, yTime, paint)
        canvas.drawText(locationText, padding, yLocation, paint)

        return result
    }
}
