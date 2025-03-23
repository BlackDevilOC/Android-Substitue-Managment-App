# Mobile App Implementation with Capacitor

## Overview
This document provides details on the offline-capable mobile app implementation using Capacitor. The app allows full functionality without internet connectivity by running a local Express server on the device and bundling all necessary data files within the APK.

## Architecture

### Core Components

1. **Local Express Server** (MobileServerService.ts)
   - Runs on the device itself
   - Serves the same API endpoints as the remote backend
   - Processes data from local JSON/CSV files
   - Starts automatically when the app launches

2. **Data Synchronization** (DataSyncService.ts)
   - Manages files between app assets and local storage
   - Ensures CSV and JSON files are available offline
   - Handles reading and writing to the local filesystem
   - Implements file versioning and updates

3. **SMS Integration** (SMSService.ts)
   - Integrates with device SMS capabilities via Cordova plugin
   - Provides fallback SMS link method
   - Implements SMS queue for failed messages
   - Tracks delivery status and history

4. **Client API Integration** (queryClient.ts)
   - Intercepts API requests
   - Routes them to the local server instead of remote endpoints
   - Maintains the same API interface
   - No changes needed in frontend components

### Data Flow

1. App startup initializes MobileServerService and DataSyncService
2. Data files are copied from app assets to local storage if needed
3. Local Express server starts on a designated port
4. Frontend components make API calls as normal
5. API calls are intercepted and redirected to local server
6. Local server processes requests using bundled data files
7. Any data changes are persisted to local storage

## Key Features

1. **100% Offline Operation**
   - All data is bundled within the APK
   - No internet required after installation
   - Full functionality preserved offline

2. **SMS Messaging**
   - Direct SMS sending from the app
   - Message queuing and retry mechanism
   - SMS history tracking
   - Fallback to SMS link method

3. **Data Persistence**
   - Changes saved locally using AsyncStorage and Capacitor Preferences
   - File-based storage for larger datasets
   - Data integrity maintained across app restarts

4. **Original API Compatibility**
   - No changes to frontend API calls
   - Same endpoints and response formats
   - Transparent to the rest of the application

## Implementation Files

- `src/services/MobileServerService.ts` - Local Express server
- `src/services/DataSyncService.ts` - File management
- `src/services/SMSService.ts` - SMS functionality
- `src/components/MobileServerProvider.tsx` - React context provider
- `src/lib/queryClient.ts` - API request handling
- `src/utils/asyncStorage.ts` - Persistent storage utilities
- `src/utils/sms.ts` - SMS utility functions
- `src/main.tsx` - App initialization
- `src/capacitor-plugins.ts` - Capacitor plugin registration

## Building the Android APK

1. **Prerequisites**
   - Node.js 16+
   - Android Studio with Android SDK
   - Capacitor CLI

2. **Setup Steps**
   ```bash
   # Install dependencies
   npm install
   
   # Install Cordova SMS plugin
   ./install-cordova-plugins.sh
   
   # Build web assets and prepare Android platform
   ./build-android.sh
   
   # Generate APK (requires Android Studio)
   cd android && ./gradlew assembleDebug
   ```

3. **APK Location**
   The generated APK will be in `android/app/build/outputs/apk/debug/app-debug.apk`

## Android Requirements

1. **Permissions**
   - `INTERNET` - Required for local server
   - `SEND_SMS` - For SMS functionality
   - `READ_PHONE_STATE` - For SMS functionality
   - `READ_EXTERNAL_STORAGE` - For file access
   - `WRITE_EXTERNAL_STORAGE` - For data persistence

2. **Plugins**
   - Capacitor Core
   - Capacitor Filesystem
   - Capacitor Preferences
   - Capacitor Status Bar
   - Cordova SMS Plugin

## Troubleshooting

1. **SMS Permissions**
   - Ensure SMS permissions are granted at runtime
   - Check SMS plugin registration in MainActivity.java
   - Verify SMS queue is processing correctly

2. **File Access Issues**
   - Check folder paths in DataSyncService
   - Ensure proper Android file permissions
   - Verify `file_paths.xml` configuration

3. **Server Not Starting**
   - Check port configuration in MobileServerService
   - Verify app initialization sequence
   - Check for conflicts with other local services

4. **API Call Failures**
   - Verify queryClient intercepts are working
   - Check local server routes match backend endpoints
   - Ensure data files are accessible to the server