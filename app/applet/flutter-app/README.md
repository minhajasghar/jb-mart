# JB Mega Mart Kitchen - Flutter Cross-Platform App (iOS & Android)

This repository contains the complete cross-platform Flutter application for **JB Mega Mart Kitchen**, designed to build and run on both **iOS (iPhone/iPad)** and **Android** devices.

---

## 🛠️ How to Build for iOS and Android

### Prerequisites
1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install) (version 3.0.0 or higher).
2. For **Android APK**: Install [Android Studio](https://developer.android.com/studio).
3. For **iOS / iPhone**: macOS with [Xcode](https://developer.apple.com/xcode/) installed.

---

### Step 1: Install Dependencies
Open a terminal inside this extracted directory and run:
```bash
flutter pub get
```

---

### Step 2: Build for Android (Generate `.apk`)
To compile a release APK for direct installation on Android phones:
```bash
flutter build apk --release
```
Your ready-to-install `.apk` will be output at:
`build/app/outputs/flutter-apk/app-release.apk`

---

### Step 3: Build for iOS (iPhone / iPad)
To test on iOS Simulator:
```bash
flutter run -d iOS
```

To create an iOS archive for TestFlight or the App Store:
```bash
flutter build ipa --release
```
Or open the `ios/Runner.xcworkspace` folder directly in **Xcode** to test on your connected iPhone.
