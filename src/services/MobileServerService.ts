import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { parse } from 'csv-parse/sync';
import { dataSync } from './DataSyncService';
import { Capacitor } from '@capacitor/core';

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
    // Enable CORS for all routes
    this.app.use(cors());
    
    // Parse JSON request bodies
    this.app.use(express.json());
    
    // Add logging middleware
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
        const teachers = await this.readJsonFile('teachers.json', []);
        res.json(teachers);
      } catch (error) {
        console.error('[MobileServer] Error getting teachers:', error);
        res.status(500).json({ error: 'Failed to get teachers' });
      }
    });

    // Get teacher schedule
    this.app.get('/api/teacher-schedule/:name', async (req: Request, res: Response) => {
      try {
        const { name } = req.params;
        const schedules = await this.readJsonFile('teacher_schedules.json', {});
        
        if (schedules[name]) {
          res.json(schedules[name]);
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

    // Authentication endpoint
    this.app.post('/api/login', (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;
        
        // Read users from JSON file
        this.readJsonFile('users.json', [])
          .then((users: any[]) => {
            // Find user with matching credentials
            const user = users.find(u => 
              u.username === username && 
              u.password === password // In a real app, you'd use password hashing
            );
            
            if (user) {
              // Return user data (excluding password)
              const { password, ...userData } = user;
              res.json(userData);
            } else {
              res.status(401).json({ error: 'Invalid credentials' });
            }
          })
          .catch(error => {
            console.error('[MobileServer] Error during login:', error);
            res.status(500).json({ error: 'Authentication failed' });
          });
      } catch (error) {
        console.error('[MobileServer] Error in login:', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    });

    // Get current user
    this.app.get('/api/user', (req: Request, res: Response) => {
      // In mobile offline mode, we'll always use admin user
      res.json({ 
        id: 1, 
        username: 'admin', 
        isAdmin: true 
      });
    });

    // Upload CSV endpoint
    this.app.post('/api/upload-csv', async (req: Request, res: Response) => {
      try {
        const { fileContent, isSubstitute } = req.body;
        
        if (!fileContent) {
          return res.status(400).json({ error: 'No file content provided' });
        }
        
        await this.processCSV(fileContent, isSubstitute);
        
        res.json({ success: true });
      } catch (error) {
        console.error('[MobileServer] Error processing CSV:', error);
        res.status(500).json({ error: 'Failed to process CSV' });
      }
    });
  }

  /**
   * Read a JSON file from the device's filesystem
   */
  private async readJsonFile(filename: string, defaultValue: any): Promise<any> {
    try {
      const fileContent = await dataSync.readFile(filename);
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`[MobileServer] Error reading ${filename}:`, error);
      return defaultValue;
    }
  }

  /**
   * Write a JSON file to the device's filesystem
   */
  private async writeJsonFile(filename: string, data: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await dataSync.writeFile(filename, jsonString);
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
      // Parse CSV data
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      // Process based on file type
      if (isSubstitute) {
        // Process substitute CSV
        const result = this.processSubstituteCSV(records);
        await this.writeJsonFile('Substitude_file.csv', csvData);
        await this.writeJsonFile('teachers.json', result);
        return result;
      } else {
        // Process timetable CSV
        const result = this.processTimetableCSV(records);
        await this.writeJsonFile('timetable_file.csv', csvData);
        await this.writeJsonFile('schedules.json', result);
        return result;
      }
    } catch (error) {
      console.error('[MobileServer] Error processing CSV data:', error);
      throw error;
    }
  }

  /**
   * Process substitute CSV data
   */
  private processSubstituteCSV(records: any[]): any[] {
    // Extract teacher information from substitute file
    const teachers: any[] = [];
    const uniqueNames = new Set<string>();
    
    records.forEach((record, index) => {
      const name = record.Name?.trim();
      const phone = record.Phone?.trim();
      
      if (name && !uniqueNames.has(name)) {
        uniqueNames.add(name);
        teachers.push({
          id: index + 1,
          name,
          phone: phone || '',
          variations: [name]
        });
      }
    });
    
    return teachers;
  }

  /**
   * Process timetable CSV data
   */
  private processTimetableCSV(records: any[]): any[] {
    // Extract schedule information from timetable file
    const schedules: any[] = [];
    
    records.forEach((record, index) => {
      const day = record.Day?.trim();
      const period = parseInt(record.Period);
      const teacherName = record.Teacher?.trim();
      const className = record.Class?.trim();
      
      if (day && !isNaN(period) && teacherName && className) {
        schedules.push({
          id: index + 1,
          day,
          period,
          teacherName,
          className
        });
      }
    });
    
    return schedules;
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    this.serverError = null;
    
    if (this.isRunning) {
      console.log('[MobileServer] Server already running');
      return;
    }
    
    if (!Capacitor.isNativePlatform()) {
      console.log('[MobileServer] Running in browser, not starting local server');
      this.isRunning = false;
      return;
    }
    
    try {
      // Initialize data sync service
      await dataSync.initialize();
      
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.port, '0.0.0.0', () => {
          this.isRunning = true;
          console.log(`[MobileServer] Server started on port ${this.port}`);
          resolve();
        });
        
        this.server.on('error', (error: Error) => {
          console.error('[MobileServer] Server error:', error);
          this.serverError = error.message;
          this.isRunning = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error('[MobileServer] Failed to start server:', error);
      this.isRunning = false;
      this.serverError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
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
      console.log('[MobileServer] Server stopped');
    } catch (error) {
      console.error('[MobileServer] Error stopping server:', error);
    }
  }

  /**
   * Process uploaded CSV files and update JSON data
   */
  public async processUploadedCSV(fileContent: string, isSubstitute: boolean): Promise<void> {
    await this.processCSV(fileContent, isSubstitute);
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