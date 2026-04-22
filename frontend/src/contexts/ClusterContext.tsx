import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClusterInfo } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface ClusterContextType {
  currentCluster: string | null;
  clusters: ClusterInfo[];
  currentNamespace: string;
  namespaces: string[];
  setCurrentCluster: (cluster: string) => void;
  setCurrentNamespace: (namespace: string) => void;
  loading: boolean;
  refreshClusters: () => Promise<void>;
  refreshNamespaces: () => Promise<void>;
}

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

interface ClusterProviderProps {
  children: ReactNode;
}

export function ClusterProvider({ children }: ClusterProviderProps) {
  const [currentCluster, setCurrentCluster] = useState<string | null>(null);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [currentNamespace, setCurrentNamespace] = useState<string>('default');
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [loading, setLoading] = useState(true);

  // Load clusters on mount
  useEffect(() => {
    refreshClusters();
  }, []);

  // Load namespaces when cluster changes
  useEffect(() => {
    if (currentCluster) {
      refreshNamespaces();
    }
  }, [currentCluster]);

  const refreshClusters = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClusters();
      setClusters(response);
      
      // Set first cluster as default if none selected
      if (!currentCluster && response.length > 0) {
        setCurrentCluster(response[0].name);
      }
    } catch (error) {
      console.error('Failed to load clusters:', error);
      toast.error('Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  const refreshNamespaces = async () => {
    if (!currentCluster) return;

    try {
      const response = await apiService.getNamespaces(currentCluster);
      setNamespaces(response);
      
      // Reset to default namespace if current one doesn't exist
      if (!response.includes(currentNamespace)) {
        setCurrentNamespace(response.includes('default') ? 'default' : response[0] || 'default');
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
      toast.error('Failed to load namespaces');
    }
  };

  const handleSetCurrentCluster = (cluster: string) => {
    setCurrentCluster(cluster);
    setCurrentNamespace('default'); // Reset namespace when changing cluster
  };

  const value: ClusterContextType = {
    currentCluster,
    clusters,
    currentNamespace,
    namespaces,
    setCurrentCluster: handleSetCurrentCluster,
    setCurrentNamespace,
    loading,
    refreshClusters,
    refreshNamespaces,
  };

  return (
    <ClusterContext.Provider value={value}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useCluster() {
  const context = useContext(ClusterContext);
  if (context === undefined) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
}