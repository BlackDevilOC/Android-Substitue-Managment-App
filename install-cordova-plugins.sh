#!/bin/bash

# Install the necessary Capacitor plugins
npm install cordova-sms-plugin

# Create a temporary directory for plugins
mkdir -p plugins

# Clone the SMS plugin repository
git clone https://github.com/cordova-sms/cordova-sms-plugin.git plugins/cordova-sms-plugin

# Run Capacitor sync to update configs
npx cap sync

echo "Cordova SMS plugin installed successfully!"