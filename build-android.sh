#!/bin/bash

echo "Starting Android build process..."

# Make sure we have the latest dependencies
npm install

# Build the web assets
echo "Building web assets..."
npm run build

# Copy the essential data files to the assets folder for bundling
echo "Copying data files to assets..."
mkdir -p android/app/src/main/assets/public/data
cp -r data/* android/app/src/main/assets/public/data/

# Sync Capacitor assets and configuration
echo "Syncing Capacitor..."
npx cap sync android

# Open Android Studio for final build (alternatively, can use command line build)
echo "Build complete!"
echo "To create the final APK, run:"
echo "cd android && ./gradlew assembleDebug"
echo "The APK will be in android/app/build/outputs/apk/debug/app-debug.apk"