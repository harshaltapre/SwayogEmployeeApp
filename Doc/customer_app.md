# SWAYOG Customer Mobile Application
## Technical Specification, Database Schemas & UI/UX Blueprint

This document defines the complete architecture, data schemas, user interface specifications, and backend synchronization flows for the **SWAYOG Customer Mobile Application**. This specification is formatted to be directly readable by AI coding assistants (e.g., in Android Studio or cursor-based tools) to generate native Android (Kotlin/Jetpack Compose) or cross-platform (Flutter) client code.

---

## 1. System Architecture & Offline-First Strategy

The application uses an **Offline-First Repository Pattern**. The UI observes local database states, and all network writes/reads pass through a synchronization manager to ensure maximum performance and reliable offline operations.

```
                  +---------------------------------------+
                  |         Jetpack Compose / UI          |
                  +---------------------------------------+
                                      ^
                                      | (Observes Flow/StateFlow)
                                      v
                  +---------------------------------------+
                  |       Repository / Domain Layer       |
                  +---------------------------------------+
                                      ^
                                      |
                     +----------------+----------------+
                     |                                 |
                     v                                 v
   +-----------------------------------+     +-----------------------------------+
   |     Room Local SQLite Cache       |     |     Retrofit / API Service        |
   +-----------------------------------+     +-----------------------------------+
                     ^                                         ^
                     | (WorkManager Background Sync)           | (REST / HTTPS JSON)
                     +--------------------+--------------------+
                                          v
                               +-----------------------+
                               |     SWAYOG Server     |
                               +-----------------------+
```

### Core Architecture Rules:
1. **Local as Source of Truth**: The UI never directly waits for network requests for screen rendering. It queries the local Room database. A network fetch triggers in the background, updates Room, and Room's reactive stream (Flows) updates the UI.
2. **Write Queueing**: User operations (e.g., submitting service requests) are written to local database tables immediately with a synchronization flag (`isSynced = false`). An Android `WorkManager` worker is scheduled to sync the changes when network conditions are satisfied.
3. **HTTP Interceptor**: Requests include a token interceptor that handles JWT validation and handles `401 Unauthorized` responses by automatically requesting a refresh token, saving new tokens, and retrying the request.

---

## 2. Global UI/UX Design System (Dark-Solar Theme)

The UI utilizes a modern, deep dark-theme styling accented by vibrant solar-orange and ecological-green elements.

### A. Color Palette
```kotlin
val BackgroundDark = Color(0xFF0B132B)  // Dark Blue Canvas
val SurfaceDark = Color(0xFF1C2541)     // Card Surface, Modals, Inputs
val PrimarySolar = Color(0xFFFF6B00)    // Active Solar generation, CTAs, Highlights
val EcoAccent = Color(0xFF10B981)       // Completed timeline steps, Operational status
val InfoAccent = Color(0xFF0284C7)      // Pending dispatches, In-progress steps
val TextPrimary = Color(0xFFFFFFFF)     // Dominant headings & high-contrast values
val TextSecondary = Color(0xFF94A3B8)   // Muted labels, timestamps, body text
val OutlineColor = Color(0xFF334155)    // Borders, Dividers, Grid lines
```

### B. Typography & Components
* **Primary Headers**: `Outfit` font family. Bold weights, tracking `0.05em`.
* **Body/Technical Labels**: `Inter` or `Roboto` font family. Medium to Light weights, high readability.
* **Glassmorphic Effect**: Cards should use `SurfaceDark` with a transparency alpha of `0.85`, thin border outlines using `OutlineColor` (alpha `0.5`), and background blur overlays.
* **Micro-Animations**:
  * *Solar Pulse*: A glowing, pulsing circular ring animation surrounding the system's live kW generation indicator.
  * *Step Bounce*: Animated checkmark sizing on timeline transitions.
  * *Chart Render*: Easing animations on bar height and area transitions using path drawing duration interpolation.

---

## 3. Database Schemas (Room Entity Specifications)

The local SQLite database requires the following entities. The schemas mirror the PostgreSQL schema on the backend, extending them with synchronization metadata.

### 1. User Session Entity
```kotlin
@Entity(tableName = "user_session")
data class UserSessionEntity(
    @PrimaryKey val id: String,
    val loginId: String,
    val email: String,
    val fullName: String,
    val phoneNumber: String?,
    val role: String,
    val isActive: Boolean,
    val accessToken: String,
    val refreshToken: String,
    val lastLoginTimestamp: Long
)
```

