import { useServer } from "@/context/ServerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, Download } from "lucide-react";

export default function LogsSection() {
  const { logs, clearLogs } = useServer();

  const handleDownloadLogs = () => {
    // Create a blob with log content
    const logText = logs.map(log => `[${log.time}] ${log.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `server-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
      default:
        return 'text-blue-400';
    }
  };

  return (
    <section>
      <Card className="bg-surface shadow-md">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                <line x1="9" y1="9" x2="19" y2="9" />
                <line x1="9" y1="15" x2="19" y2="15" />
                <line x1="9" y1="21" x2="19" y2="21" />
                <line x1="9" y1="3" x2="19" y2="3" />
              </svg>
              Server Logs
            </h2>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-text-secondary hover:text-primary"
                onClick={clearLogs}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-text-secondary hover:text-primary"
                onClick={handleDownloadLogs}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="border border-divider rounded-md bg-gray-900 text-gray-200 h-48 overflow-auto font-mono text-sm">
            <div className="p-3 leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">No logs yet</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={getLogClass(log.type)}>
                    [{log.time}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
