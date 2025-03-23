import { Application, Request, Response } from 'express';
import { FileManager } from './fileManager';

interface Endpoint {
  method: string;
  path: string;
  source: string;
  handler: (req: Request, res: Response) => void;
}

export async function registerEndpoints(
  app: Application, 
  fileManager: FileManager, 
  apiPrefix: string
): Promise<void> {
  // Default endpoints
  const endpoints: Endpoint[] = [
    {
      method: 'GET',
      path: `${apiPrefix}/users`,
      source: 'users.json',
      handler: (req, res) => {
        const data = fileManager.getFile('users.json');
        if (!data) {
          return res.status(404).json({ error: 'Data not found' });
        }
        res.json(data);
      }
    },
    {
      method: 'GET',
      path: `${apiPrefix}/products`,
      source: 'products.csv',
      handler: (req, res) => {
        const data = fileManager.getFile('products.csv');
        if (!data) {
          return res.status(404).json({ error: 'Data not found' });
        }
        res.json(data);
      }
    },
    {
      method: 'GET',
      path: `${apiPrefix}/orders`,
      source: 'orders.json',
      handler: (req, res) => {
        const data = fileManager.getFile('orders.json');
        if (!data) {
          return res.status(404).json({ error: 'Data not found' });
        }
        res.json(data);
      }
    }
  ];

  // Register all endpoints
  endpoints.forEach(endpoint => {
    switch (endpoint.method.toUpperCase()) {
      case 'GET':
        app.get(endpoint.path, endpoint.handler);
        break;
      case 'POST':
        app.post(endpoint.path, endpoint.handler);
        break;
      case 'PUT':
        app.put(endpoint.path, endpoint.handler);
        break;
      case 'DELETE':
        app.delete(endpoint.path, endpoint.handler);
        break;
      default:
        console.warn(`Unsupported method: ${endpoint.method}`);
    }
  });

  // Register dynamic endpoint to get all available files
  app.get(`${apiPrefix}/files`, (req, res) => {
    const files = fileManager.getFilesList();
    res.json({ files });
  });

  // Endpoint to request a specific file by name
  app.get(`${apiPrefix}/file/:filename`, (req, res) => {
    const { filename } = req.params;
    const data = fileManager.getFile(filename);
    
    if (!data) {
      return res.status(404).json({ error: `File ${filename} not found` });
    }
    
    res.json(data);
  });

  console.log(`Registered ${endpoints.length} API endpoints with prefix: ${apiPrefix}`);
}
