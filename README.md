# Enterprise Capacitor Mobile App

Production-ready cross-platform mobile framework with Vue 3, TypeScript, and native bridges.

## Features

- 🔐 **Biometric Authentication** — Touch ID, Face ID, Android Fingerprint
- 🔒 **Secure Storage** — iOS Keychain, Android EncryptedSharedPreferences
- 📷 **Native Camera** — High-quality photo capture with browser fallback
- 📍 **GPS Tracking** — Real-time location with position watching
- ⚡ **Offline-First** — IndexedDB operation queue with auto-sync
- 🔌 **Custom Native Plugins** — Example: PG&E smart meter SDK bridge
- 🎨 **Native UI Feel** — Disabled iOS rubber-banding, platform-specific optimizations

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite, Pinia, Tailwind CSS
- **Mobile**: Capacitor 6.0
- **Native**: Swift (iOS), Java (Android)
- **Storage**: IndexedDB (idb), Capacitor SecureStorage
- **Testing**: Vitest

## Quick Start

### Prerequisites
- Node.js 20+
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS): `sudo gem install cocoapods`

### Installation

```bash
# Clone repository
git clone https://github.com/dvsandeep/capacitor-mobile-app
cd capacitor-mobile-app

# Install dependencies
npm install

# Run in browser (with fallbacks)
npm run dev

# Build web assets
npm run build

# Sync to native platforms
npm run sync

# Run on iOS (requires macOS)
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
capacitor-mobile-app/
├── src/
│   ├── services/
│   │   └── native/              # All Capacitor bridge calls
│   │       ├── biometrics.service.ts
│   │       ├── camera.service.ts
│   │       ├── geolocation.service.ts
│   │       └── secure-storage.service.ts (to be added)
│   │
│   ├── composables/
│   │   └── useOfflineSync.ts    # Offline operation queue
│   │
│   ├── views/
│   │   ├── Dashboard.vue        # Home dashboard
│   │   ├── Inspections.vue      # Device inspections
│   │   ├── Devices.vue          # Device list
│   │   └── Profile.vue          # User profile
│   │
│   ├── router/
│   │   └── index.ts             # Vue Router config
│   │
│   ├── App.vue                  # Root component
│   ├── main.ts                  # App initialization
│   └── style.css                # Tailwind CSS
│
├── ios/
│   └── App/
│       └── MeterPlugin.swift    # Custom iOS plugin
│
├── android/
│   └── app/src/main/java/com/example/iot/
│       └── MeterPlugin.java     # Custom Android plugin
│
├── capacitor.config.ts           # Capacitor configuration
├── vite.config.ts                # Vite build config
├── tailwind.config.js            # Tailwind CSS config
└── package.json
```

## Native Service Abstraction Pattern

All Capacitor API calls are wrapped in service classes with browser fallbacks:

```typescript
// ✅ CORRECT: Service abstraction
import { cameraService } from '@/services/native/camera.service';

async function takePhoto() {
  const photo = await cameraService.capturePhoto();
  // Works on iOS, Android, and browser
}

// ❌ WRONG: Direct Capacitor calls in components
import { Camera } from '@capacitor/camera';

async function takePhoto() {
  const photo = await Camera.getPhoto({ ... });
  // Breaks in browser, no fallback
}
```

**Why this matters:**
- Browser fallbacks for development
- Easy to mock for testing
- Platform-specific behavior centralized
- Swap implementations without touching UI

## Offline-First Architecture

The `useOfflineSync` composable queues operations when offline and auto-syncs when connectivity returns:

```typescript
import { useOfflineSync } from '@/composables/useOfflineSync';

const { isOnline, queueOperation, pendingOps } = useOfflineSync();

// Queue an operation
await queueOperation({
  type: 'create',
  resource: 'inspections',
  payload: inspectionData,
});

// Automatically syncs when online
```

**Features:**
- IndexedDB persistence (survives app restarts)
- Exponential backoff on failures
- FIFO processing order
- Max retry limit with dead letter handling

## Biometric Authentication

```typescript
import { biometricsService } from '@/services/native/biometrics.service';

// Check availability
const capabilities = await biometricsService.checkCapabilities();
// { isAvailable: true, biometryType: 'faceId', ... }

// Authenticate
const authenticated = await biometricsService.authenticate(
  'Authenticate to view sensitive data'
);

if (authenticated) {
  // Proceed
}
```

