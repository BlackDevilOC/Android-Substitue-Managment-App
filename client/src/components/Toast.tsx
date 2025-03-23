import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ 
  message, 
  type = "success", 
  duration = 3000, 
  visible, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 mr-2" />;
      case "error":
        return <AlertCircle className="h-5 w-5 mr-2" />;
      case "info":
        return <Info className="h-5 w-5 mr-2" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-success";
      case "error":
        return "bg-error";
      case "info":
        return "bg-info";
      default:
        return "bg-gray-800";
    }
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-md text-white shadow-lg flex items-center transition-opacity duration-300 ${getBackgroundColor()} ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {getIcon()}
      <span>{message}</span>
    </div>
  );
}
