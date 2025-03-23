import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

/**
 * Register Capacitor plugins for both native and web platforms
 */
export function registerPlugins() {
  try {
    console.log('[Plugins] Registering Capacitor plugins');
    
    // Register PWA elements for file pickers on web
    defineCustomElements(window);

    // Initialize status bar on native platforms
    if (Capacitor.isNativePlatform()) {
      initStatusBar();
      hideSplashScreen();
      setupFilesystem();
    }
    
    console.log('[Plugins] Capacitor plugins registered successfully');
  } catch (error) {
    console.error('[Plugins] Error registering Capacitor plugins:', error);
  }
}

/**
 * Initialize the status bar with default settings
 */
async function initStatusBar() {
  try {
    await StatusBar.setBackgroundColor({ color: '#3880ff' });
    await StatusBar.setStyle({ style: 'light' });
    console.log('[Plugins] Status bar initialized');
  } catch (error) {
    console.error('[Plugins] Error initializing status bar:', error);
  }
}

/**
 * Hide the splash screen after app is ready
 */
async function hideSplashScreen() {
  try {
    await SplashScreen.hide();
    console.log('[Plugins] Splash screen hidden');
  } catch (error) {
    console.error('[Plugins] Error hiding splash screen:', error);
  }
}

/**
 * Set up filesystem directories for the app
 */
async function setupFilesystem() {
  try {
    // Create app directories
    const directories = ['data', 'temp', 'cache'];
    
    for (const dir of directories) {
      try {
        await Filesystem.mkdir({
          path: dir,
          directory: Directory.Data,
          recursive: true
        });
        console.log(`[Plugins] Created directory: ${dir}`);
      } catch (error) {
        // Directory might already exist, that's fine
        console.log(`[Plugins] Directory ${dir} might already exist`);
      }
    }

    // Set up cache directory for temporary files
    try {
      await Filesystem.mkdir({
        path: 'app-cache',
        directory: Directory.Cache,
        recursive: true
      });
      console.log('[Plugins] Created cache directory');
    } catch (error) {
      console.log('[Plugins] Cache directory might already exist');
    }
  } catch (error) {
    console.error('[Plugins] Error setting up filesystem:', error);
  }
}