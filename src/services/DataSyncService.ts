import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

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

  // List of essential files that should be copied from assets to local storage
  private readonly essentialFiles = [
    'total_teacher.json',
    'teacher_schedules.json',
    'absent_teachers.json',
    'assigned_teacher.json',
    'class_schedules.json',
    'currentId.json',
    'day_schedules.json',
    'notifications.json',
    'period_config.json',
    'period_schedules.json',
    'schedules.json',
    'sms_history.json',
    'substitute_logs.json',
    'substitute_warnings.json',
    'timetable_file.csv',
    'Substitude_file.csv',
    'users.json'
  ];

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
      return;
    }

    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('[DataSync] Not running on a native platform, skipping initialization');
        this.initialized = true;
        return;
      }

      console.log('[DataSync] Initializing data directory');
      
      // Ensure the data directory exists
      await this.ensureDataDirectory();
      
      // Copy essential files from assets
      await this.copyEssentialFiles();
      
      this.initialized = true;
      console.log('[DataSync] Initialization completed');
    } catch (error) {
      console.error('[DataSync] Error during initialization:', error);
      throw error;
    }
  }

  /**
   * Ensure the data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      const { uri } = await Filesystem.getUri({
        path: this.dataDirectory,
        directory: Directory.Data
      });

      console.log(`[DataSync] Data directory exists at ${uri}`);
    } catch (error) {
      // Directory doesn't exist, create it
      try {
        await Filesystem.mkdir({
          path: this.dataDirectory,
          directory: Directory.Data,
          recursive: true
        });
        console.log('[DataSync] Created data directory');
      } catch (mkdirError) {
        console.error('[DataSync] Error creating data directory:', mkdirError);
        throw mkdirError;
      }
    }
  }

  /**
   * Copy essential data files from app assets to local storage
   */
  private async copyEssentialFiles(): Promise<void> {
    try {
      console.log('[DataSync] Copying essential files');
      
      for (const filename of this.essentialFiles) {
        await this.copyFileIfNewer(filename);
      }
      
      console.log('[DataSync] All essential files copied');
    } catch (error) {
      console.error('[DataSync] Error copying essential files:', error);
      throw error;
    }
  }

  /**
   * Copy a file from app assets to data directory if it's newer or doesn't exist
   */
  private async copyFileIfNewer(filename: string): Promise<void> {
    try {
      // First check if file exists in data directory
      try {
        await Filesystem.stat({
          path: `${this.dataDirectory}/${filename}`,
          directory: Directory.Data
        });
        
        // File exists, we could check modification date but for now just skip
        console.log(`[DataSync] File ${filename} already exists in data directory`);
        return;
      } catch (error) {
        // File doesn't exist, copy it from assets
        console.log(`[DataSync] File ${filename} doesn't exist in data directory, copying from assets`);
      }
      
      // Read file from assets
      try {
        const asset = await Filesystem.readFile({
          path: `public/data/${filename}`,
          directory: Directory.Application
        });
        
        // Write to data directory
        await Filesystem.writeFile({
          path: `${this.dataDirectory}/${filename}`,
          directory: Directory.Data,
          data: asset.data,
          encoding: 'utf8' as Encoding
        });
        
        console.log(`[DataSync] Successfully copied ${filename} to data directory`);
      } catch (assetError) {
        console.warn(`[DataSync] Error copying ${filename}, file may not be included in assets:`, assetError);
      }
    } catch (error) {
      console.error(`[DataSync] Error in copyFileIfNewer for ${filename}:`, error);
    }
  }

  /**
   * Read a file from the data directory
   */
  public async readFile(filename: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: `${this.dataDirectory}/${filename}`,
        directory: Directory.Data,
        encoding: 'utf8' as Encoding
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
      await this.ensureDataDirectory();
      
      await Filesystem.writeFile({
        path: `${this.dataDirectory}/${filename}`,
        directory: Directory.Data,
        data,
        encoding: 'utf8' as Encoding
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
      await Filesystem.stat({
        path: `${this.dataDirectory}/${filename}`,
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
      
      return result.files.map(f => f.name);
    } catch (error) {
      console.error('[DataSync] Error listing files in data directory:', error);
      return [];
    }
  }
}

export const dataSync = DataSyncService.getInstance();