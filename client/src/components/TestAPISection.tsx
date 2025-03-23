import { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";

export default function TestAPISection() {
  const { config, testAPIRequest, testResponse } = useServer();
  
  const [requestMethod, setRequestMethod] = useState<string>("GET");
  const [requestUrl, setRequestUrl] = useState<string>("");
  const [requestBody, setRequestBody] = useState<string>("");

  const handleSendRequest = () => {
    // Build full URL if needed
    let url = requestUrl;
    if (!url.startsWith('http')) {
      url = `http://localhost:${config.port}${url.startsWith('/') ? url : `/${url}`}`;
    }
    
    // Parse body if present
    let body = undefined;
    if (requestBody.trim() && (requestMethod === "POST" || requestMethod === "PUT")) {
      try {
        body = JSON.parse(requestBody);
      } catch (error) {
        alert("Invalid JSON in request body");
        return;
      }
    }
    
    testAPIRequest(requestMethod, url, body);
  };

  return (
    <section className="mb-6">
      <Card className="bg-surface shadow-md">
        <CardContent className="p-5">
          <h2 className="text-lg font-medium flex items-center mb-4">
            <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Test API Requests
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-3">
                <Label htmlFor="requestMethod" className="text-text-secondary text-sm mb-1">
                  Method
                </Label>
                <Select 
                  value={requestMethod}
                  onValueChange={setRequestMethod}
                >
                  <SelectTrigger id="requestMethod">
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
                <Label htmlFor="requestUrl" className="text-text-secondary text-sm mb-1">
                  URL
                </Label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-divider rounded-l-md text-text-secondary text-sm">
                    http://localhost:{config.port}
                  </span>
                  <Input
                    id="requestUrl"
                    placeholder="/api/users"
                    value={requestUrl}
                    onChange={(e) => setRequestUrl(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <Label htmlFor="requestBody" className="text-text-secondary text-sm mb-1">
                  Body (JSON)
                </Label>
                <Textarea
                  id="requestBody"
                  rows={4}
                  placeholder={`{"name": "John Doe"}`}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Button 
                  variant="default" 
                  className="bg-primary hover:bg-primary-dark text-white"
                  onClick={handleSendRequest}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send Request
                </Button>
              </div>
            </div>
            
            <div>
              <div className="mb-2 flex justify-between items-center">
                <Label className="text-text-secondary text-sm">
                  Response
                </Label>
                {testResponse && (
                  <div className="text-xs text-text-secondary flex items-center">
                    <span className={`${
                      testResponse.status >= 200 && testResponse.status < 300 
                        ? 'bg-success' 
                        : 'bg-error'
                    } text-white px-2 py-0.5 rounded-md`}>
                      {testResponse.status} {testResponse.statusText}
                    </span>
                    <span className="ml-2">{testResponse.duration}ms</span>
                  </div>
                )}
              </div>
              
              <div className="border border-divider rounded-md bg-gray-50 h-64 overflow-auto">
                <pre className="p-3 text-sm font-mono">
                  {testResponse 
                    ? JSON.stringify(testResponse.data, null, 2)
                    : 'No response data. Send a request to see results here.'}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
