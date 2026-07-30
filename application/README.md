# Android Application (Same UI)

This folder packages your existing dashboard into an Android app using Capacitor.
Because it uses your current web build, the UI, routes, and styling stay the same.

## One-time setup

```bash
cd application
npm install
npm run android:init
```

## Build and open in Android Studio

```bash
cd application
npm run build:android
```

This will:
1. Build web app from the root project (`../dist`)
2. Sync Capacitor Android project
3. Open Android Studio project

## Daily update after frontend changes

```bash
cd application
npm run build:web
npm run sync
```

## Important backend note

For Android emulator/device, backend URL cannot stay `localhost` from the app point of view.
Use reachable host (for emulator generally `10.0.2.2`, for physical device use LAN IP).

If needed, keep API base URL configurable via environment variables in your frontend.