**Supported:**
- iOS: Touch ID, Face ID
- Android: Fingerprint, Face Recognition
- Fallback: Device PIN/Password

## Custom Native Plugin Example

The `MeterPlugin` demonstrates bridging to proprietary SDKs (PG&E smart meter):

**TypeScript Interface:**
```typescript
import { MeterPlugin } from '@/plugins/meter';

const reading = await MeterPlugin.readMeterValue({ 
  meterId: 'MTR-001' 
});
// { value: 342.5, unit: 'kWh', timestamp: 1699999999 }
```

**iOS Implementation:** `ios/App/MeterPlugin.swift`  
**Android Implementation:** `android/.../MeterPlugin.java`

## Camera Integration

```typescript
import { cameraService } from '@/services/native/camera.service';

// Take photo
const photo = await cameraService.capturePhoto();

// Pick from gallery
const photo = await cameraService.pickFromGallery();

// Result
// { base64Data: '...', mimeType: 'image/jpeg' }
```

**Browser Fallback:** File input with `capture="environment"`

## GPS / Geolocation

```typescript
import { geolocationService } from '@/services/native/geolocation.service';

// Get current position
const location = await geolocationService.getCurrentPosition();
// { latitude: 37.7749, longitude: -122.4194, accuracy: 10 }

// Watch position (live tracking)
const watchId = await geolocationService.watchPosition((location) => {
  console.log('Updated location:', location);
});

// Stop watching
await geolocationService.clearWatch(watchId);
```

## Building for Production

### iOS

```bash
# Build web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select your development team
# 2. Update bundle identifier
# 3. Product → Archive
# 4. Distribute to App Store or TestFlight
```

**Or use Fastlane:**
```bash
npm run ios:build
```

### Android

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Build APK
npm run android:build

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## CI/CD Pipeline

`.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build

on:
  push:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        platform: [ios, android]
        include:
          - platform: ios
            runner: macos-latest
          - platform: android
            runner: ubuntu-latest

    runs-on: ${{ matrix.runner }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Sync Capacitor
        run: npx cap sync ${{ matrix.platform }}

      - name: Build iOS (if iOS)
        if: matrix.platform == 'ios'
        run: npm run ios:build

      - name: Build Android (if Android)
        if: matrix.platform == 'android'
        run: npm run android:build
```

## Performance Optimizations

### 1. Disable iOS Rubber Banding

```typescript
// capacitor.config.ts
ios: {
  scrollEnabled: false, // Feels more native
}
```

### 2. Batch Native Calls

```typescript
// ❌ Multiple bridge calls (5-15ms overhead each)
const battery = await Device.getBatteryInfo();
const info = await Device.getInfo();
const network = await Network.getStatus();

// ✅ Single batched call
const [battery, info, network] = await Promise.all([
  Device.getBatteryInfo(),
  Device.getInfo(),
  Network.getStatus(),
]);
```

### 3. Preload During Splash

```typescript
// main.ts
import { SplashScreen } from '@capacitor/splash-screen';

async function initializeApp() {
  // Load heavy assets
  await Promise.all([
    preloadCriticalImages(),
    initializeDatabases(),
  ]);

  // Then hide splash
  await SplashScreen.hide({ fadeOutDuration: 300 });
}
```

### 4. Code Splitting

```typescript
// Lazy load heavy components
const DeviceDiagnostics = defineAsyncComponent(
  () => import('@/components/DeviceDiagnostics.vue')
);
```

## Environment Variables

Create `.env` files for different environments:

```env
# .env.development
VITE_API_URL=http://localhost:3000/api

# .env.production
VITE_API_URL=https://api.production.com
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Testing

```bash
# Unit tests
npm test

# E2E tests (to be added)
npm run test:e2e
```

## Troubleshooting

### iOS Build Errors

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reinstall pods
cd ios/App && pod deintegrate && pod install
```

### Android Build Errors

```bash
# Clean gradle cache
cd android && ./gradlew clean

# Rebuild
./gradlew assembleDebug
```

### Capacitor Sync Issues

```bash
# Remove platforms and re-sync
rm -rf ios android
npx cap add ios
npx cap add android
npx cap sync
```

## Related Article



## Author

**D.V. Sandeep**   
[LinkedIn](https://linkedin.com/in/dhullipalla-sandeep) | [Email](mailto:dvsandeep599@gmail.com)

## License

MIT
