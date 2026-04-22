import { useState } from 'react';
import { ChevronDown, Server, RefreshCw } from 'lucide-react';
import { useCluster } from '@/contexts/ClusterContext';

export default function ClusterSelector() {
  const { 
    currentCluster, 
    clusters, 
    setCurrentCluster, 
    loading,
    refreshClusters 
  } = useCluster();
  const [isOpen, setIsOpen] = useState(false);

  const handleClusterChange = (clusterName: string) => {
    setCurrentCluster(clusterName);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Cluster
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
        >
          <span className="flex items-center">
            <Server className="w-4 h-4 text-gray-400 mr-2" />
            <span className="block truncate">
              {currentCluster || 'Select cluster...'}
            </span>
          </span>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {loading ? (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <button
              onClick={() => refreshClusters()}
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Refresh Clusters
            </button>
            <div className="border-t border-gray-100 my-1" />
            {clusters.map((cluster) => (
              <button
                key={cluster.name}
                onClick={() => handleClusterChange(cluster.name)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                  currentCluster === cluster.name ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <Server className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{cluster.name}</div>
                    {cluster.namespace && (
                      <div className="text-xs text-gray-500">
                        Default: {cluster.namespace}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {clusters.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No clusters found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}