# JB Mega Mart Kitchen - Flutter Cross-Platform App (iOS & Android)

This repository contains the official **Flutter** mobile client for JB Mega Mart Kitchen, supporting both **iOS (iPhone/iPad)** and **Android**.

---

## 🚀 How to Run and Build for iOS & Android

### Prerequisites
1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.0.0 or higher).
2. Install [Android Studio](https://developer.android.com/studio) (for Android build/emulators).
3. Install [Xcode](https://developer.apple.com/xcode/) (on macOS for iOS simulator and builds).

---

### Step 1: Install Dependencies
Navigate to this directory in your terminal:
```bash
flutter pub get
```

---

### Step 2: Run in Development

#### For iOS Simulator:
```bash
open -a Simulator
flutter run -d iPhone
```

#### For Android Emulator:
```bash
flutter run -d android
```

---

### Step 3: Build Production Files

#### Build APK for Android:
```bash
flutter build apk --release
```
Your ready-to-install Android APK will be at:
`build/app/outputs/flutter-apk/app-release.apk`

#### Build for iOS:
```bash
flutter build ios --release
```
To create an `.ipa` package for App Store or TestFlight:
```bash
flutter build ipa
```
Or open the `ios/Runner.xcworkspace` in **Xcode** and select **Product > Archive**.
