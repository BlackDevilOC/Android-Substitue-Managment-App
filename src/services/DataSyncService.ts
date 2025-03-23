import { Capacitor } from '@capacitor/core';
import { Filesystem, ReadFileOptions, WriteFileOptions, Directory } from '@capacitor/filesystem';

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

  // List of essential data files that should be copied from assets to local storage
  private readonly essentialFiles = [
    'teachers.json',
    'class_schedules.json',
    'absent_teachers.json',
    'timetable_file.csv',
    'Substitude_file.csv',
    'period_config.json',
    'day_schedules.json',
    'schedules.json',
    'users.json'
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
      console.log('[DataSync] Initializing data synchronization service');
      
      // Ensure the data directory exists
      await this.ensureDataDirectory();
      
      // Copy essential files from assets to local storage
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
      if (!Capacitor.isNativePlatform()) {
        console.log('[DataSync] Running in browser, skipping directory creation');
        return;
      }
      
      await Filesystem.mkdir({
        path: this.dataDirectory,
        directory: Directory.Documents,
        recursive: true
      });
      
      console.log(`[DataSync] Created directory: ${this.dataDirectory}`);
    } catch (error: any) {
      // Directory might already exist (error code 12)
      if (error.message && error.message.includes('exists')) {
        console.log(`[DataSync] Directory already exists: ${this.dataDirectory}`);
      } else {
        console.error(`[DataSync] Error creating directory: ${this.dataDirectory}`, error);
        throw error;
      }
    }
  }

  /**
   * Copy essential data files from app assets to local storage
   */
  private async copyEssentialFiles(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[DataSync] Running in browser, skipping file copy');
      return;
    }

    console.log('[DataSync] Copying essential files to data directory');
    
    for (const filename of this.essentialFiles) {
      await this.copyFileIfNewer(filename);
    }
    
    console.log('[DataSync] All essential files copied');
  }

  /**
   * Copy a file from app assets to data directory if it's newer or doesn't exist
   */
  private async copyFileIfNewer(filename: string): Promise<void> {
    try {
      const exists = await this.fileExists(filename);
      const destPath = `${this.dataDirectory}/${filename}`;
      
      if (!exists) {
        console.log(`[DataSync] File doesn't exist, copying: ${filename}`);
        
        // File doesn't exist in data directory, copy it from assets
        const content = await this.readFileFromAssets(filename);
        await this.writeFile(filename, content);
        
        console.log(`[DataSync] File copied: ${filename}`);
      } else {
        console.log(`[DataSync] File already exists: ${filename}`);
        // TODO: Compare file dates and copy if the asset is newer
      }
    } catch (error) {
      console.error(`[DataSync] Error copying file: ${filename}`, error);
    }
  }

  /**
   * Read a file from the app's assets directory
   */
  private async readFileFromAssets(filename: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: Directory.Assets
      });
      
      return result.data as string;
    } catch (error) {
      console.error(`[DataSync] Error reading file from assets: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Read a file from the data directory
   */
  public async readFile(filename: string): Promise<string> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // In browser, try to fetch the file from the public directory
        const response = await fetch(`/data/${filename}`);
        return await response.text();
      }
      
      const result = await Filesystem.readFile({
        path: `${this.dataDirectory}/${filename}`,
        directory: Directory.Documents,
        encoding: 'utf8'
      });
      
      return result.data as string;
    } catch (error) {
      console.error(`[DataSync] Error reading file: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Write data to a file in the data directory
   */
  public async writeFile(filename: string, data: string): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log(`[DataSync] Running in browser, can't write file: ${filename}`);
        return;
      }
      
      await Filesystem.writeFile({
        path: `${this.dataDirectory}/${filename}`,
        data: data,
        directory: Directory.Documents,
        encoding: 'utf8'
      });
      
      console.log(`[DataSync] File written: ${filename}`);
    } catch (error) {
      console.error(`[DataSync] Error writing file: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in the data directory
   */
  public async fileExists(filename: string): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // In browser, we can't reliably check if files exist
        return false;
      }
      
      await Filesystem.stat({
        path: `${this.dataDirectory}/${filename}`,
        directory: Directory.Documents
      });
      
      return true;
    } catch (error) {
      // File doesn't exist
      return false;
    }
  }

  /**
   * Get a list of all files in the data directory
   */
  public async listFiles(): Promise<string[]> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('[DataSync] Running in browser, can\'t list files');
        return [];
      }
      
      const result = await Filesystem.readdir({
        path: this.dataDirectory,
        directory: Directory.Documents
      });
      
      return result.files.map(file => file.name);
    } catch (error) {
      console.error('[DataSync] Error listing files', error);
      return [];
    }
  }
}

export const dataSync = DataSyncService.getInstance();