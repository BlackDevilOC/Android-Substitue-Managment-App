import { useState } from "react";
import { useServer } from "@/context/ServerContext";
import ServerConfigPanel from "@/components/ServerConfigPanel";
import DataFilesSection from "@/components/DataFilesSection";
import APIEndpointsSection from "@/components/APIEndpointsSection";
import TestAPISection from "@/components/TestAPISection";
import LogsSection from "@/components/LogsSection";
import Toast from "@/components/Toast";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { status } = useServer();
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as const });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const getStatusColor = () => {
    switch (status.status) {
      case "running":
        return "bg-success";
      case "offline":
        return "bg-error";
      case "restarting":
        return "bg-info";
      default:
        return "bg-error";
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case "running":
        return "mdi-check-circle";
      case "offline":
        return "mdi-close-circle";
      case "restarting":
        return "mdi-refresh";
      default:
        return "mdi-close-circle";
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "running":
        return "Running";
      case "offline":
        return "Offline";
      case "restarting":
        return "Restarting...";
      default:
        return "Offline";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-surface shadow-md px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <h1 className="text-xl font-medium">Local Server Config</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`status-badge text-sm px-3 py-1 rounded-full text-white ${getStatusColor()}`}>
              <span className="flex items-center">
                <i className={`mdi ${getStatusIcon()} mr-1`}></i>
                {getStatusText()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-200 focus:outline-none transition-colors p-2"
              onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
            >
              {settingsPanelOpen ? (
                <X className="h-5 w-5 text-text-secondary" />
              ) : (
                <Settings className="h-5 w-5 text-text-secondary" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {settingsPanelOpen && <ServerConfigPanel />}
        <DataFilesSection />
        <APIEndpointsSection />
        <TestAPISection />
        <LogsSection />
      </main>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
}
