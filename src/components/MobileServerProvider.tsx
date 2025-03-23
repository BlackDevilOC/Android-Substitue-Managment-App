import React, { createContext, useContext, useEffect, useState } from 'react';
import { mobileServer } from '../services/MobileServerService';
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

  // Start the server when the app loads (on native platforms only)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      startServer();
    }
  }, []);

  // Check server status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = mobileServer.getStatus();
      setIsServerRunning(status.isRunning);
      setServerError(status.error);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startServer = async () => {
    try {
      console.log('[MobileServerProvider] Starting server...');
      await mobileServer.start();
      setIsServerRunning(true);
      setServerError(null);
    } catch (error) {
      console.error('[MobileServerProvider] Failed to start server:', error);
      setIsServerRunning(false);
      setServerError(error instanceof Error ? error.message : 'Unknown error starting server');
    }
  };

  const stopServer = () => {
    try {
      console.log('[MobileServerProvider] Stopping server...');
      mobileServer.stop();
      setIsServerRunning(false);
    } catch (error) {
      console.error('[MobileServerProvider] Failed to stop server:', error);
      setServerError(error instanceof Error ? error.message : 'Unknown error stopping server');
    }
  };

  const processCSV = async (fileContent: string, isSubstitute: boolean) => {
    try {
      console.log('[MobileServerProvider] Processing CSV file...');
      await mobileServer.processUploadedCSV(fileContent, isSubstitute);
    } catch (error) {
      console.error('[MobileServerProvider] Failed to process CSV:', error);
      setServerError(error instanceof Error ? error.message : 'Unknown error processing CSV');
      throw error;
    }
  };

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