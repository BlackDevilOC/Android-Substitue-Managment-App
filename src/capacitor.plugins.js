import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Register Capacitor plugins
export const initializeCapacitorPlugins = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('Running on a native platform');
      
      // Hide the splash screen
      await SplashScreen.hide();
      
      // Configure status bar
      if (StatusBar) {
        try {
          await StatusBar.setStyle({ style: 'light' });
          if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setBackgroundColor({ color: '#000000' });
          }
        } catch (error) {
          console.error('Error configuring status bar:', error);
        }
      }
    } else {
      console.log('Running on web');
    }
    
    // Setup directories with Filesystem API
    if (Capacitor.isPluginAvailable('Filesystem')) {
      // Create necessary directories
      try {
        await Filesystem.mkdir({
          path: 'data',
          directory: Capacitor.FilesystemDirectory.Data,
          recursive: true
        });
      } catch (error) {
        if (!error.message.includes('exists')) {
          console.error('Error creating data directory:', error);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Capacitor plugins:', error);
    return false;
  }
};

export default initializeCapacitorPlugins;