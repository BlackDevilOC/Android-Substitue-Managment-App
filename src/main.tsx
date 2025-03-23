import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { registerPlugins } from './capacitor-plugins';
import App from './App';
import './index.css';
import { MobileServerProvider } from './components/MobileServerProvider';
import { Capacitor } from '@capacitor/core';
import { dataSync } from './services/DataSyncService';
import { SMSService } from './services/SMSService';

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    console.log('[Main] Initializing application...');
    console.log('[Main] Platform:', Capacitor.getPlatform());
    
    // Register Capacitor plugins (status bar, splash screen, etc.)
    registerPlugins();
    
    // Initialize mobile services (on native platforms only)
    if (Capacitor.isNativePlatform()) {
      console.log('[Main] Initializing mobile services...');
      
      try {
        // Initialize data sync service
        await dataSync.initialize();
        
        // Process SMS queue (try to send any pending messages)
        await SMSService.processQueue();
      } catch (error) {
        console.error('[Main] Error initializing mobile services:', error);
      }
    }
    
    // Render the application
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <MobileServerProvider>
            <App />
          </MobileServerProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
    
    console.log('[Main] Application initialized');
  } catch (error) {
    console.error('[Main] Error initializing application:', error);
  }
}

// Start the application
initializeApp();