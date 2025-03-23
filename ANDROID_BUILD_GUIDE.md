# Android APK Build Guide

This guide provides step-by-step instructions for generating the Android APK with all necessary data files bundled for offline operation.

## Prerequisites

1. **Development Environment**
   - Node.js 16+ and npm
   - Android Studio installed
   - Android SDK configured (API level 22+)
   - Java Development Kit (JDK) 11+

2. **Android SDK Tools**
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Platform SDK for API 33+
   - Android NDK (optional)

3. **Project Setup**
   - All project files checked out
   - Dependencies installed
   - Capacitor configuration completed

## Build Process

### 1. Prepare the Environment

Make sure all dependencies are installed:

```bash
npm install
```

Verify that Capacitor and plugins are installed:

```bash
npm list @capacitor/core @capacitor/android @capacitor/filesystem @capacitor/preferences
```

### 2. Install Cordova SMS Plugin

The Cordova SMS plugin enables native SMS messaging. Run:

```bash
# Make the script executable
chmod +x install-cordova-plugins.sh

# Run installation script
./install-cordova-plugins.sh
```

This script will:
- Install the Cordova SMS plugin
- Configure the necessary Android files
- Sync the changes with Capacitor

### 3. Build the Web Assets

Build the React application to generate the distributable files:

```bash
npm run build
```

This will create optimized production files in the `dist` directory.

### 4. Prepare Data Files

Ensure all necessary data files are present:

```bash
# Create data directory if it doesn't exist
mkdir -p data

# Verify essential data files
ls -la data/*.json data/*.csv
```

The following files should be present:
- `data/total_teacher.json`
- `data/absent_teachers.json`
- `data/assigned_teacher.json`
- `data/class_schedules.json`
- `data/sms_history.json`
- Any CSV files needed for initial setup

### 5. Run the Android Build Script

Execute the build script to prepare the Android platform:

```bash
# Make the script executable
chmod +x build-android.sh

# Run the script
./build-android.sh
```

This script will:
- Build the web assets
- Copy all data files to Android assets folder
- Sync the configuration with Capacitor
- Prepare for the final APK build

### 6. Generate the APK

Navigate to the Android directory and build the APK:

```bash
cd android
./gradlew assembleDebug
```

For a production-ready APK, use:

```bash
./gradlew assembleRelease
```

Note: For release builds, you need to configure signing keys in `android/app/build.gradle`.

### 7. Locate the APK

The generated APK file will be available at:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

## Verifying the APK

### 1. Check APK Content

You can verify the contents of the APK using:

```bash
# Extract the APK (requires apktool)
apktool d app-debug.apk -o extracted_apk

# Check if data files are bundled
ls -la extracted_apk/assets/public/data/
```

### 2. Install and Test

Install the APK on a physical device or emulator:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Test the following functionality:
- App launches without errors
- Local server starts properly
- Data is loaded correctly
- API calls work offline
- SMS functionality (on physical device)

## Troubleshooting

### Build Failures

1. **Gradle Sync Issues**
   - Update Android Gradle Plugin
   - Check compatibility with your Java version
   - Verify dependencies are resolved

2. **Missing Files**
   - Ensure all Android configuration files are present
   - Check paths in capacitor.config.ts
   - Verify assets are copied correctly

3. **Plugin Integration Issues**
   - Check plugin setup in MainActivity.java
   - Verify plugin configuration in capacitor.config.ts
   - Ensure plugins are properly installed

### Runtime Issues

1. **App Crashes on Start**
   - Check initialization sequence in main.tsx
   - Verify all required services are started
   - Look for errors in Android logs (`adb logcat`)

2. **Data Not Loading**
   - Verify file paths in DataSyncService
   - Check asset bundling process
   - Ensure file permissions are correct

3. **SMS Not Working**
   - Verify permissions in AndroidManifest.xml
   - Check SMS plugin configuration
   - Ensure device has SMS capability

## Signing the APK for Production

For production releases, you need to generate a signing key:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
```

Configure the key in `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("my-release-key.keystore")
            storePassword "password"
            keyAlias "alias_name"
            keyPassword "password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

Then build the signed APK:

```bash
./gradlew assembleRelease
```