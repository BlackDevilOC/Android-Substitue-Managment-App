# Substitute Management Mobile App

## Overview

This is a mobile application for teacher substitution management, built using React with TypeScript and Capacitor for native mobile capabilities. The app is designed to work 100% offline by running a local Express server on the device and bundling all necessary data files within the APK.

## Key Features

- **100% Offline Operation**: All functionality works without internet connectivity
- **Local Express Server**: Processes data from bundled JSON/CSV files
- **SMS Integration**: Send messages directly from the app
- **Data Synchronization**: File management between app assets and local storage
- **Original API Compatibility**: No changes needed to frontend code

## Project Structure

```
├── src/
│   ├── services/
│   │   ├── MobileServerService.ts  # Local Express server
│   │   ├── DataSyncService.ts      # File synchronization
│   │   └── SMSService.ts           # SMS functionality
│   ├── components/
│   │   └── MobileServerProvider.tsx # React context provider
│   ├── lib/
│   │   └── queryClient.ts          # API request interception
│   ├── utils/
│   │   ├── asyncStorage.ts         # Storage utilities
│   │   └── sms.ts                  # SMS utilities
│   ├── main.tsx                    # App initialization
│   └── capacitor-plugins.ts        # Capacitor plugin registration
├── android/                        # Android platform files
├── data/                           # Data files to be bundled
├── install-cordova-plugins.sh      # Script to install plugins
└── build-android.sh                # Script to build Android APK
```

## Technical Implementation

### Local Express Server

The app runs an Express server directly on the device, which:

1. Processes JSON and CSV files
2. Provides API endpoints identical to the backend
3. Handles data persistence
4. Serves as a drop-in replacement for the remote API

See [MobileServerService Documentation](docs/MobileServerService.md) for details.

### Data Synchronization

The app manages all data files through the DataSyncService, which:

1. Copies bundled files to local storage
2. Provides read/write access
3. Maintains file versioning
4. Ensures all necessary data is available offline

See [DataSyncService Documentation](docs/DataSyncService.md) for details.

### SMS Functionality

Native SMS capability is provided through the SMSService, which:

1. Sends SMS messages using the device's native SMS functionality
2. Queues failed messages for later retry
3. Tracks message history
4. Provides fallback methods

See [SMSService Documentation](docs/SMSService.md) for details.

### API Request Interception

The app intercepts all API requests and redirects them to the local server:

```typescript
// In queryClient.ts
function getApiUrl(url: string): string {
  if (Platform.isNative) {
    // In native mobile context, use the local server URL
    return `http://localhost:5000${url}`;
  }
  // In web context, use the relative URL
  return url;
}
```

This allows the frontend code to remain unchanged while running in an offline environment.

## Setup and Installation

### Prerequisites

- Node.js 16+
- Android Studio with Android SDK
- Capacitor CLI

### Development Setup

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Install Cordova SMS plugin
   ```bash
   chmod +x install-cordova-plugins.sh
   ./install-cordova-plugins.sh
   ```

### Building Android APK

Use the provided build script to generate the Android APK:

```bash
chmod +x build-android.sh
./build-android.sh
```

The generated APK will be in `android/app/build/outputs/apk/debug/app-debug.apk`

See [Android Build Guide](ANDROID_BUILD_GUIDE.md) for detailed build instructions.

## Data Files

The following data files are bundled with the app:

- `total_teacher.json`: List of all teachers
- `absent_teachers.json`: Currently absent teachers
- `assigned_teacher.json`: Substitute assignments
- `class_schedules.json`: Class timetables
- `period_config.json`: Period timing settings
- `sms_history.json`: SMS message history

These files are automatically copied to the app's local storage during initialization.

## Testing

To test the app:

1. Generate and install the APK on a device or emulator
2. Launch the app and ensure it starts correctly
3. Verify that the local server initializes successfully
4. Test API functionality to ensure data is being processed correctly
5. Test SMS functionality (requires a physical device with SMS capability)

## Troubleshooting

### Common Issues

1. **App crashes on startup**
   - Check initialization sequence in main.tsx
   - Verify all required services are started
   - Look for errors in Android logs (`adb logcat`)

2. **Data not loading**
   - Verify file paths in DataSyncService
   - Check asset bundling process
   - Ensure data directory is writeable

3. **SMS not working**
   - Verify permissions in AndroidManifest.xml
   - Check SMS plugin configuration
   - Ensure device has SMS capability

4. **API calls failing**
   - Verify queryClient intercepts are working
   - Check local server routes match backend endpoints
   - Ensure correct port configuration in MobileServerService

For more detailed information, see the [Mobile App Documentation](MOBILE_APP.md).