### 2. Customer Profile & Solar System details
```kotlin
@Entity(tableName = "customer_profile")
data class CustomerProfileEntity(
    @PrimaryKey val id: Int,
    val customerCode: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val city: String,
    val address: String,
    val systemSizeKw: Double,
    val installationDate: String,
    val warrantyExpiry: String?,
    val panelBrand: String?,
    val inverterBrand: String?,
    val inverterModel: String?,
    val amcStatus: String, // 'active', 'expired', 'none'
    val amcExpiryDate: String?,
    val status: String,
    val projectStage: Int, // 0 to 11 installation stage indicator
    val cleaningsPerMonth: Int,
    val completedVisits: Int, // completed AMC visits in the current month
    val pendingVisits: Int, // Cleanings pending for current month
    val clientType: String?,
    val consumerNumber: String?,
    val monthlyCleaningRate: Double?,
    val lastUpdatedLocally: Long
)
```

### 3. Service Request / Complaint Entity
```kotlin
@Entity(
    tableName = "service_requests",
    indices = [Index(value = ["id"]), Index(value = ["isSynced"])]
)
data class ServiceRequestEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val id: Int?, // Null if not yet sync'd with backend
    val customerId: Int,
    val title: String,
    val description: String,
    val address: String?,
    val latitude: Double?,
    val longitude: Double?,
    val status: String, // 'pending', 'assigned', 'completed'
    val scheduledDate: String?,
    val scheduledTime: String?,
    val createdAt: String,
    val isSynced: Boolean = true,
    val pendingDelete: Boolean = false,
    val localImagePath: String? = null // Holds path of captured photo for compression/upload
)
```

### 4. Dispatch Record Entity
```kotlin
@Entity(tableName = "dispatch_records")
data class DispatchRecordEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val itemId: Int,
    val itemName: String,
    val quantity: Int,
    val pricePerUnit: Double,
    val dispatchedAt: String,
    val notes: String
)
```

### 5. Inverter Telemetry Metrics
```kotlin
@Entity(tableName = "inverter_generation_summary")
data class InverterGenerationSummaryEntity(
    @PrimaryKey val customerId: Int,
    val dailyGeneration: Double,
    val totalGeneration: Double,
    val peakPower: Double,
    val currentPower: Double,
    val isSimulated: Boolean,
    val status: String, // 'online', 'offline'
    val lastUpdated: String
)
```

### 6. Inverter Telemetry Graph Data points
```kotlin
@Entity(
    tableName = "inverter_generation_history",
    primaryKeys = ["customerId", "period", "label"]
)
data class InverterGenerationHistoryEntity(
    val customerId: Int,
    val period: String, // 'realtime', 'daily', 'monthly', 'yearly'
    val label: String,  // Time, Date, Month, or Year label
    val powerValue: Double?, // Used for kW in real-time
    val generationValue: Double? // Used for kWh in historical views
)
```

### 7. Invoice Entity
```kotlin
@Entity(tableName = "invoices")
data class InvoiceEntity(
    @PrimaryKey val id: String,
    val customerId: Int,
    val invoiceType: String, // 'installation', 'amc', 'cleaning'
    val amount: Double,
    val paymentStatus: String, // 'pending', 'paid', 'failed'
    val amountPaid: Double,
    val invoiceDate: String,
    val paymentDate: String?,
    val description: String?,
    val proofUrl: String?
)
```

### 8. Saved Card Local Entity (Encrypted Cache)
```kotlin
@Entity(tableName = "saved_cards")
data class SavedCardEntity(
    @PrimaryKey val cardNumberHash: String,
    val cardHolderName: String,
    val maskedCardNumber: String, // e.g. "•••• •••• •••• 4242"
    val expiryDate: String,
    val cardBrand: String // 'Visa', 'Mastercard', etc.
)
```

---

## 4. Detailed Screen Specifications & Core Features

### Screen 1: Login & Session Setup

