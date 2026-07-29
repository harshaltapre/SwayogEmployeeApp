package com.swayog.employee.presentation.common.utils

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint

object WatermarkHelper {

    fun addWatermark(
        originalBitmap: Bitmap,
        latitude: Double?,
        longitude: Double?,
        address: String,
        customerName: String,
        taskId: String,
        timestamp: String
    ): Bitmap {
        // Optimize memory footprint: Scale down high-res camera bitmap to max 1280px dimension
        val maxDimension = 1280
        val (scaledWidth, scaledHeight) = if (originalBitmap.width > maxDimension || originalBitmap.height > maxDimension) {
            if (originalBitmap.width >= originalBitmap.height) {
                maxDimension to (maxDimension * originalBitmap.height / originalBitmap.width)
            } else {
                (maxDimension * originalBitmap.width / originalBitmap.height) to maxDimension
            }
        } else {
            originalBitmap.width to originalBitmap.height
        }

        val bitmapToWatermark = if (scaledWidth != originalBitmap.width || scaledHeight != originalBitmap.height) {
            Bitmap.createScaledBitmap(originalBitmap, scaledWidth, scaledHeight, true)
        } else {
            originalBitmap
        }

        val result = bitmapToWatermark.copy(Bitmap.Config.ARGB_8888, true)
        if (bitmapToWatermark != originalBitmap) {
            bitmapToWatermark.recycle()
        }

        val canvas = Canvas(result)

        val padding = result.width * 0.03f
        val overlayHeight = result.height * 0.25f // Bottom 25% of image
        
        // Background rectangle
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#99000000") // 60% opacity black
        }
        val overlayRect = RectF(
            0f,
            result.height - overlayHeight,
            result.width.toFloat(),
            result.height.toFloat()
        )
        canvas.drawRect(overlayRect, bgPaint)

        // Text Paint
        val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = result.width * 0.025f // Adjust text size
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            setShadowLayer(3f, 1f, 1f, Color.BLACK)
        }
        val boldPaint = TextPaint(textPaint).apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val smallTextPaint = TextPaint(textPaint).apply {
            textSize = result.width * 0.02f
            color = Color.parseColor("#DDDDDD")
        }

        // Draw Map Pin Placeholder
        val mapBoxSize = overlayHeight - (padding * 2)
        val mapBoxRect = RectF(
            padding,
            result.height - overlayHeight + padding,
            padding + mapBoxSize,
            result.height - padding
        )
        val mapBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#444444")
        }
        canvas.drawRect(mapBoxRect, mapBgPaint)
        
        // Draw Pin Icon (Simple red triangle/circle approximation)
        val pinPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.RED }
        val cx = mapBoxRect.centerX()
        val cy = mapBoxRect.centerY() - (mapBoxSize * 0.1f)
        val radius = mapBoxSize * 0.15f
        canvas.drawCircle(cx, cy, radius, pinPaint)
        
        val path = android.graphics.Path()
        path.moveTo(cx - radius, cy)
        path.lineTo(cx + radius, cy)
        path.lineTo(cx, cy + (radius * 2f))
        path.close()
        canvas.drawPath(path, pinPaint)
        
        val pinInnerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
        canvas.drawCircle(cx, cy, radius * 0.4f, pinInnerPaint)

        // Text Content
        val textStartX = mapBoxRect.right + padding
        var currentY = result.height - overlayHeight + padding + textPaint.textSize

        // Customer & Task
        canvas.drawText("Customer: $customerName | Task ID: $taskId", textStartX, currentY, boldPaint)
        currentY += textPaint.textSize * 1.5f

        // Address (Wrapped)
        val maxTextWidth = (result.width - textStartX - padding).toInt()
        val addressLayout = StaticLayout.Builder.obtain(address, 0, address.length, textPaint, maxTextWidth)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1f)
            .setIncludePad(false)
            .build()

        canvas.save()
        canvas.translate(textStartX, currentY - textPaint.textSize)
        addressLayout.draw(canvas)
        canvas.restore()
        
        currentY += (addressLayout.height) + (textPaint.textSize * 0.5f)

        // Lat/Lng
        val locText = if (latitude != null && longitude != null) {
            "Lat: %.6f, Lng: %.6f".format(latitude, longitude)
        } else {
            "Location: Unavailable"
        }
        canvas.drawText(locText, textStartX, currentY, textPaint)
        currentY += textPaint.textSize * 1.5f

        // Timestamp
        canvas.drawText(timestamp, textStartX, currentY, textPaint)
        currentY += smallTextPaint.textSize * 1.5f

        // Branding
        canvas.drawText("Captured by Swayog Field App", textStartX, currentY, smallTextPaint)

        return result
    }
}
