# DataSyncService Documentation

## Overview

The `DataSyncService` manages data synchronization between the app's bundled assets and the local storage on the mobile device. It ensures that CSV and JSON files are properly copied, updated, and accessible to the local server for offline operation.

## Purpose

The primary functions of the `DataSyncService` are:

1. Copy essential data files from app assets to local storage
2. Provide read/write access to data files
3. Maintain file versioning to prevent unnecessary copies
4. Create and manage the local data directory structure
5. Provide a unified API for file operations

## Implementation

### Class Structure

The `DataSyncService` is implemented as a singleton class with the following structure:

```typescript
export class DataSyncService {
  private static instance: DataSyncService;
  private initialized: boolean = false;
  private readonly dataDirectory = 'data';
  private readonly essentialFiles = [
    'total_teacher.json',
    'absent_teachers.json',
    'assigned_teacher.json',
    'class_schedules.json',
    'period_config.json',
    'sms_history.json'
  ];
  
  public static getInstance(): DataSyncService { ... }
  private constructor() {}
  public async initialize(): Promise<void> { ... }
  private async ensureDataDirectory(): Promise<void> { ... }
  private async copyEssentialFiles(): Promise<void> { ... }
  private async copyFileIfNewer(filename: string): Promise<void> { ... }
  private async readFileFromAssets(filename: string): Promise<string> { ... }
  public async readFile(filename: string): Promise<string> { ... }
  public async writeFile(filename: string, data: string): Promise<void> { ... }
  public async fileExists(filename: string): Promise<boolean> { ... }
  public async listFiles(): Promise<string[]> { ... }
}
```

### Initialization

```typescript
// Get singleton instance
const dataSync = DataSyncService.getInstance();

// Initialize the service
await dataSync.initialize();
```

### File Operations

#### Reading Files

The service provides methods to read files from both assets and the data directory:

```typescript
// Reading from assets (bundled with the app)
private async readFileFromAssets(filename: string): Promise<string> {
  try {
    const filePath = `public/data/${filename}`;
    const readResult = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Assets
    });
    return readResult.data;
  } catch (error) {
    console.error(`Error reading file from assets: ${filename}`, error);
    throw error;
  }
}

// Reading from data directory (local storage)
public async readFile(filename: string): Promise<string> {
  try {
    const filePath = `${this.dataDirectory}/${filename}`;
    const readResult = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
      encoding: 'utf8'
    });
    return readResult.data;
  } catch (error) {
    // If file doesn't exist in data directory, try reading from assets
    console.warn(`File not found in data directory, checking assets: ${filename}`);
    return this.readFileFromAssets(filename);
  }
}
```

#### Writing Files

The service provides a method to write files to the data directory:

```typescript
public async writeFile(filename: string, data: string): Promise<void> {
  try {
    const filePath = `${this.dataDirectory}/${filename}`;
    await Filesystem.writeFile({
      path: filePath,
      data: data,
      directory: Directory.Data,
      encoding: 'utf8'
    });
  } catch (error) {
    console.error(`Error writing file: ${filename}`, error);
    throw error;
  }
}
```

### Directory Management

The service ensures that the data directory exists and creates it if necessary:

```typescript
private async ensureDataDirectory(): Promise<void> {
  try {
    const { uri } = await Filesystem.getUri({
      path: this.dataDirectory,
      directory: Directory.Data
    });
    console.log(`Data directory exists at: ${uri}`);
  } catch (error) {
    console.log(`Creating data directory: ${this.dataDirectory}`);
    await Filesystem.mkdir({
      path: this.dataDirectory,
      directory: Directory.Data,
      recursive: true
    });
  }
}
```

### File Synchronization

The service copies essential files from assets to the data directory if they are newer or don't exist:

```typescript
private async copyEssentialFiles(): Promise<void> {
  for (const file of this.essentialFiles) {
    await this.copyFileIfNewer(file);
  }
}

private async copyFileIfNewer(filename: string): Promise<void> {
  try {
    // Check if file exists in data directory
    const exists = await this.fileExists(filename);
    
    if (!exists) {
      // File doesn't exist in data directory, copy it from assets
      const content = await this.readFileFromAssets(filename);
      await this.writeFile(filename, content);
      console.log(`Copied file from assets to data directory: ${filename}`);
    } else {
      console.log(`File already exists in data directory: ${filename}`);
      // Here we could implement version checking to update files if needed
    }
  } catch (error) {
    console.warn(`Error copying file ${filename}:`, error);
  }
}
```