#### A. User Interface Setup
* **Canvas Layout**: FrameLayout/Box with a background drawing from `BackgroundDark`.
* **Login Form Card**: Vertical linear alignment inside a scrollable view. Use a card elevation of `8dp`, shape rounding `16dp`, and set the background to `SurfaceDark` with `0.85` transparency.
* **Input Elements**:
  * *Login ID or Email*: Outlined text input. Accent focused state with `PrimarySolar`. Custom icon: `Email` or `Person`.
  * *Password Input*: Outlined text input. Toggle visibility button with eye/eye-crossed icons. Validated to require minimum 6 characters.
  * *"Remember Me"* Checkbox: Clean custom toggle layout with active styling matching `PrimarySolar`.
* **Action Buttons**:
  * *Sign In*: Text with dynamic background. Button has full screen width with 12dp rounded corners. Standard color is `PrimarySolar`. Clicking triggers the login operation. Show spinner state during API call.
  * *Biometric Quick Unlock*: Circular icon next to password input or center bottom. Activates if credentials have been encrypted and saved in KeyStore previously.

#### B. Data Fetching & State Lifecycle
1. User clicks **Sign In** -> triggers `POST /api/v1/auth/login` payload with input fields.
2. API validates, returning JSON payload containing profile information and token strings.
3. Client intercepts response, decrypts parameters, updates Room's `UserSessionEntity`, and initializes JWT strings in `EncryptedSharedPreferences`.
4. Launch prompt querying user's permission to save fingerprint profile:
   * *If Yes*: Encrypt raw password using Android Cryptographic KeyStore Provider. Store credential payload.
5. On next launch: Check for valid cached session. If session is expired, prompt biometric `BiometricPrompt` authentication. Validate decrypted login details against backend API using background Retrofit service.

---

### Screen 2: Dashboard (Home Dashboard)

#### A. User Interface Setup
* **Canvas Layout**: Scrollable vertical layout with collapsing header (SliverAppBar-style banner).
* **Hero Trajectory Banner**:
  * Displays current installation step as a high-fidelity visual progress bar.
  * Banner background: Linear gradient (`#FF6B00` to `#10B981` at 45 degrees). Includes a translucent vector illustration of the sun.
  * Button: "Open Full Tracker" -> triggers navigation to **Screen 3 (Timeline)**.
* **Solar Metrics Grid**:
  * Three grid cards displaying:
    1. *Live Generation*: Big numerical typography of current output (e.g., `4.8 kW`). Displays dynamic green glowing pulse icon if system status is `online`.
    2. *Lifetime Generation*: Value in kWh (e.g., `12,840 kWh`).
    3. *Active Status*: Status badge showing dynamic sync health (e.g., "Online via Growatt").
* **AMC & Maintenance Summary Card**:
  * Card header icon: `Wrench`.
  * Displays "AMC Status" badge (`Active` or `Expired`).
  * Shows cleanings completion metrics: `2 completed / 1 pending` in the current month. Includes a circular progress indicator indicating completion percentage.
* **Carbon Offset Visualizer**:
  * Uses sliding micro-animations to visual ecological offsets.
  * *Calculations (Client-Side)*:
    * $\text{CO}_2\text{ prevented (kg)} = \text{Lifetime generation (kWh)} \times 0.70$
    * $\text{Equivalent Trees Planted} = \frac{\text{CO}_2\text{ prevented (kg)}}{20.0}$
  * Displays cute vector illustrations: A tree with count label, and a smoke cloud with CO2 mass label.

#### B. Data Fetching & Caching Lifecycle
1. App requests `GET /api/v1/customer/profile` and `GET /api/v1/customer/installation` in parallel.
2. Inverter telemetry queried via `GET /api/v1/subadmin/customers/{customerId}/inverter-generation`.
3. Repository updates local DB rows: `CustomerProfileEntity`, `InverterGenerationSummaryEntity`.
4. Flow objects emit data to Compose UI instantly.
5. In case of network loss, database queries yield stale-while-revalidate data immediately. Warning alert is rendered on screen header: *"Offline: Showing cached data from [Timestamp]"*.

---

### Screen 3: Detailed Installation Tracker (12 Phases)

