import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { parse } from 'csv-parse/sync';
import { Capacitor } from '@capacitor/core';
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
  private serverError: string | null = null;

  /**
   * Get singleton instance of MobileServerService
   */
  public static getInstance(): MobileServerService {
    if (!MobileServerService.instance) {
      MobileServerService.instance = new MobileServerService();
    }
    return MobileServerService.instance;
  }

  /**
   * Private constructor - use getInstance() instead
   */
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
    
    // Logging middleware
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
      res.json({ status: 'ok', mode: 'offline', timestamp: new Date().toISOString() });
    });

    // Get all teachers
    this.app.get('/api/teachers', async (req: Request, res: Response) => {
      try {
        const teachers = await this.readJsonFile('teachers.json', []);
        res.json(teachers);
      } catch (error) {
        console.error('[MobileServer] Error fetching teachers:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
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
        console.error('[MobileServer] Error fetching teacher schedule:', error);
        res.status(500).json({ error: 'Failed to fetch teacher schedule' });
      }
    });

    // Get absent teachers
    this.app.get('/api/get-absent-teachers', async (req: Request, res: Response) => {
      try {
        const absentTeachers = await this.readJsonFile('absent_teachers.json', []);
        res.json(absentTeachers);
      } catch (error) {
        console.error('[MobileServer] Error fetching absent teachers:', error);
        res.status(500).json({ error: 'Failed to fetch absent teachers' });
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

    // Login endpoint
    this.app.post('/api/login', (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;
        
        // For offline mode, we'll use a simplified login that allows any teacher to log in
        // with their name as username and a simple password
        res.json({ 
          id: 1, 
          username, 
          isAdmin: username.toLowerCase() === 'admin'
        });
      } catch (error) {
        console.error('[MobileServer] Error during login:', error);
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    // Get current user
    this.app.get('/api/user', (req: Request, res: Response) => {
      // In offline mode, assume user is logged in and is an admin
      res.json({
        id: 1,
        username: 'admin',
        isAdmin: true
      });
    });

    // Upload CSV
    this.app.post('/api/upload-csv', async (req: Request, res: Response) => {
      try {
        const { fileContent, type } = req.body;
        const isSubstitute = type === 'substitute';
        
        await this.processUploadedCSV(fileContent, isSubstitute);
        
        res.json({ success: true });
      } catch (error) {
        console.error('[MobileServer] Error uploading CSV:', error);
        res.status(500).json({ error: 'Failed to upload CSV' });
      }
    });

    // Add more API endpoints as needed to match the backend functionality
  }

  /**
   * Read a JSON file from the device's filesystem
   */
  private async readJsonFile(filename: string, defaultValue: any): Promise<any> {
    try {
      const content = await dataSync.readFile(filename);
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[MobileServer] Could not read ${filename}, using default value`);
      return defaultValue;
    }
  }

  /**
   * Write a JSON file to the device's filesystem
   */
  private async writeJsonFile(filename: string, data: any): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await dataSync.writeFile(filename, content);
    } catch (error) {
      console.error(`[MobileServer] Error writing ${filename}:`, error);
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
      
      return isSubstitute ? this.processSubstituteCSV(records) : this.processTimetableCSV(records);
    } catch (error) {
      console.error('[MobileServer] Error processing CSV:', error);
      throw error;
    }
  }

  /**
   * Process substitute CSV data
   */
  private processSubstituteCSV(records: any[]): any[] {
    // Extract teacher information from the CSV
    const teachers = records.map((record: any, index: number) => ({
      id: index + 1,
      name: record.name || record.teacher_name || record.Name || '',
      phoneNumber: record.phone || record.Phone || record.phoneNumber || record.PhoneNumber || '',
      variations: []
    }));
    
    return teachers.filter(teacher => teacher.name.trim() !== '');
  }

  /**
   * Process timetable CSV data
   */
  private processTimetableCSV(records: any[]): any[] {
    // Extract schedule information from the CSV
    const schedules = records.map((record: any, index: number) => ({
      id: index + 1,
      day: record.day || record.Day || '',
      period: parseInt(record.period || record.Period || '0', 10),
      className: record.class || record.Class || record.ClassName || record.className || '',
      teacherName: record.teacher || record.Teacher || record.teacherName || record.TeacherName || ''
    }));
    
    return schedules.filter(schedule => 
      schedule.day.trim() !== '' && 
      schedule.teacherName.trim() !== '' && 
      !isNaN(schedule.period)
    );
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[MobileServer] Server already running');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, '0.0.0.0', () => {
          console.log(`[MobileServer] Server running on port ${this.port}`);
          this.isRunning = true;
          this.serverError = null;
          resolve();
        });
        
        this.server.on('error', (error: Error) => {
          console.error('[MobileServer] Server error:', error);
          this.isRunning = false;
          this.serverError = error.message;
          reject(error);
        });
      } catch (error) {
        console.error('[MobileServer] Failed to start server:', error);
        this.isRunning = false;
        this.serverError = error instanceof Error ? error.message : 'Unknown error';
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  public stop(): void {
    if (!this.isRunning || !this.server) {
      console.log('[MobileServer] Server not running');
      return;
    }
    
    try {
      this.server.close();
      this.isRunning = false;
      this.server = null;
      console.log('[MobileServer] Server stopped');
    } catch (error) {
      console.error('[MobileServer] Error stopping server:', error);
      throw error;
    }
  }

  /**
   * Process uploaded CSV files and update JSON data
   */
  public async processUploadedCSV(fileContent: string, isSubstitute: boolean): Promise<void> {
    try {
      // Parse CSV content
      const records = await this.processCSV(fileContent, isSubstitute);
      
      if (isSubstitute) {
        // If this is a substitute CSV, update the teachers JSON file
        await this.writeJsonFile('teachers.json', records);
      } else {
        // If this is a timetable CSV, update the schedules JSON file
        await this.writeJsonFile('schedules.json', records);
        
        // Also create teacher_schedules.json which organizes schedules by teacher name
        const teacherSchedules: Record<string, any[]> = {};
        
        records.forEach((schedule: any) => {
          const { teacherName } = schedule;
          if (!teacherSchedules[teacherName]) {
            teacherSchedules[teacherName] = [];
          }
          teacherSchedules[teacherName].push(schedule);
        });
        
        await this.writeJsonFile('teacher_schedules.json', teacherSchedules);
      }
      
      console.log(`[MobileServer] Successfully processed ${isSubstitute ? 'substitute' : 'timetable'} CSV`);
    } catch (error) {
      console.error('[MobileServer] Error processing uploaded CSV:', error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  public getStatus(): { isRunning: boolean; error: string | null } {
    return {
      isRunning: this.isRunning,
      error: this.serverError
    };
  }
}

export const mobileServer = MobileServerService.getInstance();