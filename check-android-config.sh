#!/bin/bash
# Script to check if the Android configuration is correctly set up

echo "Running Android configuration check..."
echo "======================================"

# Check that capacitor.config.ts exists
if [ -f capacitor.config.ts ]; then
  echo "✅ capacitor.config.ts found"
else
  echo "❌ capacitor.config.ts not found - this is required for Android builds"
  exit 1
fi

# Check for required Capacitor plugins
echo "Checking for required Capacitor plugins..."
if grep -q "@capacitor/android" package.json; then
  echo "✅ @capacitor/android plugin found in package.json"
else
  echo "❌ @capacitor/android plugin not found in package.json"
  echo "   Run: npm install @capacitor/android"
fi

if grep -q "cordova-sms-plugin" package.json; then
  echo "✅ cordova-sms-plugin found in package.json"
else
  echo "⚠️ cordova-sms-plugin not found in package.json - needed for SMS functionality"
  echo "   Run: npm install cordova-sms-plugin"
fi

# Check that build scripts exist
if [ -f build-android.sh ]; then
  echo "✅ build-android.sh found"
else
  echo "⚠️ build-android.sh not found - this is useful for local builds"
fi

if [ -f install-cordova-plugins.sh ]; then
  echo "✅ install-cordova-plugins.sh found"
else
  echo "⚠️ install-cordova-plugins.sh not found - this helps with plugin installation"
fi

# Check for .github/workflows/android-build.yml
if [ -f .github/workflows/android-build.yml ]; then
  echo "✅ GitHub Actions workflow file found"
else
  echo "❌ GitHub Actions workflow file not found at .github/workflows/android-build.yml"
  echo "   This is needed for automated builds on GitHub"
fi

# Check data directory exists
if [ -d data ]; then
  echo "✅ Data directory found"
  echo "   Found files:"
  ls -la data
else
  echo "⚠️ Data directory not found - make sure your data files are available for bundling"
  echo "   Create a 'data' directory with your CSV/JSON files"
fi

# Check for android directory
if [ -d android ]; then
  echo "✅ Android directory found"
  echo "   This means the Android platform has been added"
else
  echo "ℹ️ Android directory not found - this is expected if you haven't run 'npx cap add android'"
  echo "   The GitHub Actions workflow will create this for you"
fi

echo "======================================"
echo "Check complete. Address any issues before pushing to GitHub."
echo "Review GITHUB_ACTIONS_BUILD.md for more information on the build process."