#### A. User Interface Setup
* **Canvas Layout**: Scrollable vertical timeline layout.
* **Timeline Line**: Solid vertical track running down the left margin, drawn using `OutlineColor`. The track is filled in with `EcoAccent` (green) matching the current progress index.
* **Timeline Milestones**:
  * Loop through the **12 Project Phases**:
    1. *Site Survey*
    2. *Document Collection*
    3. *Approval and Advance Payment*
    4. *Licensing*
    5. *2nd Instalment*
    6. *Procurement*
    7. *Vendor Selection*
    8. *Installation*
    9. *WCR (Work Completion Report)*
    10. *3rd Instalment*
    11. *Meter Installation & Subsidy Redeem*
    12. *System Handover*
  * **Visual Node States**:
    * *Index <= projectStage*: Done state. Solid green background containing a checkmark (`CheckCircle2`). Text has high contrast.
    * *Index == projectStage + 1*: In-Progress state. Solid orange background containing a spinning clock vector. Pulsing outline ring.
    * *Index > projectStage + 1*: Pending state. Outline circle with gray cross-dots, text transparency at 50%.
* **Interactivity**:
  * Tapping any step opens a bottom drawer containing:
    * Target start/end schedule dates.
    * Technical inspector notes (e.g., "Site survey completed, structural integrity passed. Roof slope optimized at 23 degrees facing south.").
    * Link triggers to view files or verification documents (uploaded structural drafts, receipts, WCR PDFs).

#### B. Data Fetching & Lifecycle
1. Target step index (`projectStage`) queried from local Room Database `CustomerProfileEntity`.
2. Sync worker refreshes tracker database cache by requesting `GET /api/v1/customer/installation` on application resume.

---

### Screen 4: Solar Generation Analytics & Telemetry

#### A. User Interface Setup
* **Canvas Layout**: Column container with a top header and a middle tab controller.
* **Period Selection Tabs**: Tab row options: "Real-time", "Daily", "Monthly", "Yearly". Standard tab background: `SurfaceDark`. Active selection: `PrimarySolar`.
* **Telemetry Chart Panel**:
  * *Real-Time View*: Renders an Area Chart (Power vs Time). Drawing bounds use time labels (e.g., `09:00`, `11:00`, `13:00`, `15:00`, `17:00`) on the X-axis and power (kW) on the Y-axis. The chart uses a smooth cubic spline line with an ecological-green gradient fill.
  * *Historical Views (Daily / Monthly / Yearly)*: Renders a Bar Chart (Energy vs Time). Bars use rounded corners at their tops, colored in `InfoAccent` (sky blue). Displays units in kWh.
* **Interactive Tooltip Canvas**: Touching the graph invokes a precise vertical line and tooltip card showing the selected coordinate values (e.g. `12:30 PM: 4.8 kW`).
* **Metadata Summary Grid**: Shows three cards:
  * *Yield Metric*: Daily output target compared to current output.
  * *Peak Power Output*: Max output recorded for the active period.
  * *Sync Monitor*: Label showing either "Live Cloud Sync" or "Offline Simulated Cache".

#### B. Telemetry API Fetching Flow
1. Fetch logic runs relative to `selectedPeriod` State:
   * Query path: `GET /api/v1/subadmin/customers/{customerId}/inverter-generation-history?period={period}`
2. Response values map array fields to local `InverterGenerationHistoryEntity` lines.
3. If the server response flag contains `dataUnavailable = true`, intercept and render an alert banner: *"Communication error with Inverter cloud API. Displaying simulated generation values based on regional solar index."*

---

### Screen 5: Material Dispatches Ledger

#### A. User Interface Setup
* **Canvas Layout**: Single page list layout with sticky top summary.
* **Financial Summary Banner**:
  * Positioned at the top of the canvas. Shows a card containing total value text (e.g., `₹2,34,500`) with title: "Dispatched Inventory Valuation".
* **Search / Filter field**:
  * Outlined input box for searching items by name. Muted search icon in start position.
* **Dispatch List**:
  * LazyColumn (recycler list) of dispatch entries.
  * Cards use glassmorphic outline border.
  * Text fields display:
    * *Item Name*: E.g., `Tata Power 540W Mono-PERC Modules` (bold, contrast color).
    * *Date*: Muted timestamp indicating delivery (e.g., `12 May 2026`).
    * *Quantity & Total Price*: Quantity is highlighted in monospace text. Calculated price is displayed in large blue text (e.g., `₹1,89,000`).
    * *Notes*: Block quotation layout at the bottom showing instructions or receipt verification from dispatch crew (e.g., "Admin note: Material delivered near safety guardhouse. Signature on file.").

