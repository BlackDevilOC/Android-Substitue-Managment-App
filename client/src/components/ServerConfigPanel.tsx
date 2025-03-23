import { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, ChevronUp, Play, Stop, RefreshCw, Save } from "lucide-react";

export default function ServerConfigPanel() {
  const { 
    config, 
    updateConfig, 
    saveConfig, 
    status, 
    startServer, 
    stopServer, 
    restartServer 
  } = useServer();
  
  const [isOpen, setIsOpen] = useState(true);
  const [tempPort, setTempPort] = useState(config.port.toString());

  const handleSavePort = () => {
    const port = parseInt(tempPort);
    if (!isNaN(port) && port > 0 && port < 65536) {
      updateConfig({ port });
      saveConfig();
    }
  };

  const handleAutoStartChange = (checked: boolean) => {
    updateConfig({ autoStart: checked });
    saveConfig();
  };

  const handleApiPrefixChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ apiPrefix: event.target.value });
  };
  
  const handleDataLocationChange = (value: "bundle" | "external") => {
    updateConfig({ dataLocation: value });
    saveConfig();
  };

  return (
    <div className={`slide-down ${isOpen ? 'max-h-[800px]' : 'max-h-0'} overflow-hidden transition-all duration-300 mb-6`}>
      <Card className="bg-surface shadow-md">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12H5.01M12 12H12.01M19 12H19.01M6 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
              </svg>
              Server Configuration
            </h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary hover:text-primary transition-colors"
            >
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <Label htmlFor="serverPort" className="text-text-secondary text-sm mb-1">
                  Local Server Port
                </Label>
                <div className="flex">
                  <Input
                    id="serverPort"
                    type="number"
                    value={tempPort}
                    onChange={(e) => setTempPort(e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button 
                    className="rounded-l-none" 
                    onClick={handleSavePort}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Default: 8000. Change requires app restart.
                </p>
              </div>
              
              <div className="mb-4">
                <Label className="text-text-secondary text-sm mb-1">
                  Server Auto-Start
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Switch
                    id="autoStart"
                    checked={config.autoStart}
                    onCheckedChange={handleAutoStartChange}
                  />
                  <Label htmlFor="autoStart" className="text-sm font-medium">
                    Start server when app launches
                  </Label>
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="apiPrefix" className="text-text-secondary text-sm mb-1">
                  API Prefix
                </Label>
                <Input
                  id="apiPrefix"
                  value={config.apiPrefix}
                  onChange={handleApiPrefixChange}
                  onBlur={saveConfig}
                />
                <p className="text-xs text-text-secondary mt-1">
                  Example: /api, /v1, etc.
                </p>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <Label className="text-text-secondary text-sm mb-1">
                  Data Files Location
                </Label>
                <RadioGroup 
                  value={config.dataLocation} 
                  onValueChange={(value) => handleDataLocationChange(value as "bundle" | "external")}
                  className="flex flex-col space-y-2 mt-1"
                >
                  <div className="flex items-center space-x-2 p-2 border border-divider rounded-md">
                    <RadioGroupItem value="bundle" id="bundle" />
                    <Label htmlFor="bundle" className="text-sm cursor-pointer">
                      App Bundle (Built-in files)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border border-divider rounded-md">
                    <RadioGroupItem value="external" id="external" />
                    <Label htmlFor="external" className="text-sm cursor-pointer">
                      External Storage
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="mb-4">
                <Label className="text-text-secondary text-sm mb-1">
                  Server Actions
                </Label>
                <div className="flex space-x-2 mt-1">
                  <Button 
                    variant="default" 
                    className="bg-success hover:bg-green-600 text-white"
                    onClick={startServer}
                    disabled={status.status === "running" || status.status === "restarting"}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button 
                    variant="default"
                    className="bg-error hover:bg-red-600 text-white"
                    onClick={stopServer}
                    disabled={status.status === "offline" || status.status === "restarting"}
                  >
                    <Stop className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                  <Button 
                    variant="default"
                    className="bg-info hover:bg-blue-600 text-white"
                    onClick={restartServer}
                    disabled={status.status === "restarting"}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Restart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
