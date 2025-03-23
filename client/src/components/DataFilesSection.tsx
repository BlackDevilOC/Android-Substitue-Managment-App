import { useServer } from "@/context/ServerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileJson, FileSpreadsheet, RefreshCw, FolderPlus, FileUp } from "lucide-react";

export default function DataFilesSection() {
  const { files, refreshFiles } = useServer();

  const handleBrowseFiles = () => {
    // In a real app, this would open a file picker
    alert("In a real app, this would open a file picker");
  };

  const handleImportFromStorage = () => {
    // In a real app, this would open a file picker
    alert("In a real app, this would import files from external storage");
  };

  const handleViewFile = (fileName: string) => {
    // In a real app, this would show file contents
    alert(`Viewing file: ${fileName}`);
  };

  const getFileIcon = (type: string) => {
    if (type === "json") {
      return <FileJson className="h-5 w-5 text-amber-500" />;
    } else if (type === "csv") {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    return null;
  };

  return (
    <section className="mb-6">
      <Card className="bg-surface shadow-md">
        <CardContent className="p-5">
          <h2 className="text-lg font-medium flex items-center mb-4">
            <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Data Files
          </h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-text-secondary text-sm">Available Data Files</Label>
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary"
                onClick={refreshFiles}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            
            <div className="bg-gray-50 border border-divider rounded-md max-h-60 overflow-y-auto">
              {files.length === 0 ? (
                <div className="p-4 text-center text-text-secondary text-sm">
                  No data files available
                </div>
              ) : (
                files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3 border-b border-divider last:border-b-0 hover:bg-gray-100">
                    <div className="flex items-center">
                      {getFileIcon(file.type)}
                      <span className="text-sm ml-2">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{file.size}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-info hover:text-primary h-8 w-8"
                        title="View"
                        onClick={() => handleViewFile(file.name)}
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-text-secondary text-sm">Add/Update Data Files</Label>
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary-dark text-white"
                onClick={handleBrowseFiles}
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                Browse Files
              </Button>
              <Button 
                variant="default"
                className="bg-secondary hover:bg-secondary-dark text-white"
                onClick={handleImportFromStorage}
              >
                <FileUp className="h-4 w-4 mr-1" />
                Import From Storage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