#### B. Fetching Flow
1. Endpoint: `GET /api/v1/customer/dispatches`
2. Retrofit client updates table cache `dispatch_records`.
3. SQL query uses search text to filter: `SELECT * FROM dispatch_records WHERE itemName LIKE '%' || :searchQuery || '%'` to render the lists reactively.

---

### Screen 6: Service Requests & AMC Maintenance Coordinator

#### A. User Interface Setup
* **Canvas Layout**: Dual tab component: "Active Service Tickets" and "AMC Maintenance Schedules".
* **Floating Action Button**: Renders a floating "+" button in `PrimarySolar` color to launch the **New Request Bottom Sheet**.
* **New Request Bottom Sheet**:
  * Scrollable overlay dialog.
  * *Category Selection Dropdown*: Options matching backend array schemas: `["Panel Cleaning", "Inverter Connection issue", "Structural check", "Electrical wiring"]`.
  * *Description Box*: Text area with minimum length validator.
  * *Contact Phone Input*: String input field.
  * *Location Coordinate Handler*:
    * "Use Current GPS Location" button: Fetches GPS coordinates using Android's location services.
    * Interactive map container: Embedded Google Maps / Leaflet map preview. Displays a draggable pin. User can drag the pin on the map to mark the exact inverter/site coordinates.
    * Reverse-geocoded address label: Automatically populated by reverse-geocoding the coordinates (e.g. via Nominatim API).
  * *Media Upload Handler*:
    * "Attach Photo Proof" block. Launches camera capture or photo gallery selector. Shows image previews in a thumbnail container with a delete icon on each thumbnail.
* **Service Tickets List**:
  * Cards with request status indicators:
    * `pending`: Orange border.
    * `assigned`: Blue border. Shows assigned technician details (name, contact phone, avatar).
    * `completed`: Green check icon. Clicking a completed ticket opens the **Customer Rating & Verification Workflow Modal**.
* **Customer Rating & Verification Workflow Modal**:
  * **Before/After Photo Comparison**: Displays side-by-side work photos uploaded by the field crew, complete with overlaid GPS coordinates, date, and location verification watermarks.
  * **GPS Geotag Map Link**: Provides a direct link to open the technician's submission coordinates on Google Maps to verify the physical proof of work.
  * **Interactive Rating Bar**: Star rating component (1-5 stars).
  * **Feedback Input**: Optional text box for submitting service comments.
  * **Fix Charges Input**: Numerical input field where the customer enters the final work costing / fix charges.
  * **Submit & Pay Trigger**: Submitting the form updates the task in the database with the rating, feedback, and fix charges, and triggers a payment flow.
* **AMC Visit Schedules**:
  * Lists upcoming cleanings and visits. Displays scheduled date, cleaning number (e.g., `Visit 2 of 4 this month`), technician name, and scheduled time slot.

#### B. Location and Image Compression Specs
* **GPS Coordinates Retrieval**:
  ```kotlin
  val fusedLocationClient = LocationServices.getFusedLocationProviderClient(activity)
  fusedLocationClient.lastLocation.addOnSuccessListener { location ->
      location?.let {
          val lat = location.latitude
          val lng = location.longitude
          // Update database and UI state
      }
  }
  ```
* **Image Compression Engine (Kotlin Bitmap Rescaling)**:
  Before uploading image files, process the source URI to limit sizes to < 500KB:
  ```kotlin
  fun compressImageFile(context: Context, uri: Uri): ByteArray {
      val inputStream = context.contentResolver.openInputStream(uri)
      val originalBitmap = BitmapFactory.decodeStream(inputStream)
      
      // Limit dimensions to 1280px max bounds
      val maxDimension = 1280
      val width = originalBitmap.width
      val height = originalBitmap.height
      val ratio = width.toFloat() / height.toFloat()
      
      val (newWidth, newHeight) = if (width > height) {
          Pair(maxDimension, (maxDimension / ratio).toInt())
      } else {
          Pair((maxDimension * ratio).toInt(), maxDimension)
      }
      
      val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, newWidth, newHeight, true)
      val outputStream = ByteArrayOutputStream()
      // Compress with JPEG at 75% quality
      scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
      return outputStream.toByteArray()
  }
  ```

