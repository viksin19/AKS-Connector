// Cluster types
export interface ClusterInfo {
  name: string;
  server: string;
  current: boolean;
  namespace: string;
}

// Dashboard types
export interface DashboardData {
  clusters: ClusterInfo[];
  namespaces: number;
  pods: number;
  deployments: number;
  services: number;
  runningPods: number;
  failedPods: number;
}

// Pod types
export interface ContainerInfo {
  name: string;
  image: string;
  ready: boolean;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  node: string;
  labels: Record<string, string>;
  containers: ContainerInfo[];
}

// Deployment types
export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: number;
  ready: number;
  available: number;
  age: string;
  labels: Record<string, string>;
  selector: Record<string, string>;
  strategy: string;
  images: string[];
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  cluster: string;
  data: any;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Pod status types
export type PodStatus = 'Running' | 'Pending' | 'Failed' | 'Succeeded' | 'Unknown';

// Namespace type
export type Namespace = string;

// Scale request type
export interface ScaleRequest {
  replicas: number;
}