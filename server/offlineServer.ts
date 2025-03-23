import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { FileManager } from './fileManager';
import { registerEndpoints } from './endpoints';
import { ServerConfig } from '../shared/types';

class OfflineServer {
  private app: express.Application;
  private server: any;
  private fileManager: FileManager;
  private config: ServerConfig;
  private logs: string[] = [];

  constructor() {
    this.app = express();
    this.fileManager = new FileManager();
    this.config = {
      port: 8000,
      apiPrefix: '/api',
      dataLocation: 'bundle'
    };
  }

  public async configure(config: ServerConfig): Promise<void> {
    this.config = {
      ...this.config,
      ...config
    };

    // Load files from the specified location
    await this.fileManager.setDataLocation(this.config.dataLocation);
  }

  public async start(): Promise<void> {
    try {
      // Set up middleware
      this.app.use(express.json());
      this.app.use(express.urlencoded({ extended: false }));

      // Add logging middleware
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        const path = req.path;

        res.on('finish', () => {
          const duration = Date.now() - start;
          if (path.startsWith(this.config.apiPrefix)) {
            const logMessage = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            this.log(logMessage);
          }
        });

        next();
      });

      // Register API endpoints
      await registerEndpoints(this.app, this.fileManager, this.config.apiPrefix);

      // Start the server
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.config.port, '0.0.0.0', () => {
          this.log(`Server started on port ${this.config.port}`);
          resolve();
        });

        this.server.on('error', (err: Error) => {
          this.log(`Server error: ${err.message}`, 'error');
          reject(err);
        });
      });
    } catch (error) {
      this.log(`Failed to start server: ${(error as Error).message}`, 'error');
      throw error;
    }
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err: Error) => {
        if (err) {
          this.log(`Error stopping server: ${err.message}`, 'error');
          reject(err);
        } else {
          this.log('Server stopped');
          this.server = null;
          resolve();
        }
      });
    });
  }

  public async restart(config?: ServerConfig): Promise<void> {
    await this.stop();
    
    if (config) {
      await this.configure(config);
    }
    
    await this.start();
  }

  public log(message: string, level: 'info' | 'error' | 'warning' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry);
    this.logs.push(logEntry);
    
    // Keep only the last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  public getLogs(): string[] {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const offlineServer = new OfflineServer();
