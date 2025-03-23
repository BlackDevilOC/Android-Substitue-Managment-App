import { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayCircle, Trash2, Plus } from "lucide-react";
import { APIEndpoint } from "@/types";

export default function APIEndpointsSection() {
  const { endpoints, addEndpoint, removeEndpoint, config, files, testAPIRequest } = useServer();
  
  const [newEndpoint, setNewEndpoint] = useState<Partial<APIEndpoint>>({
    method: "GET",
    path: "",
    source: files.length > 0 ? files[0].name : ""
  });

  const handleAddEndpoint = () => {
    if (!newEndpoint.path || !newEndpoint.source || !newEndpoint.method) {
      return;
    }
    
    // Make sure path starts with the API prefix
    let path = newEndpoint.path;
    if (!path.startsWith(config.apiPrefix)) {
      path = `${config.apiPrefix}${path.startsWith('/') ? path : `/${path}`}`;
    }
    
    addEndpoint({
      method: newEndpoint.method as "GET" | "POST" | "PUT" | "DELETE",
      path,
      source: newEndpoint.source
    });
    
    // Reset form
    setNewEndpoint({
      method: "GET",
      path: "",
      source: files.length > 0 ? files[0].name : ""
    });
  };

  const handleTestEndpoint = (endpoint: APIEndpoint) => {
    // Build the URL
    const url = `http://localhost:${config.port}${endpoint.path}`;
    testAPIRequest(endpoint.method, url);
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-primary';
      case 'POST':
        return 'bg-green-100 text-green-700';
      case 'PUT':
        return 'bg-amber-100 text-amber-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section className="mb-6">
      <Card className="bg-surface shadow-md">
        <CardContent className="p-5">
          <h2 className="text-lg font-medium flex items-center mb-4">
            <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 10h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Z" />
            </svg>
            API Endpoints
          </h2>
          
          <div className="mb-4">
            <Label className="text-text-secondary text-sm mb-2">Registered Endpoints</Label>
            
            <div className="bg-gray-50 border border-divider rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-divider">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-text-secondary">
                  <div className="col-span-2">Method</div>
                  <div className="col-span-5">Endpoint</div>
                  <div className="col-span-3">Source File</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {endpoints.length === 0 ? (
                  <div className="p-4 text-center text-text-secondary text-sm">
                    No endpoints registered
                  </div>
                ) : (
                  endpoints.map((endpoint, index) => (
                    <div key={index} className="px-4 py-3 border-b border-divider last:border-b-0 hover:bg-gray-100">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                          <span className={`text-xs font-medium ${getMethodBadgeClass(endpoint.method)} px-2 py-1 rounded`}>
                            {endpoint.method}
                          </span>
                        </div>
                        <div className="col-span-5">
                          <span className="text-sm font-mono">{endpoint.path}</span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-sm">{endpoint.source}</span>
                        </div>
                        <div className="col-span-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-info hover:text-primary h-8 w-8"
                              title="Test"
                              onClick={() => handleTestEndpoint(endpoint)}
                            >
                              <PlayCircle className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-error hover:text-red-700 h-8 w-8"
                              title="Remove"
                              onClick={() => removeEndpoint(endpoint.path)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-text-secondary text-sm">Add New Endpoint</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-3">
                  <Label className="text-text-secondary text-xs mb-1" htmlFor="endpointMethod">
                    Method
                  </Label>
                  <Select 
                    value={newEndpoint.method}
                    onValueChange={(value) => setNewEndpoint(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger id="endpointMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-3">
                  <Label className="text-text-secondary text-xs mb-1" htmlFor="endpointPath">
                    Endpoint Path
                  </Label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-divider rounded-l-md text-text-secondary text-sm">
                      {config.apiPrefix}
                    </span>
                    <Input
                      id="endpointPath"
                      placeholder="/users"
                      value={newEndpoint.path}
                      onChange={(e) => setNewEndpoint(prev => ({ ...prev, path: e.target.value }))}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-3">
                  <Label className="text-text-secondary text-xs mb-1" htmlFor="endpointSource">
                    Data Source
                  </Label>
                  <Select 
                    value={newEndpoint.source}
                    onValueChange={(value) => setNewEndpoint(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger id="endpointSource">
                      <SelectValue placeholder="Select source file" />
                    </SelectTrigger>
                    <SelectContent>
                      {files.map((file, index) => (
                        <SelectItem key={index} value={file.name}>{file.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end h-10">
                  <Button 
                    variant="default" 
                    className="bg-primary hover:bg-primary-dark text-white"
                    onClick={handleAddEndpoint}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Endpoint
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