#### C. Fetching & WorkManager Queue Flow
1. User submits request -> App saves data locally to SQLite database `service_requests` with status `pending`, `isSynced = false`, and references local image paths.
2. App schedules a **WorkManager OneTimeWorkRequest** constraint to require network connectivity:
   ```kotlin
   val syncConstraints = Constraints.Builder()
       .setRequiredNetworkType(NetworkType.CONNECTED)
       .build()
   val serviceSyncWorker = OneTimeWorkRequestBuilder<ServiceRequestSyncWorker>()
       .setConstraints(syncConstraints)
       .build()
   WorkManager.getInstance(context).enqueue(serviceSyncWorker)
   ```
3. Worker uploads the request details to `/api/v1/customer/requests` using a multi-part form request.
4. On response success, worker updates the database: sets `isSynced = true` and saves the remote request ID.

---

### Screen 7: Payments & Invoices (Razorpay SDK)

#### A. User Interface Setup
* **Canvas Layout**: Scrolling ledger layout.
* **Dues Banner Card**:
  * Background: Slate gradient.
  * Shows total outstanding balance in large bold currency format.
  * Button: "Pay Outstanding Balance" (disabled if dues are zero). Clicking triggers the Razorpay native checkout sheet.
* **Invoice Ledger Table**:
  * Clean table layout.
  * Columns:
    * *Invoice ID*: Displayed in monospace font (abbreviated, tap to copy).
    * *Description*: Details about the charge.
    * *Amount*: Formatted currency text (e.g. `₹45,000`).
    * *Status Badge*: Styled badges (`pending` in amber, `paid` in green).
    * *Receipt Attachment*: If proof document is present, shows a visual eye icon to view the PDF or image in an in-app viewer.
    * *Pay Action*: If the invoice is `pending`, shows a "Pay via Gateway" CTA.

#### B. Razorpay SDK Native Integration Lifecycle
1. User taps **Pay via Gateway** -> UI triggers API order initialization.
2. Client calls backend: `POST /api/v1/customer/payments/razorpay/order` payload: `{ amountInRupees, description, referenceId }`.
3. Server calls Razorpay APIs to generate an order and returns:
   ```json
   {
     "data": {
       "keyId": "rzp_test_xxxx",
       "orderId": "order_xxxx",
       "amount": 4500000,
       "currency": "INR",
       "customerName": "John Doe",
       "customerEmail": "john@example.com",
       "description": "2nd Instalment payment"
     }
   }
   ```
4. Mobile app initializes the native **Razorpay SDK Checkout activity**:
   ```kotlin
   val checkout = Checkout()
   checkout.setKeyID(keyId)
   val options = JSONObject()
   options.put("name", "SWAYOG Solar Portal")
   options.put("description", description)
   options.put("order_id", orderId)
   options.put("currency", currency)
   options.put("amount", amount)
   val prefill = JSONObject()
   prefill.put("name", customerName)
   prefill.put("email", customerEmail)
   options.put("prefill", prefill)
   checkout.open(activity, options)
   ```
5. User completes payment natively (via UPI, NetBanking, Card, etc.).
6. SDK delegates response callback to the mobile activity:
   * `onPaymentSuccess(razorpayPaymentID, paymentData)`: Sends payment metadata details back to our server via: `POST /api/v1/customer/payments/razorpay/verify`.
   * `onPaymentError(code, response)`: Shows a descriptive payment failure toast.
7. Server verifies the signature, updates the database, and marks the invoice status as `paid`. The app receives verification success, invalidates local Room caches, and refreshes the ledger view.
8. **Finance Integration & Reporting**:
   * Verification success automatically writes a new `Payment` entry to the PostgreSQL database containing `amount`, `paymentMethod`, `transactionId`, and the associated `taskId`.
   * Real-time notifications are pushed to the Service Coordinator (`SUB_ADMIN`) dashboard showing: **"Payment of ₹[amount] received for Ticket #[taskId]"**, automatically updating finance/revenue panels.

---

### Screen 8: Settings & Profiles Screen

