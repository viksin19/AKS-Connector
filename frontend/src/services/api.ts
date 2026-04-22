import axios from 'axios';
import { ClusterInfo, DashboardData, PodInfo, DeploymentInfo, ScaleRequest } from '@/types';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Cluster management
  async getClusters(): Promise<ClusterInfo[]> {
    const response = await api.get('/clusters');
    return response.data;
  },

  // Dashboard data
  async getDashboard(cluster: string): Promise<DashboardData> {
    const response = await api.get(`/dashboard/${cluster}`);
    return response.data;
  },

  // Namespace management
  async getNamespaces(cluster: string): Promise<string[]> {
    const response = await api.get(`/namespaces/${cluster}`);
    return response.data;
  },

  // Pod management
  async getPods(cluster: string, namespace: string): Promise<PodInfo[]> {
    const response = await api.get(`/pods/${cluster}/${namespace}`);
    return response.data;
  },

  async deletePod(cluster: string, namespace: string, podName: string): Promise<void> {
    await api.delete(`/pods/${cluster}/${namespace}/${podName}`);
  },

  async getPodLogs(cluster: string, namespace: string, podName: string): Promise<string> {
    const response = await api.get(`/pods/${cluster}/${namespace}/${podName}/logs`, {
      responseType: 'text',
    });
    return response.data;
  },

  // Deployment management
  async getDeployments(cluster: string, namespace: string): Promise<DeploymentInfo[]> {
    const response = await api.get(`/deployments/${cluster}/${namespace}`);
    return response.data;
  },

  async scaleDeployment(
    cluster: string, 
    namespace: string, 
    deploymentName: string, 
    replicas: number
  ): Promise<void> {
    const scaleRequest: ScaleRequest = { replicas };
    await api.patch(`/deployments/${cluster}/${namespace}/${deploymentName}/scale`, scaleRequest);
  },

  async deleteDeployment(cluster: string, namespace: string, deploymentName: string): Promise<void> {
    await api.delete(`/deployments/${cluster}/${namespace}/${deploymentName}`);
  },
};

export default apiService;