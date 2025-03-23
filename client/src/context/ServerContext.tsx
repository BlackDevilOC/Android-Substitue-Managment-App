import React, { createContext, useState, useContext, useEffect } from "react";
import { 
  ServerConfig, 
  ServerStatus, 
  DataFile, 
  APIEndpoint, 
  ServerLog, 
  TestResponse 
} from "@/types";
import { startServer, stopServer, restartServer, testEndpoint } from "@/lib/server";

interface ServerContextType {
  config: ServerConfig;
  updateConfig: (config: Partial<ServerConfig>) => void;
  saveConfig: () => void;
  status: ServerStatus;
  files: DataFile[];
  refreshFiles: () => void;
  endpoints: APIEndpoint[];
  addEndpoint: (endpoint: APIEndpoint) => void;
  removeEndpoint: (path: string) => void;
  logs: ServerLog[];
  addLog: (log: ServerLog) => void;
  clearLogs: () => void;
  testResponse: TestResponse | null;
  setTestResponse: (response: TestResponse | null) => void;
  startServer: () => void;
  stopServer: () => void;
  restartServer: () => void;
  testAPIRequest: (method: string, url: string, body?: any) => Promise<void>;
}

const defaultConfig: ServerConfig = {
  port: 8000,
  autoStart: true,
  apiPrefix: "/api",
  dataLocation: "bundle"
};

const defaultStatus: ServerStatus = {
  running: false,
  status: "offline"
};

const mockFiles: DataFile[] = [
  { 
    name: "users.json", 
    path: "/data/users.json", 
    size: "24.6 KB", 
    type: "json" 
  },
  { 
    name: "products.csv", 
    path: "/data/products.csv", 
    size: "156.3 KB", 
    type: "csv" 
  },
  { 
    name: "orders.json", 
    path: "/data/orders.json", 
    size: "87.1 KB", 
    type: "json" 
  }
];

const defaultEndpoints: APIEndpoint[] = [
  { method: "GET", path: "/api/users", source: "users.json" },
  { method: "POST", path: "/api/orders", source: "orders.json" },
  { method: "GET", path: "/api/products", source: "products.csv" }
];

const ServerContext = createContext<ServerContextType>({} as ServerContextType);

export const ServerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [config, setConfig] = useState<ServerConfig>(defaultConfig);
  const [status, setStatus] = useState<ServerStatus>(defaultStatus);
  const [files, setFiles] = useState<DataFile[]>(mockFiles);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>(defaultEndpoints);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [testResponse, setTestResponse] = useState<TestResponse | null>(null);

  useEffect(() => {
    // Load config from localStorage if available
    const savedConfig = localStorage.getItem('serverConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    // Start server if autoStart is enabled
    if (config.autoStart) {
      handleStartServer();
    }
    
    // Initial log entry
    addLog({
      time: formatTime(new Date()),
      message: "Application started",
      type: "info"
    });
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const updateConfig = (newConfig: Partial<ServerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const saveConfig = () => {
    localStorage.setItem('serverConfig', JSON.stringify(config));
    addLog({
      time: formatTime(new Date()),
      message: "Configuration saved",
      type: "success"
    });
  };

  const refreshFiles = () => {
    // In a real app, this would scan the filesystem
    addLog({
      time: formatTime(new Date()),
      message: "Files refreshed",
      type: "info"
    });
  };

  const addEndpoint = (endpoint: APIEndpoint) => {
    setEndpoints(prev => [...prev, endpoint]);
    addLog({
      time: formatTime(new Date()),
      message: `Added endpoint: ${endpoint.method} ${endpoint.path}`,
      type: "success"
    });
  };

  const removeEndpoint = (path: string) => {
    setEndpoints(prev => prev.filter(e => e.path !== path));
    addLog({
      time: formatTime(new Date()),
      message: `Removed endpoint: ${path}`,
      type: "info"
    });
  };

  const addLog = (log: ServerLog) => {
    setLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
    addLog({
      time: formatTime(new Date()),
      message: "Logs cleared",
      type: "info"
    });
  };

  const handleStartServer = async () => {
    try {
      setStatus({ running: false, status: "restarting" });
      addLog({
        time: formatTime(new Date()),
        message: "Starting server...",
        type: "info"
      });
      
      await startServer(config);
      
      setStatus({ running: true, status: "running" });
      addLog({
        time: formatTime(new Date()),
        message: `Server started on port ${config.port}`,
        type: "success"
      });
    } catch (error) {
      setStatus({ running: false, status: "offline" });
      addLog({
        time: formatTime(new Date()),
        message: `Failed to start server: ${(error as Error).message}`,
        type: "error"
      });
    }
  };

  const handleStopServer = async () => {
    try {
      setStatus({ running: false, status: "restarting" });
      addLog({
        time: formatTime(new Date()),
        message: "Stopping server...",
        type: "info"
      });
      
      await stopServer();
      
      setStatus({ running: false, status: "offline" });
      addLog({
        time: formatTime(new Date()),
        message: "Server stopped",
        type: "info"
      });
    } catch (error) {
      setStatus({ running: false, status: "offline" });
      addLog({
        time: formatTime(new Date()),
        message: `Failed to stop server: ${(error as Error).message}`,
        type: "error"
      });
    }
  };

  const handleRestartServer = async () => {
    try {
      setStatus({ running: false, status: "restarting" });
      addLog({
        time: formatTime(new Date()),
        message: "Restarting server...",
        type: "info"
      });
      
      await restartServer(config);
      
      setStatus({ running: true, status: "running" });
      addLog({
        time: formatTime(new Date()),
        message: `Server restarted on port ${config.port}`,
        type: "success"
      });
    } catch (error) {
      setStatus({ running: false, status: "offline" });
      addLog({
        time: formatTime(new Date()),
        message: `Failed to restart server: ${(error as Error).message}`,
        type: "error"
      });
    }
  };

  const testAPIRequest = async (method: string, url: string, body?: any) => {
    try {
      addLog({
        time: formatTime(new Date()),
        message: `Testing ${method} ${url}`,
        type: "info"
      });
      
      const startTime = Date.now();
      const response = await testEndpoint(method, url, body);
      const duration = Date.now() - startTime;
      
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        duration,
        data: response.data
      });
      
      addLog({
        time: formatTime(new Date()),
        message: `${method} ${url} (${response.status} ${response.statusText}, ${duration}ms)`,
        type: response.status >= 200 && response.status < 300 ? "success" : "error"
      });
    } catch (error) {
      addLog({
        time: formatTime(new Date()),
        message: `Request failed: ${(error as Error).message}`,
        type: "error"
      });
      
      setTestResponse({
        status: 500,
        statusText: "Error",
        duration: 0,
        data: { error: (error as Error).message }
      });
    }
  };

  return (
    <ServerContext.Provider value={{
      config,
      updateConfig,
      saveConfig,
      status,
      files,
      refreshFiles,
      endpoints,
      addEndpoint,
      removeEndpoint,
      logs,
      addLog,
      clearLogs,
      testResponse,
      setTestResponse,
      startServer: handleStartServer,
      stopServer: handleStopServer,
      restartServer: handleRestartServer,
      testAPIRequest
    }}>
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => useContext(ServerContext);