#### A. User Interface Layout
* **Canvas Layout**: Row/Column split screen. Left sidebar navigation menu on tablets, or bottom-navigation selector on mobile phones.
* **Sections**:
  1. **Profile Details**:
     * Profile Photo Container: Circular picture box with placeholder fallback using customer name initials.
     * Upload photo button: Launches image picker. Applies a 240x240 px crop boundary locally before scaling the image and saving it to local storage or API.
     * Text fields display name and email.
  2. **Security Controls**:
     * Two-Factor Authentication (2FA) switch.
     * Session Timeout switch.
     * "Sign Out Everywhere" button: Calls the server to invalidate session tokens, clears credentials from local storage, and redirects the user to the login screen.
  3. **Theme and Accessibility**:
     * Theme select group: Radio buttons for "Dark Mode" and "Light Mode".
     * Font Size selector: Options for "Small", "Normal", and "Large" to adjust text sizes across the app.
  4. **Saved Cards**:
     * Visual debit card layout showing saved cards from `saved_cards` Room table. Includes a "Remove Card" button.
     * "Add Card" Form: Includes cardholder name, number, expiry, and CVV inputs. Generates a masked number hash and saves it to Room.

---

## 5. API Payload Specifications (JSON Reference Schema)

### 1. `POST /api/v1/auth/login`
* **Request**:
```json
{
  "loginId": "customer_john",
  "password": "securepassword123"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "data": {
    "user": {
      "id": "usr-8a2b-9c3d",
      "loginId": "customer_john",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+919876543210",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-05-01T12:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx.xxxx",
    "refreshToken": "ref-9b8a-7c6d-5e4f"
  }
}
```

### 2. `GET /api/v1/customer/installation`
* **Response (`200 OK`)**:
```json
{
  "data": {
    "id": 101,
    "customerCode": "SW-101",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "city": "Mumbai",
    "address": "Flat 402, Sunshine Residency, Andheri West",
    "systemSizeKw": 5.4,
    "installationDate": "2026-05-15T00:00:00.000Z",
    "warrantyExpiry": "2031-05-15T00:00:00.000Z",
    "panelBrand": "Tata Power",
    "inverterBrand": "Growatt",
    "amcStatus": "active",
    "amcExpiryDate": "2027-05-15T00:00:00.000Z",
    "status": "active",
    "projectStage": 7,
    "completedVisits": 2,
    "pendingVisits": 1
  }
}
```

### 3. `GET /api/v1/subadmin/customers/{customerId}/inverter-generation`
* **Response (`200 OK`)**:
```json
{
  "dailyGeneration": 18.4,
  "totalGeneration": 1245.8,
  "peakPower": 4.9,
  "currentPower": 3.2,
  "isSimulated": false,
  "status": "online",
  "lastUpdated": "2026-06-06T12:00:00Z"
}
```

### 4. `GET /api/v1/subadmin/customers/{customerId}/inverter-generation-history?period={period}`
* **Response (`200 OK` for period=realtime)**:
```json
{
  "period": "realtime",
  "history": [
    { "label": "08:00", "power": 1.2 },
    { "label": "10:00", "power": 2.8 },
    { "label": "12:00", "power": 4.5 },
    { "label": "14:00", "power": 3.8 },
    { "label": "16:00", "power": 2.1 }
  ]
}
```
* **Response (`200 OK` for period=daily)**:
```json
{
  "period": "daily",
  "history": [
    { "label": "Mon", "generation": 16.5 },
    { "label": "Tue", "generation": 18.2 },
    { "label": "Wed", "generation": 19.4 },
    { "label": "Thu", "generation": 14.1 },
    { "label": "Fri", "generation": 17.8 }
  ]
}
```

### 5. `POST /api/v1/customer/requests`
* **Multipart Request Body**:
  * `serviceType`: "Panel Cleaning"
  * `description`: "Thick layer of dust has settled on the panel surface."
  * `address`: "Flat 402, Sunshine Residency, Andheri West"
  * `latitude`: 19.123456
  * `longitude`: 72.890123
  * `preferredDate`: "2026-06-10"
  * `image`: Binary file payload (compressed to <500KB)
* **Response (`210 Created`)**:
```json
{
  "data": {
    "id": 501,
    "customerId": 101,
    "title": "Panel Cleaning",
    "description": "Thick layer of dust has settled on the panel surface.",
    "status": "pending",
    "scheduledDate": "2026-06-10",
    "createdAt": "2026-06-06T12:46:00.000Z"
  },
  "message": "Service request submitted successfully"
}
```

---

## 6. Token Lifecycle & API Interceptor

To maintain seamless login sessions without prompting users for credentials, the application routes all calls through an HTTP Interceptor.

