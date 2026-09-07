package com.swayog.employee.presentation.subadmin.components

import android.annotation.SuppressLint
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.swayog.employee.presentation.subadmin.MapPinType
import org.json.JSONArray
import org.json.JSONObject

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebChromeClient
import android.webkit.ConsoleMessage

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun InteractiveMapView(
    pins: List<MapPinType>,
    onPinClick: (id: String, type: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var isMapLoaded by remember { mutableStateOf(false) }

    fun sendPinsToWeb(wv: WebView, pinList: List<MapPinType>) {
        val jsonArray = JSONArray()
        pinList.forEach { pin ->
            val obj = JSONObject()
            when (pin) {
                is MapPinType.Amc -> {
                    obj.put("id", pin.customer.id.toString())
                    obj.put("type", "amc")
                    obj.put("title", pin.customer.fullName)
                    obj.put("city", pin.customer.city ?: "Maharashtra")
                    obj.put("systemCapacity", "${pin.customer.systemSizeKw ?: 0.0} kW")
                    obj.put("subtitle", "${pin.customer.city ?: "Maharashtra"} · ${pin.customer.systemSizeKw ?: 0.0} kW")
                    obj.put("lat", pin.position.latitude)
                    obj.put("lng", pin.position.longitude)
                }
                is MapPinType.Complaint -> {
                    obj.put("id", pin.request.id.toString())
                    obj.put("type", "complaint")
                    obj.put("title", pin.request.title)
                    obj.put("subtitle", pin.request.customerName ?: pin.request.customerCity ?: "Complaint")
                    obj.put("city", pin.request.customerCity ?: pin.request.customerName ?: "Maharashtra")
                    obj.put("problemDesc", pin.request.description)
                    obj.put("status", pin.request.status)
                    obj.put("priority", "Normal")
                    obj.put("lat", pin.position.latitude)
                    obj.put("lng", pin.position.longitude)
                }
            }
            jsonArray.put(obj)
        }
        val jsonString = jsonArray.toString()
        android.util.Log.d("InteractiveMapView", "sendPinsToWeb: sending ${pinList.size} pins to WebView")
        val base64 = android.util.Base64.encodeToString(jsonString.toByteArray(Charsets.UTF_8), android.util.Base64.NO_WRAP)
        val script = "if (window.updateMapPins) { try { window.updateMapPins(JSON.parse(decodeURIComponent(escape(atob('$base64'))))); } catch(e) { console.error('Bridge error', e); } }"
        wv.post {
            wv.evaluateJavascript(script, null)
        }
    }

    val context = androidx.compose.ui.platform.LocalContext.current

    val currentPins by androidx.compose.runtime.rememberUpdatedState(pins)

    LaunchedEffect(pins, isMapLoaded) {
        val wv = webViewRef
        if (wv != null && isMapLoaded && pins.isNotEmpty()) {
            sendPinsToWeb(wv, pins)
        }
    }

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(android.graphics.Color.WHITE)
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                @Suppress("DEPRECATION")
                settings.allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                settings.allowUniversalAccessFromFileURLs = true
                settings.cacheMode = WebSettings.LOAD_DEFAULT

                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(msg: ConsoleMessage?): Boolean {
                        android.util.Log.d("InteractiveMapView", "${msg?.message()} [${msg?.sourceId()}:${msg?.lineNumber()}]")
                        return true
                    }
                }

                addJavascriptInterface(object {
                    @JavascriptInterface
                    fun onPinClick(id: String, type: String) {
                        post {
                            onPinClick(id, type)
                        }
                    }

                    @JavascriptInterface
                    fun onMapReady() {
                        post {
                            isMapLoaded = true
                            if (currentPins.isNotEmpty()) {
                                webViewRef?.let { sendPinsToWeb(it, currentPins) }
                            }
                        }
                    }
                }, "AndroidBridge")

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        android.util.Log.d("InteractiveMapView", "onPageFinished: $url")
                        isMapLoaded = true
                        if (currentPins.isNotEmpty()) {
                            view?.let { sendPinsToWeb(it, currentPins) }
                        }
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: android.webkit.WebResourceError?
                    ) {
                        android.util.Log.e("InteractiveMapView", "WebView error: ${error?.description} on ${request?.url}")
                    }
                }

                loadUrl("file:///android_asset/leaflet/map.html")
                webViewRef = this
            }
        },
        update = { wv ->
            if (isMapLoaded && pins.isNotEmpty()) {
                sendPinsToWeb(wv, pins)
            }
        },
        modifier = modifier
    )
}
