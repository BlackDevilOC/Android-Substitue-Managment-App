export interface ServerConfig {
  port: number;
  apiPrefix: string;
  dataLocation: string;
}

export interface DataFile {
  name: string;
  size: string;
  type: string;
}

export interface APIEndpoint {
  method: string;
  path: string;
  source: string;
}
