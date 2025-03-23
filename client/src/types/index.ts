export interface ServerConfig {
  port: number;
  autoStart: boolean;
  apiPrefix: string;
  dataLocation: "bundle" | "external";
}

export interface DataFile {
  name: string;
  path: string;
  size: string;
  type: "json" | "csv";
}

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  source: string;
}

export interface ServerStatus {
  running: boolean;
  status: "offline" | "running" | "restarting";
}

export interface ServerLog {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export interface TestResponse {
  status: number;
  statusText: string;
  duration: number;
  data: any;
}
