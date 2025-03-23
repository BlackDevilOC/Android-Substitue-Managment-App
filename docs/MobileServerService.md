# MobileServerService Documentation

## Overview

The `MobileServerService` is a critical component of the offline-capable mobile application. It runs a lightweight Express server directly on the mobile device, allowing the app to function without internet connectivity by processing local JSON and CSV files and providing API endpoints that match the existing backend.

## Purpose

The primary goal of the `MobileServerService` is to maintain API compatibility while enabling offline functionality. This is achieved by:

1. Running a local Express server on the device
2. Processing data from bundled JSON/CSV files
3. Providing the same API endpoints as the remote backend
4. Persisting changes to local storage

## Implementation

### Class Structure

The `MobileServerService` is implemented as a singleton class with the following structure:

```typescript
export class MobileServerService {
  private static instance: MobileServerService;
  private app: Express;
  private server: any;
  private port: number = 5000;
  private isRunning: boolean = false;
  private serverError: string | null = null;
  
  public static getInstance(): MobileServerService { ... }
  private constructor() { ... }
  private configureMiddleware(): void { ... }
  private registerRoutes(): void { ... }
  private readJsonFile(filename: string, defaultValue: any): Promise<any> { ... }
  private writeJsonFile(filename: string, data: any): Promise<void> { ... }
  private processCSV(csvData: string, isSubstitute: boolean = false): Promise<any> { ... }
  private processSubstituteCSV(records: any[]): any[] { ... }
  private processTimetableCSV(records: any[]): any[] { ... }
  public async start(): Promise<void> { ... }
  public stop(): void { ... }
  public async processUploadedCSV(fileContent: string, isSubstitute: boolean): Promise<void> { ... }
  public getStatus(): { isRunning: boolean; error: string | null } { ... }
}
```

### Initialization

```typescript
// Get singleton instance
const mobileServer = MobileServerService.getInstance();

// Start the server
await mobileServer.start();
```

### API Endpoints

The MobileServerService implements the following endpoints that match the backend API:

1. **Health Check**
   ```typescript
   GET /api/health
   Response: { status: 'ok' }
   ```

2. **Teacher Data**
   ```typescript
   GET /api/teachers
   Response: Teacher[]
   ```

3. **Teacher Schedule**
   ```typescript
   GET /api/teacher-schedule/:name
   Response: ScheduleItem[]
   ```

4. **Absent Teachers**
   ```typescript
   GET /api/get-absent-teachers
   Response: AbsentTeacher[]

   POST /api/update-absent-teachers
   Body: { absentTeacherNames: string[] }
   Response: { success: true }
   ```

5. **Authentication**
   ```typescript
   POST /api/login
   Body: { username: string, password: string }
   Response: { id: number, username: string, isAdmin: boolean }

   GET /api/user
   Response: { id: number, username: string, isAdmin: boolean }
   ```

6. **CSV Upload**
   ```typescript
   POST /api/upload-csv
   Body: FormData with file
   Response: { success: true, message: string }
   ```

### File Handling

The MobileServerService handles local file operations through the following methods:

1. **Reading JSON Files**
   ```typescript
   private async readJsonFile(filename: string, defaultValue: any): Promise<any> {
     try {
       const content = await dataSync.readFile(filename);
       return JSON.parse(content);
     } catch (error) {
       return defaultValue;
     }
   }
   ```

2. **Writing JSON Files**
   ```typescript
   private async writeJsonFile(filename: string, data: any): Promise<void> {
     try {
       const content = JSON.stringify(data, null, 2);
       await dataSync.writeFile(filename, content);
     } catch (error) {
       console.error(`Error writing file ${filename}:`, error);
     }
   }
   ```

3. **Processing CSV Files**
   ```typescript
   private async processCSV(csvData: string, isSubstitute: boolean = false): Promise<any> {
     // CSV parsing and processing logic
     // Different handling for substitute and timetable CSV files
   }
   ```

### Port Configuration

The server runs on a fixed port (5000) on the device's localhost. Since this is all happening within the app's sandbox, there are no port conflicts with other applications.

```typescript
private port: number = 5000;

// In start() method:
this.server = this.app.listen(this.port, '0.0.0.0', () => {
  console.log(`Mobile server running on port ${this.port}`);
  this.isRunning = true;
  resolve();
});
```

## Integration with Other Services

### DataSyncService

The `MobileServerService` relies on the `DataSyncService` for file operations:

```typescript
// Reading files
const content = await dataSync.readFile(filename);

// Writing files
await dataSync.writeFile(filename, content);
```

### API Request Interception

For the mobile server to handle API requests, the `queryClient.ts` file intercepts outgoing requests and redirects them to the local server:

```typescript
function getApiUrl(url: string): string {
  if (Platform.isNative) {
    // In native mobile context, use the local server URL
    return `http://localhost:5000${url}`;
  }
  // In web context, use the relative URL
  return url;
}
```

## Error Handling

The service includes comprehensive error handling:

1. **Server Startup Errors**
   ```typescript
   this.server.on('error', (error: Error) => {
     this.serverError = error.message;
     this.isRunning = false;
     console.error('Server error:', error);
     reject(error);
   });
   ```

2. **File Operation Errors**
   ```typescript
   try {
     // File operation
   } catch (error) {
     console.error(`Error processing file:`, error);
     // Provide fallback or error response
   }
   ```

3. **Status Reporting**
   ```typescript
   public getStatus(): { isRunning: boolean; error: string | null } {
     return {
       isRunning: this.isRunning,
       error: this.serverError
     };
   }
   ```

## Usage Example

Here's a complete example of how to use the MobileServerService:

```typescript
import { mobileServer } from 'src/services/MobileServerService';
import { dataSync } from 'src/services/DataSyncService';

// Component for managing the mobile server
function MobileServerManager() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start the server when component mounts
  useEffect(() => {
    async function startServer() {
      try {
        // Initialize data sync service first
        await dataSync.initialize();
        
        // Start the local server
        await mobileServer.start();
        
        const status = mobileServer.getStatus();
        setIsRunning(status.isRunning);
        setError(status.error);
      } catch (err) {
        setError(err.message);
      }
    }
    
    startServer();
    
    // Clean up when component unmounts
    return () => {
      mobileServer.stop();
    };
  }, []);

  // Process a CSV file
  async function handleCsvUpload(csvContent: string, isSubstitute: boolean) {
    try {
      await mobileServer.processUploadedCSV(csvContent, isSubstitute);
      // Handle success
    } catch (err) {
      // Handle error
    }
  }

  return (
    <div>
      <div>Server Status: {isRunning ? 'Running' : 'Stopped'}</div>
      {error && <div>Error: {error}</div>}
      {/* UI for CSV upload and other actions */}
    </div>
  );
}
```

## Conclusion

The `MobileServerService` is a critical component that enables offline functionality in the mobile app by:

1. Providing a consistent API interface that matches the backend
2. Processing local data files for all app operations
3. Persisting changes to local storage
4. Handling both JSON and CSV data formats
5. Maintaining seamless operation without internet connectivity

This approach allows the frontend code to remain unchanged while providing full offline functionality on mobile devices.