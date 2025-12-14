# Whiz Pos Mobile (APK)

This is the mobile client for Whiz Pos, built with React, Vite, and Capacitor.

## Prerequisites

- Node.js
- Android Studio (for building the APK)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server (web):
   ```bash
   npm run dev
   ```

## Building for Android

1. Build the web assets:
   ```bash
   npm run build
   ```

2. Add the Android platform (if not already added):
   ```bash
   npx cap add android
   ```

3. Sync web assets to Android platform:
   ```bash
   npx cap sync
   ```

4. Open in Android Studio to build APK:
   ```bash
   npx cap open android
   ```

## Configuration for LAN Sync

The `capacitor.config.ts` is configured to allow cleartext traffic (HTTP) which is required for LAN synchronization with the Desktop POS.

Ensure your `res/xml/network_security_config.xml` in the Android project (generated or modified manually) allows traffic to local IPs as specified in the architecture document.
