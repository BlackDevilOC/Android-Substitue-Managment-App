import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * DataSyncService
 * 
 * Handles synchronization of data files between the app assets and the 
 * local storage on the device. This ensures that CSV and JSON files are
 * available to the local server for offline operation.
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private initialized: boolean = false;
  private readonly dataDirectory = 'data';

  // Files that are essential for the app to function
  private readonly essentialFiles = [
    'teachers.json',
    'schedules.json',
    'teacher_schedules.json',
    'absent_teachers.json',
    'sms_history.json',
    'substitute_logs.json',
    'Substitude_file.csv',
    'timetable_file.csv'
  ];

  /**
   * Get singleton instance of DataSyncService
   */
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private constructor() {}

  /**
   * Initialize the data directory and copy essential files
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[DataSync] Already initialized');
      return;
    }

    try {
      console.log('[DataSync] Initializing...');
      
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Copy essential files from app assets to data directory
      await this.copyEssentialFiles();
      
      this.initialized = true;
      console.log('[DataSync] Initialization complete');
    } catch (error) {
      console.error('[DataSync] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure the data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      // Check if directory exists
      const dirResult = await Filesystem.readdir({
        path: this.dataDirectory,
        directory: Directory.Data
      });
      
      console.log(`[DataSync] Data directory exists with ${dirResult.files.length} files`);
    } catch (error) {
      // Directory doesn't exist, create it
      console.log('[DataSync] Creating data directory');
      
      await Filesystem.mkdir({
        path: this.dataDirectory,
        directory: Directory.Data,
        recursive: true
      });
    }
  }

  /**
   * Copy essential data files from app assets to local storage
   */
  private async copyEssentialFiles(): Promise<void> {
    console.log('[DataSync] Copying essential files...');
    
    for (const filename of this.essentialFiles) {
      await this.copyFileIfNewer(filename);
    }
    
    console.log('[DataSync] Essential files copied');
  }

  /**
   * Copy a file from app assets to data directory if it's newer or doesn't exist
   */
  private async copyFileIfNewer(filename: string): Promise<void> {
    try {
      // Check if file exists in data directory
      const exists = await this.fileExists(filename);
      
      if (!exists) {
        // If file doesn't exist in data directory, copy it from assets
        console.log(`[DataSync] File ${filename} not found in data directory, copying from assets`);
        
        try {
          // Read file from assets
          const fileContent = await this.readFileFromAssets(filename);
          
          // Write file to data directory
          await this.writeFile(filename, fileContent);
          
          console.log(`[DataSync] File ${filename} copied from assets to data directory`);
        } catch (error) {
          console.warn(`[DataSync] Could not copy ${filename} from assets: ${error}`);
          
          // Create empty file if asset doesn't exist
          if (filename.endsWith('.json')) {
            if (filename.includes('teachers')) {
              await this.writeFile(filename, '[]');
            } else if (filename.includes('schedules')) {
              await this.writeFile(filename, '{}');
            } else {
              await this.writeFile(filename, '[]');
            }
            console.log(`[DataSync] Created empty ${filename}`);
          } else if (filename.endsWith('.csv')) {
            await this.writeFile(filename, '');
            console.log(`[DataSync] Created empty ${filename}`);
          }
        }
      } else {
        console.log(`[DataSync] File ${filename} already exists in data directory`);
      }
    } catch (error) {
      console.error(`[DataSync] Error copying file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Read a file from the app's assets directory
   */
  private async readFileFromAssets(filename: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: `public/${filename}`,
        directory: Directory.Data
      });
      
      return result.data;
    } catch (error) {
      console.error(`[DataSync] Error reading file ${filename} from assets:`, error);
      throw error;
    }
  }

  /**
   * Read a file from the data directory
   */
  public async readFile(filename: string): Promise<string> {
    try {
      const filePath = `${this.dataDirectory}/${filename}`;
      
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Data,
        encoding: 'utf8'
      });
      
      return result.data;
    } catch (error) {
      console.error(`[DataSync] Error reading file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Write data to a file in the data directory
   */
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
      console.error(`[DataSync] Error writing file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in the data directory
   */
  public async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = `${this.dataDirectory}/${filename}`;
      
      await Filesystem.stat({
        path: filePath,
        directory: Directory.Data
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a list of all files in the data directory
   */
  public async listFiles(): Promise<string[]> {
    try {
      const result = await Filesystem.readdir({
        path: this.dataDirectory,
        directory: Directory.Data
      });
      
      return result.files.map(file => file.name);
    } catch (error) {
      console.error('[DataSync] Error listing files:', error);
      return [];
    }
  }
}

export const dataSync = DataSyncService.getInstance();