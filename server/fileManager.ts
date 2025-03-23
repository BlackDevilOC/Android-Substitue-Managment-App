import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

export class FileManager {
  private dataDir: string = '';
  private files: Map<string, any> = new Map();

  constructor() {
    // Default to the bundled data directory
    this.dataDir = path.join(process.cwd(), 'public', 'data');
  }

  public async setDataLocation(location: string): Promise<void> {
    // If location is 'bundle', use the bundled data directory
    // Otherwise, use the provided path
    if (location === 'bundle') {
      this.dataDir = path.join(process.cwd(), 'public', 'data');
    } else {
      this.dataDir = location;
    }

    // Load all files from the data directory
    await this.loadFiles();
  }

  public async loadFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.dataDir);
      
      // Clear existing files
      this.files.clear();

      // Load each file
      for (const file of files) {
        const filePath = path.join(this.dataDir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isFile()) {
          const fileExt = path.extname(file).toLowerCase();
          
          try {
            if (fileExt === '.json') {
              // Load JSON file
              const content = await fs.promises.readFile(filePath, 'utf8');
              this.files.set(file, JSON.parse(content));
            } else if (fileExt === '.csv') {
              // Load CSV file
              const content = await fs.promises.readFile(filePath, 'utf8');
              const records = csvParse(content, {
                columns: true,
                skip_empty_lines: true
              });
              this.files.set(file, records);
            }
          } catch (error) {
            console.error(`Error loading file ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
      throw error;
    }
  }

  public getFile(filename: string): any {
    return this.files.get(filename);
  }

  public getFiles(): Map<string, any> {
    return this.files;
  }

  public getFilesList(): { name: string; size: string; type: string }[] {
    const result = [];
    
    for (const [filename, data] of this.files.entries()) {
      const fileExt = path.extname(filename).toLowerCase();
      const fileType = fileExt.substring(1); // Remove the dot
      
      let size = '0 B';
      if (typeof data === 'object') {
        // Estimate size by converting to JSON string
        const jsonData = JSON.stringify(data);
        const bytes = Buffer.byteLength(jsonData, 'utf8');
        size = this.formatBytes(bytes);
      }
      
      result.push({
        name: filename,
        size,
        type: fileType
      });
    }
    
    return result;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
