import React, { createContext, useContext, useEffect, useState } from 'react';
import { mobileServer } from '../services/MobileServerService';
import { dataSync } from '../services/DataSyncService';
import { Capacitor } from '@capacitor/core';

interface MobileServerContextType {
  isServerRunning: boolean;
  startServer: () => Promise<void>;
  stopServer: () => void;
  processCSV: (fileContent: string, isSubstitute: boolean) => Promise<void>;
  serverError: string | null;
}

const MobileServerContext = createContext<MobileServerContextType | null>(null);

export const useMobileServer = () => {
  const context = useContext(MobileServerContext);
  if (!context) {
    throw new Error('useMobileServer must be used within a MobileServerProvider');
  }
  return context;
};

interface MobileServerProviderProps {
  children: React.ReactNode;
}

export const MobileServerProvider: React.FC<MobileServerProviderProps> = ({ children }) => {
  const [isServerRunning, setIsServerRunning] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDataSyncInitialized, setIsDataSyncInitialized] = useState<boolean>(false);

  // Initialize data sync service
  useEffect(() => {
    const initializeDataSync = async () => {
      try {
        await dataSync.initialize();
        setIsDataSyncInitialized(true);
        console.log('[MobileServerProvider] DataSync service initialized');
      } catch (error) {
        console.error('[MobileServerProvider] Failed to initialize DataSync:', error);
        setServerError('Failed to initialize data sync service');
      }
    };

    initializeDataSync();
  }, []);

  // Start server automatically when data sync is initialized
  useEffect(() => {
    if (isDataSyncInitialized && Capacitor.isNativePlatform()) {
      startServer();
    }
  }, [isDataSyncInitialized]);

  // Start the server
  const startServer = async () => {
    try {
      await mobileServer.start();
      const status = mobileServer.getStatus();
      setIsServerRunning(status.isRunning);
      setServerError(status.error);
      console.log('[MobileServerProvider] Server started');
    } catch (error) {
      console.error('[MobileServerProvider] Failed to start server:', error);
      setIsServerRunning(false);
      setServerError(error instanceof Error ? error.message : 'Unknown error starting server');
    }
  };

  // Stop the server
  const stopServer = () => {
    try {
      mobileServer.stop();
      setIsServerRunning(false);
      setServerError(null);
      console.log('[MobileServerProvider] Server stopped');
    } catch (error) {
      console.error('[MobileServerProvider] Failed to stop server:', error);
      setServerError(error instanceof Error ? error.message : 'Unknown error stopping server');
    }
  };

  // Process CSV file
  const processCSV = async (fileContent: string, isSubstitute: boolean) => {
    try {
      await mobileServer.processUploadedCSV(fileContent, isSubstitute);
      console.log('[MobileServerProvider] CSV processed successfully');
    } catch (error) {
      console.error('[MobileServerProvider] Failed to process CSV:', error);
      throw error;
    }
  };

  // Provide context value
  const value: MobileServerContextType = {
    isServerRunning,
    startServer,
    stopServer,
    processCSV,
    serverError
  };

  return (
    <MobileServerContext.Provider value={value}>
      {children}
    </MobileServerContext.Provider>
  );
};