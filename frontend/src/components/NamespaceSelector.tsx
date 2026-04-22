import { useState } from 'react';
import { ChevronDown, Layers, RefreshCw } from 'lucide-react';
import { useCluster } from '@/contexts/ClusterContext';

export default function NamespaceSelector() {
  const { 
    currentNamespace, 
    namespaces, 
    setCurrentNamespace, 
    refreshNamespaces,
    currentCluster 
  } = useCluster();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNamespaceChange = (namespace: string) => {
    setCurrentNamespace(namespace);
    setIsOpen(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshNamespaces();
    } finally {
      setLoading(false);
    }
  };

  if (!currentCluster) {
    return (
      <div className="relative">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Namespace
        </label>
        <div className="relative">
          <div className="w-full bg-gray-100 border border-gray-200 rounded-md pl-3 pr-10 py-2 text-sm text-gray-500">
            <span className="flex items-center">
              <Layers className="w-4 h-4 text-gray-400 mr-2" />
              Select cluster first
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Namespace
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <span className="flex items-center">
            <Layers className="w-4 h-4 text-gray-400 mr-2" />
            <span className="block truncate">{currentNamespace}</span>
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
              onClick={handleRefresh}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Namespaces
            </button>
            <div className="border-t border-gray-100 my-1" />
            {namespaces.map((namespace) => (
              <button
                key={namespace}
                onClick={() => handleNamespaceChange(namespace)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                  currentNamespace === namespace ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <Layers className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm">{namespace}</span>
                  {namespace === 'default' && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      Default
                    </span>
                  )}
                </div>
              </button>
            ))}
            {namespaces.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No namespaces found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}