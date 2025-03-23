import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { registerPlugins } from './capacitor-plugins';

// Register Capacitor plugins
registerPlugins();

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Log platform info
    console.log(`Running on platform: ${Capacitor.getPlatform()}`);
    console.log(`Is native: ${Capacitor.isNativePlatform()}`);
    
    // Render the application
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('Application initialized');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

// Start the application
initializeApp();