```kotlin
class AuthInterceptor(private val context: Context) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = getSavedAccessToken() // read from EncryptedSharedPreferences

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        val response = chain.proceed(authenticatedRequest)

        if (response.code == 401) { // JWT expired
            synchronized(this) {
                // Fetch fresh access token using refresh token
                val newAccessToken = requestTokenRefresh()
                if (newAccessToken != null) {
                    // Retry original request with the new token
                    val retriedRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newAccessToken")
                        .build()
                    response.close()
                    return chain.proceed(retriedRequest)
                }
            }
        }
        return response
    }
}
```

---

## 7. Environment Profiles & Configuration Settings

### A. Endpoint Mappings
* **Development (Vite Frontend Proxy)**: `http://127.0.0.1:4000`
* **Android Emulator Redirect Address**: `http://10.0.2.2:4000` (maps to local server instance inside the emulator).
* **Production Web Staging URL**: `https://swayog-dashboard-delta.vercel.app`

### B. PostgreSQL Reference (Backend Sync Info)
* **Staging Host URL**: `postgresql://neondb_owner:npg_4NYF3wHeqkOm@ep-red-poetry-apyaxvb1-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require`

### C. JWT Configuration Parameters
* **JWT Access Secret**: `7kPmNqRsTuVwXyZaBcDeFgHiJkLmNoPq8rStUvWxYz`
* **JWT Refresh Secret**: `9aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkL2mNo`
* **Access token TTL**: `15 minutes`
* **Refresh token TTL**: `7 days`

---

## 8. Safety, Security & Performance Guidelines

1. **Secure Storage**: Access tokens, refresh tokens, and passwords must be stored using `EncryptedSharedPreferences` backed by Android's hardware Keystore.
2. **SSL Pinning**: Pin certificates for API calls to prevent Man-in-the-Middle (MITM) attacks.
3. **Media Management**: Compress photos to < 500KB before uploading to optimize bandwidth and storage.
4. **Network Constraints**: Background syncs must require active internet connections and unmetered networks if uploading large media files to prevent data charges.
5. **UI Thread Integrity**: Execute database writes and image operations using background coroutines (e.g. `Dispatchers.IO`) to keep the main thread responsive.

---

## 9. End-to-End Customer Service & Payment Workflow

The customer mobile application integrates with the server backend and the employee app to deliver a complete, transparent end-to-end service ticket lifecycle:

### Step 1: Service Scheduling & Notification
* **Creation**: The Super Admin, Admin, or Service Coordinator schedules a service/survey task for a customer site, assigning one or more employees.
* **Alerting**: The system triggers a real-time push notification to the customer's mobile app: **"New schedule is added"**.
* **Dashboard View**: The customer's dashboard updates to display the scheduled service under the active maintenance / request timeline.

### Step 2: Employee Field Work & Proof Collection
* The assigned employees arrive at the customer site.
* **Before Photo**: Employees upload a "Before" image showing the system status/issues.
* **After Photo**: Upon completing the service, employees upload an "After" image showing the resolution.
* **GPS & Watermark Verification**: The employee app automatically embeds GPS coordinates (Latitude, Longitude) and a date/time stamp onto both images as a permanent proof watermark.

### Step 3: Completion Notification & Verification
* Once the employee completes and submits the task, the customer receives a push notification: **"Task is completed"**.
* **Verification Drawer**: The customer opens the completed task card in the mobile app to view:
  * Side-by-side **Before/After** watermarked photos.
  * Direct Google Maps coordinate links to verify that the work was physically performed at their registered site location.

### Step 4: Rating, Costing & Payment Processing
* **Feedback Intake**: The customer inputs a service rating (1-5 stars) and optional text comments.
* **Fix Charges Amount**: The customer enters the agreed fix charges / service cost.
* **Payment Flow**:
  * Tapping **Submit & Pay** triggers order generation via the native Razorpay SDK checkout flow.
  * Upon payment success, the app updates the backend via `POST /api/v1/customer/payments/razorpay/verify`.
  * The system registers a new record in the PostgreSQL `Payment` table (mapping amount, transaction ID, customer ID, task ID, and timestamp).
  * The task status is officially set to `completed` in the database.

### Step 5: Finance & Coordinator Reconciliation
* The payment receipt is recorded instantly in the main finance database.
* The Service Coordinator dashboard and calendar view are automatically refreshed, showing the updated payment status, ratings, and watermarked proof images.
