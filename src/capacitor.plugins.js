// This file is used to register all Capacitor plugins
// It will be copied to the Android assets directory during build

// Import Capacitor core plugins
import { registerPlugin } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

// Initialize the plugins
export const initializeCapacitorPlugins = async () => {
  console.log('Initializing Capacitor plugins...');
  // Any additional plugin initialization can go here
};

// Export plugins if needed for direct access
export {
  Filesystem,
  Preferences,
  SplashScreen,
  StatusBar
};