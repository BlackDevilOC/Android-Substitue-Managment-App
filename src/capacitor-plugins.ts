import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

/**
 * Register Capacitor plugins for both native and web platforms
 */
export function registerPlugins() {
  try {
    // Register custom elements for web implementation of native features
    defineCustomElements(window);
    
    console.log('[Plugins] Running on platform:', Capacitor.getPlatform());
    
    if (Capacitor.isNativePlatform()) {
      // Set up status bar (Android/iOS only)
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#333333' });
      
      // Hide splash screen with fade out animation
      SplashScreen.hide({
        fadeOutDuration: 300
      });
      
      console.log('[Plugins] Native platform plugins registered');
    } else {
      console.log('[Plugins] Web platform plugins registered');
    }
    
    // Set up filesystem directories
    setupFilesystem();
  } catch (error) {
    console.error('[Plugins] Error registering plugins:', error);
  }
}

/**
 * Set up filesystem directories for the app
 */
async function setupFilesystem() {
  try {
    if (!Capacitor.isNativePlatform()) {
      console.log('[Plugins] Running in browser, skipping filesystem setup');
      return;
    }
    
    // Ensure data directory exists
    try {
      const result = await Filesystem.mkdir({
        path: 'data',
        directory: Directory.Documents,
        recursive: true
      });
      console.log('[Plugins] Data directory created:', result);
    } catch (error) {
      // Directory might already exist
      console.log('[Plugins] Data directory may already exist');
    }
    
    // Ensure cache directory exists for temporary files
    try {
      const result = await Filesystem.mkdir({
        path: 'cache',
        directory: "CACHE",
        recursive: true
      });
      console.log('[Plugins] Cache directory created:', result);
    } catch (error) {
      // Directory might already exist
      console.log('[Plugins] Cache directory may already exist');
    }
  } catch (error) {
    console.error('[Plugins] Error setting up filesystem:', error);
  }
}