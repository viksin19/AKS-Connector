import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Activity, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Terminal,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useCluster } from '@/contexts/ClusterContext';
import { apiService } from '@/services/api';
import { PodInfo } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';
import toast from 'react-hot-toast';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'succeeded':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const PodRow = ({ pod, onDelete, onViewLogs }: { 
  pod: PodInfo; 
  onDelete: (podName: string) => void;
  onViewLogs: (podName: string) => void;
}) => {
  const [showDetails, setShowDetails] = useState(false);

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
              <div className="text-sm font-medium text-gray-900">{pod.name}</div>
              <div className="text-xs text-gray-500">{pod.namespace}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pod.status)}`}>
            {pod.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {pod.ready}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {pod.restarts}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {pod.age}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {pod.node || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewLogs(pod.name)}
              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
              title="View Logs"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(pod.name)}
              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
              title="Delete Pod"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-gray-50">
            <div className="space-y-4">
              {/* Labels */}
              {pod.labels && Object.keys(pod.labels).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(pod.labels).map(([key, value]) => (
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
              
              {/* Containers */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Containers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pod.containers.map((container) => (
                    <div key={container.name} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{container.name}</span>
                        <span className={`w-2 h-2 rounded-full ${container.ready ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      <div className="text-xs text-gray-600 break-all">{container.image}</div>
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

export default function Pods() {
  const { currentCluster, currentNamespace } = useCluster();
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: pods, isLoading, error, refetch } = useQuery({
    queryKey: ['pods', currentCluster, currentNamespace],
    queryFn: () => apiService.getPods(currentCluster!, currentNamespace),
    enabled: !!currentCluster && !!currentNamespace,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const deletePodMutation = useMutation({
    mutationFn: (podName: string) => 
      apiService.deletePod(currentCluster!, currentNamespace, podName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pods', currentCluster, currentNamespace] });
      toast.success('Pod deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete pod: ${error.response?.data?.error || error.message}`);
    },
  });

  // Subscribe to WebSocket updates for real-time pod updates
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type.includes('pod_')) {
        refetch();
      }
    });

    return unsubscribe;
  }, [subscribe, refetch]);

  const handleDeletePod = (podName: string) => {
    if (confirm(`Are you sure you want to delete pod "${podName}"?`)) {
      deletePodMutation.mutate(podName);
    }
  };

  const handleViewLogs = (podName: string) => {
    // Open logs in a new window (will be implemented as a modal later)
    window.open(`/api/v1/pods/${currentCluster}/${currentNamespace}/${podName}/logs`, '_blank');
  };

  // Filter pods based on search term and status
  const filteredPods = pods?.filter(pod => {
    const matchesSearch = pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pod.namespace.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         pod.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg text-gray-600">Loading pods...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Box className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Pods</h2>
          <p className="text-gray-600 mb-4">
            Unable to fetch pods for namespace "{currentNamespace}"
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
            <h1 className="text-3xl font-bold text-gray-900">Pods</h1>
            <p className="text-gray-600 mt-1">
              Manage pods in namespace "{currentNamespace}"
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

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="succeeded">Succeeded</option>
          </select>
        </div>
      </div>

      {/* Pods Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ready
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restarts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Node
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-lg font-medium">No pods found</div>
                    <div className="text-sm">
                      {pods?.length === 0 
                        ? `No pods exist in namespace "${currentNamespace}"`
                        : 'No pods match your search criteria'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPods.map((pod) => (
                  <PodRow
                    key={pod.name}
                    pod={pod}
                    onDelete={handleDeletePod}
                    onViewLogs={handleViewLogs}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredPods.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredPods.length} of {pods?.length || 0} pods
        </div>
      )}
    </div>
  );
}