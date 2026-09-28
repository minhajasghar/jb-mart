# JB Mega Mart Kitchen - Flutter Mobile App (iOS & Android)

This repository contains the Flutter mobile client for **JB Mega Mart Kitchen**, designed to deliver a **100% exact copy of the web application** across both iOS and Android platforms with zero visual or behavioral discrepancy.

---

## 🌟 Architecture & Features

- **100% Parity with Web App**: Renders the complete web application (Landing, dynamic category selectors, hero YouTube video loop, branch selection, live cart drawer, multi-branch checkout, GST calculations for COD and Online payments, printable invoice generation, order tracking timeline, Kitchen Display System, and Admin management).
- **Native Android & iOS Integration**:
  - Full-screen immersion with transparent system status bar and dark theme navigation bar.
  - Pull-to-refresh (`RefreshIndicator`).
  - Native gesture & hardware back button handling (`PopScope`): navigates internal web history smoothly without exiting the app unintentionally.
  - External link handler: Automatically opens WhatsApp chats (`wa.me`, `whatsapp://`), phone calls (`tel:`), emails (`mailto:`), and Google Maps in their native mobile applications.
  - Cleartext traffic enabled for smooth local IP testing (`http://192.168.x.x:5000` or `http://10.0.2.2:5000`).
  - Branded offline fallback screen with one-tap Retry and interactive Server URL switcher.
  - Dynamic Server URL configuration stored in `SharedPreferences`.

---

## 🚀 How to Build and Run

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Run Locally in Development
- **Android Emulator**:
  ```bash
  flutter run -d android
  ```
- **Connected Physical Device (USB / Wi-Fi)**:
  ```bash
  flutter run
  ```

### 3. Build Production APK (Android)
```bash
flutter build apk --release
```
The output APK file will be located at:
`build/app/outputs/flutter-apk/app-release.apk`

### 4. Build for iOS
```bash
flutter build ios --release
```
Or open `ios/Runner.xcworkspace` in Xcode to archive and sign for TestFlight or the App Store.

---

## ⚙️ Server Configuration
You can configure the target web app URL in [lib/constants/app_constants.dart](file:///c:/Users/admin/Desktop/TNT%20Innov%20Projects/jb-mart/flutter-app/lib/constants/app_constants.dart):
```dart
static const String defaultWebAppUrl = 'https://your-domain.com';
```
When running the app on a physical device or emulator, you can also change the server address dynamically without rebuilding by tapping **Change URL** on the error screen.
