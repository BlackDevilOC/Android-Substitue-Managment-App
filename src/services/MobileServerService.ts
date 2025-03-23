import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Capacitor } from '@capacitor/core';
import { parse } from 'csv-parse/sync';
import { dataSync } from './DataSyncService';

/**
 * MobileServerService
 * 
 * This service runs an Express server on the mobile device
 * to process JSON/CSV files and provide API endpoints that
 * match the existing backend, allowing the app to work offline
 * without changing the frontend API calls.
 */
export class MobileServerService {
  private static instance: MobileServerService;
  private app: Express;
  private server: any;
  private port: number = 5000;
  private isRunning: boolean = false;
  private dataDirectory: string = 'data';

  public static getInstance(): MobileServerService {
    if (!MobileServerService.instance) {
      MobileServerService.instance = new MobileServerService();
    }
    return MobileServerService.instance;
  }

  private constructor() {
    this.app = express();
    this.configureMiddleware();
    this.registerRoutes();
  }

  /**
   * Set up middleware for the Express server
   */
  private configureMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      console.log(`[MobileServer] ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * Register all API routes
   */
  private registerRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', mode: 'offline' });
    });

    // Get all teachers
    this.app.get('/api/teachers', async (req: Request, res: Response) => {
      try {
        const teachers = await this.readJsonFile('total_teacher.json', []);
        res.json(teachers);
      } catch (error) {
        console.error('[MobileServer] Error getting teachers:', error);
        res.status(500).json({ error: 'Failed to get teachers' });
      }
    });

    // Get teacher schedule
    this.app.get('/api/teacher-schedule/:name', async (req: Request, res: Response) => {
      try {
        const teacherName = req.params.name;
        const schedules = await this.readJsonFile('teacher_schedules.json', {});
        
        if (schedules[teacherName]) {
          res.json(schedules[teacherName]);
        } else {
          res.status(404).json({ error: 'Teacher schedule not found' });
        }
      } catch (error) {
        console.error('[MobileServer] Error getting teacher schedule:', error);
        res.status(500).json({ error: 'Failed to get teacher schedule' });
      }
    });

    // Get absent teachers
    this.app.get('/api/get-absent-teachers', async (req: Request, res: Response) => {
      try {
        const absentTeachers = await this.readJsonFile('absent_teachers.json', []);
        res.json(absentTeachers);
      } catch (error) {
        console.error('[MobileServer] Error getting absent teachers:', error);
        res.status(500).json({ error: 'Failed to get absent teachers' });
      }
    });

    // Update absent teachers
    this.app.post('/api/update-absent-teachers', async (req: Request, res: Response) => {
      try {
        const { teachers } = req.body;
        await this.writeJsonFile('absent_teachers.json', teachers);
        res.json({ success: true });
      } catch (error) {
        console.error('[MobileServer] Error updating absent teachers:', error);
        res.status(500).json({ error: 'Failed to update absent teachers' });
      }
    });

    // Login
    this.app.post('/api/login', (req: Request, res: Response) => {
      const { username, password } = req.body;
      
      // In offline mode, accept any login
      res.json({
        id: 1,
        username: username || 'admin',
        isAdmin: true
      });
    });

    // Get current user
    this.app.get('/api/user', (req: Request, res: Response) => {
      // In offline mode, return a default user
      res.json({
        id: 1,
        username: 'Rehan',
        isAdmin: true
      });
    });

    // Add more routes as needed...
  }

  /**
   * Read a JSON file from the device's filesystem
   */
  private async readJsonFile(filename: string, defaultValue: any): Promise<any> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // When in browser, try to fetch from the server
        try {
          const response = await fetch(`/data/${filename}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn(`[MobileServer] Failed to fetch ${filename} from server, using default value`);
        }
        return defaultValue;
      }
      
      // On device, read from filesystem
      const fileContent = await dataSync.readFile(filename);
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`[MobileServer] Error reading JSON file ${filename}:`, error);
      return defaultValue;
    }
  }

  /**
   * Write a JSON file to the device's filesystem
   */
  private async writeJsonFile(filename: string, data: any): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.warn(`[MobileServer] Cannot write ${filename} in browser mode`);
        return;
      }
      
      const fileContent = JSON.stringify(data, null, 2);
      await dataSync.writeFile(filename, fileContent);
    } catch (error) {
      console.error(`[MobileServer] Error writing JSON file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Process CSV file and convert to JSON
   */
  private async processCSV(csvData: string, isSubstitute: boolean = false): Promise<any> {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      if (isSubstitute) {
        return this.processSubstituteCSV(records);
      } else {
        return this.processTimetableCSV(records);
      }
    } catch (error) {
      console.error('[MobileServer] Error processing CSV:', error);
      throw error;
    }
  }

  /**
   * Process substitute CSV data
   */
  private processSubstituteCSV(records: any[]): any[] {
    // Implementation depends on the CSV structure
    // This is a placeholder for the actual logic
    const processedData = records.map((record) => {
      return {
        name: record.name || record.Name || '',
        phone: record.phone || record.Phone || record.phoneNumber || record.PhoneNumber || '',
        // Add other fields as needed
      };
    });
    
    return processedData;
  }

  /**
   * Process timetable CSV data
   */
  private processTimetableCSV(records: any[]): any[] {
    // Implementation depends on the CSV structure
    // This is a placeholder for the actual logic
    const processedData = records.map((record) => {
      return {
        day: record.day || record.Day || '',
        period: parseInt(record.period || record.Period || '0', 10),
        className: record.className || record.ClassName || record.class || record.Class || '',
        teacherName: record.teacherName || record.TeacherName || record.teacher || record.Teacher || '',
        // Add other fields as needed
      };
    });
    
    return processedData;
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await dataSync.initialize();
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[MobileServer] Server is already running');
      return;
    }

    try {
      console.log('[MobileServer] Starting server...');
      
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      if (Capacitor.isNativePlatform()) {
        // Start the Express server on device
        this.server = this.app.listen(this.port, '0.0.0.0', () => {
          this.isRunning = true;
          console.log(`[MobileServer] Server running on port ${this.port}`);
        });
      } else {
        // When in browser, we don't need to start the Express server
        // as the main backend server will handle requests
        console.log('[MobileServer] Running in browser mode, skipping server start');
        this.isRunning = true;
      }
    } catch (error) {
      console.error('[MobileServer] Error starting server:', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('[MobileServer] Server is not running');
      return;
    }

    if (this.server && Capacitor.isNativePlatform()) {
      this.server.close(() => {
        console.log('[MobileServer] Server stopped');
        this.isRunning = false;
      });
    } else {
      this.isRunning = false;
      console.log('[MobileServer] Server stopped');
    }
  }

  /**
   * Copy data files from app assets to local storage
   * This should be called when the app is installed or updated
   */
  public async copyDataFiles(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[MobileServer] Running in browser mode, skipping data file copy');
      return;
    }

    try {
      console.log('[MobileServer] Copying data files...');
      await dataSync.initialize();
      console.log('[MobileServer] Data files copied successfully');
    } catch (error) {
      console.error('[MobileServer] Error copying data files:', error);
      throw error;
    }
  }

  /**
   * Process uploaded CSV files and update JSON data
   */
  public async processUploadedCSV(fileContent: string, isSubstitute: boolean): Promise<void> {
    try {
      console.log(`[MobileServer] Processing uploaded ${isSubstitute ? 'substitute' : 'timetable'} CSV...`);
      
      // Process the CSV data
      const processedData = await this.processCSV(fileContent, isSubstitute);
      
      // Save the processed data to the appropriate file
      if (isSubstitute) {
        await this.writeJsonFile('total_teacher.json', processedData);
      } else {
        await this.writeJsonFile('schedules.json', processedData);
      }
      
      console.log('[MobileServer] CSV processing completed');
    } catch (error) {
      console.error('[MobileServer] Error processing uploaded CSV:', error);
      throw error;
    }
  }
}

export const mobileServer = MobileServerService.getInstance();