## File Versioning

While not fully implemented in the current version, the service has provisions for file versioning:

```typescript
// Example of how file versioning could be implemented
private async shouldUpdateFile(filename: string): Promise<boolean> {
  try {
    // Read version info from assets
    const assetVersionInfo = await this.readFileFromAssets(`versions.json`);
    const assetVersions = JSON.parse(assetVersionInfo);
    
    // Read version info from data directory
    const dataVersionInfo = await this.readFile(`versions.json`);
    const dataVersions = JSON.parse(dataVersionInfo);
    
    // Compare versions
    return assetVersions[filename] > dataVersions[filename];
  } catch (error) {
    // If any error occurs, assume update is needed
    return true;
  }
}
```

## Usage Example

Here's a complete example of how to use the DataSyncService:

```typescript
import { dataSync } from 'src/services/DataSyncService';

// Component for managing data files
function DataManager() {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize data sync when component mounts
  useEffect(() => {
    async function initializeData() {
      try {
        // Initialize the service
        await dataSync.initialize();
        
        // Get list of available files
        const fileList = await dataSync.listFiles();
        setFiles(fileList);
      } catch (err) {
        setError(err.message);
      }
    }
    
    initializeData();
  }, []);

  // Read a file's content
  async function readFileContent(filename: string) {
    try {
      const content = await dataSync.readFile(filename);
      return JSON.parse(content);
    } catch (err) {
      setError(`Error reading ${filename}: ${err.message}`);
      return null;
    }
  }

  // Save data to a file
  async function saveData(filename: string, data: any) {
    try {
      const content = JSON.stringify(data, null, 2);
      await dataSync.writeFile(filename, content);
      // Success handling
    } catch (err) {
      setError(`Error saving ${filename}: ${err.message}`);
    }
  }

  return (
    <div>
      <h2>Available Files</h2>
      <ul>
        {files.map(file => (
          <li key={file}>{file}</li>
        ))}
      </ul>
      {error && <div className="error">{error}</div>}
      {/* UI for file operations */}
    </div>
  );
}
```

## Integration with MobileServerService

The `DataSyncService` is heavily used by the `MobileServerService` for all its file operations:

```typescript
// In MobileServerService
private async readJsonFile(filename: string, defaultValue: any): Promise<any> {
  try {
    const content = await dataSync.readFile(filename);
    return JSON.parse(content);
  } catch (error) {
    return defaultValue;
  }
}

private async writeJsonFile(filename: string, data: any): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await dataSync.writeFile(filename, content);
  } catch (error) {
    console.error(`Error writing file ${filename}:`, error);
  }
}
```

## Error Handling

The service implements comprehensive error handling for all file operations:

1. **File Not Found**
   ```typescript
   try {
     // Try to read from data directory
   } catch (error) {
     // Fall back to reading from assets
   }
   ```

2. **Directory Creation**
   ```typescript
   try {
     // Check if directory exists
   } catch (error) {
     // Create directory
   }
   ```

3. **File Write Errors**
   ```typescript
   try {
     // Write file
   } catch (error) {
     console.error(`Error writing file:`, error);
     throw error; // Propagate error to caller
   }
   ```

## Performance Considerations

The `DataSyncService` includes several performance optimizations:

1. **Lazy copying** - Files are only copied when needed
2. **One-time initialization** - Files are copied only once during app startup
3. **Conditional updates** - Only newer files are copied (when versioning is implemented)
4. **Error recovery** - When files aren't found in local storage, the service falls back to reading from assets

## Conclusion

The `DataSyncService` is a critical component for offline operation, providing:

1. Data persistence across app sessions
2. Efficient file synchronization between assets and local storage
3. A consistent API for file operations
4. Error handling and recovery mechanisms
5. Integration with the local server for offline data processing

This service ensures that all necessary data is available for offline operation, even when the app is restarted or when data is modified during use.