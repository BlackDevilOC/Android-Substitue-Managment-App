import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { mobileServer } from '../services/MobileServerService';
import { dataSync } from '../services/DataSyncService';
import { SMSService } from '../services/SMSService';

// Context type definition
interface MobileServerContextType {
  isServerRunning: boolean;
  startServer: () => Promise<void>;
  stopServer: () => void;
  processCSV: (fileContent: string, isSubstitute: boolean) => Promise<void>;
  serverError: string | null;
}

// Create context
const MobileServerContext = createContext<MobileServerContextType | null>(null);

// Hook to use the mobile server context
export const useMobileServer = () => {
  const context = useContext(MobileServerContext);
  if (!context) {
    throw new Error('useMobileServer must be used within a MobileServerProvider');
  }
  return context;
};

// Provider props interface
interface MobileServerProviderProps {
  children: React.ReactNode;
}

// The Provider component
export const MobileServerProvider: React.FC<MobileServerProviderProps> = ({ children }) => {
  const [isServerRunning, setIsServerRunning] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          console.log('[MobileServerProvider] Initializing in native platform mode');
          await dataSync.initialize();
          
          // Start the server automatically
          await startServer();
          
          // Process any pending SMS
          setTimeout(() => {
            SMSService.processQueue()
              .then(remainingCount => {
                console.log(`[MobileServerProvider] Processed SMS queue, ${remainingCount} messages remaining`);
              })
              .catch(error => {
                console.error('[MobileServerProvider] Error processing SMS queue:', error);
              });
          }, 5000);
        } else {
          console.log('[MobileServerProvider] Initializing in web mode');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[MobileServerProvider] Initialization error:', error);
        setServerError('Failed to initialize mobile server');
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (isServerRunning) {
        stopServer();
      }
    };
  }, []);

  // Start the server
  const startServer = async (): Promise<void> => {
    try {
      if (isServerRunning) {
        console.log('[MobileServerProvider] Server is already running');
        return;
      }

      console.log('[MobileServerProvider] Starting server...');
      await mobileServer.start();
      setIsServerRunning(true);
      setServerError(null);
      console.log('[MobileServerProvider] Server started');
    } catch (error) {
      console.error('[MobileServerProvider] Server start error:', error);
      setServerError('Failed to start mobile server');
      setIsServerRunning(false);
    }
  };

  // Stop the server
  const stopServer = (): void => {
    try {
      if (!isServerRunning) {
        console.log('[MobileServerProvider] Server is not running');
        return;
      }

      console.log('[MobileServerProvider] Stopping server...');
      mobileServer.stop();
      setIsServerRunning(false);
      console.log('[MobileServerProvider] Server stopped');
    } catch (error) {
      console.error('[MobileServerProvider] Server stop error:', error);
      setServerError('Failed to stop mobile server');
    }
  };

  // Process uploaded CSV files
  const processCSV = async (fileContent: string, isSubstitute: boolean): Promise<void> => {
    try {
      console.log(`[MobileServerProvider] Processing ${isSubstitute ? 'substitute' : 'timetable'} CSV...`);
      await mobileServer.processUploadedCSV(fileContent, isSubstitute);
      console.log('[MobileServerProvider] CSV processed successfully');
    } catch (error) {
      console.error('[MobileServerProvider] CSV processing error:', error);
      setServerError('Failed to process CSV file');
      throw error;
    }
  };

  // Context value
  const value: MobileServerContextType = {
    isServerRunning,
    startServer,
    stopServer,
    processCSV,
    serverError,
  };

  // Render loading state until initialized
  if (!isInitialized && Capacitor.isNativePlatform()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing offline mode...</p>
        </div>
      </div>
    );
  }

  // Render provider with context
  return (
    <MobileServerContext.Provider value={value}>
      {serverError && Capacitor.isNativePlatform() && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 fixed top-0 left-0 right-0 z-50">
          <p className="font-bold">Server Error</p>
          <p>{serverError}</p>
        </div>
      )}
      {children}
    </MobileServerContext.Provider>
  );
};