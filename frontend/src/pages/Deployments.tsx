import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { 
  Rocket, 
  Activity, 
  RefreshCw, 
  Trash2, 
  Scale,
  Search,
  ChevronDown,
  Plus,
  Minus,
  Check,
  X
} from 'lucide-react';
import { useCluster } from '@/contexts/ClusterContext';
import { apiService } from '@/services/api';
import { DeploymentInfo } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';
import toast from 'react-hot-toast';

const DeploymentRow = ({ 
  deployment, 
  onDelete, 
  onScale 
}: { 
  deployment: DeploymentInfo; 
  onDelete: (deploymentName: string) => void;
  onScale: (deploymentName: string, replicas: number) => void;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [scaleValue, setScaleValue] = useState(deployment.replicas);

  const handleScaleSubmit = () => {
    onScale(deployment.name, scaleValue);
    setIsScaling(false);
  };

  const handleScaleCancel = () => {
    setScaleValue(deployment.replicas);
    setIsScaling(false);
  };

  const getHealthColor = () => {
    if (deployment.ready === deployment.replicas) {
      return 'text-green-600';
    } else if (deployment.ready === 0) {
      return 'text-red-600';
    } else {
      return 'text-yellow-600';
    }
  };

  return (
    <>
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mr-2 p-1 hover:bg-gray-100 rounded"
            >
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showDetails ? 'transform rotate-180' : ''
                }`} 
              />
            </button>
            <div>
              <div className="text-sm font-medium text-gray-900">{deployment.name}</div>
              <div className="text-xs text-gray-500">{deployment.namespace}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {isScaling ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setScaleValue(Math.max(0, scaleValue - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Minus className="w-4 h-4 text-gray-500" />
              </button>
              <input
                type="number"
                value={scaleValue}
                onChange={(e) => setScaleValue(parseInt(e.target.value) || 0)}
                min="0"
                max="100"
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              />
              <button
                onClick={() => setScaleValue(scaleValue + 1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={handleScaleSubmit}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleScaleCancel}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900">{deployment.replicas}</span>
              <button
                onClick={() => setIsScaling(true)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Scale deployment"
              >
                <Scale className="w-4 h-4" />
              </button>
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`text-sm font-medium ${getHealthColor()}`}>
            {deployment.ready}/{deployment.replicas}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`text-sm font-medium ${getHealthColor()}`}>
            {deployment.available}/{deployment.replicas}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {deployment.age}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {deployment.strategy}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => onDelete(deployment.name)}
            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
            title="Delete Deployment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-gray-50">
            <div className="space-y-4">
              {/* Labels */}
              {deployment.labels && Object.keys(deployment.labels).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(deployment.labels).map(([key, value]) => (
                      <span 
                        key={key} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selectors */}
              {deployment.selector && Object.keys(deployment.selector).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Selector</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(deployment.selector).map(([key, value]) => (
                      <span 
                        key={key} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Container Images</h4>
                <div className="space-y-2">
                  {deployment.images.map((image, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm font-mono text-gray-700 break-all">{image}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function Deployments() {
  const { currentCluster, currentNamespace } = useCluster();
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: deployments, isLoading, error, refetch } = useQuery({
    queryKey: ['deployments', currentCluster, currentNamespace],
    queryFn: () => apiService.getDeployments(currentCluster!, currentNamespace),
    enabled: !!currentCluster && !!currentNamespace,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const scaleDeploymentMutation = useMutation({
    mutationFn: ({ deploymentName, replicas }: { deploymentName: string; replicas: number }) =>
      apiService.scaleDeployment(currentCluster!, currentNamespace, deploymentName, replicas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments', currentCluster, currentNamespace] });
      toast.success('Deployment scaled successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to scale deployment: ${error.response?.data?.error || error.message}`);
    },
  });

  const deleteDeploymentMutation = useMutation({
    mutationFn: (deploymentName: string) =>
      apiService.deleteDeployment(currentCluster!, currentNamespace, deploymentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments', currentCluster, currentNamespace] });
      toast.success('Deployment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete deployment: ${error.response?.data?.error || error.message}`);
    },
  });

  // Subscribe to WebSocket updates for real-time deployment updates
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type.includes('deployment_')) {
        refetch();
      }
    });

    return unsubscribe;
  }, [subscribe, refetch]);

  const handleScaleDeployment = (deploymentName: string, replicas: number) => {
    scaleDeploymentMutation.mutate({ deploymentName, replicas });
  };

  const handleDeleteDeployment = (deploymentName: string) => {
    if (confirm(`Are you sure you want to delete deployment "${deploymentName}"?`)) {
      deleteDeploymentMutation.mutate(deploymentName);
    }
  };

  // Filter deployments based on search term
  const filteredDeployments = deployments?.filter(deployment =>
    deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deployment.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg text-gray-600">Loading deployments...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Rocket className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Deployments</h2>
          <p className="text-gray-600 mb-4">
            Unable to fetch deployments for namespace "{currentNamespace}"
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deployments</h1>
            <p className="text-gray-600 mt-1">
              Manage deployments in namespace "{currentNamespace}"
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Deployments Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Replicas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ready
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeployments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-lg font-medium">No deployments found</div>
                    <div className="text-sm">
                      {deployments?.length === 0 
                        ? `No deployments exist in namespace "${currentNamespace}"`
                        : 'No deployments match your search criteria'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeployments.map((deployment) => (
                  <DeploymentRow
                    key={deployment.name}
                    deployment={deployment}
                    onDelete={handleDeleteDeployment}
                    onScale={handleScaleDeployment}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredDeployments.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredDeployments.length} of {deployments?.length || 0} deployments
        </div>
      )}
    </div>
  );
}