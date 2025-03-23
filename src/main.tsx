import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './hooks/use-auth';
import { MobileServerProvider } from './components/MobileServerProvider';
import { registerPlugins } from './capacitor-plugins';
import { SMSService } from './services/SMSService';

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Register Capacitor plugins for mobile platforms
    await registerPlugins();
    
    // Process any pending SMS messages in the queue
    await SMSService.processQueue();
    
    // Set up processing of SMS queue every 5 minutes
    setInterval(async () => {
      await SMSService.processQueue();
    }, 5 * 60 * 1000);
    
    // Render the React application
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MobileServerProvider>
              <App />
            </MobileServerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
    
    console.log('[App] Application initialized successfully');
  } catch (error) {
    console.error('[App] Error initializing application:', error);
  }
}

// Start the application
initializeApp();