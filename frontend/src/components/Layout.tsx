import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  Rocket, 
  Settings, 
  Activity,
  Layers,
} from 'lucide-react';
import { useCluster } from '@/contexts/ClusterContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import ClusterSelector from './ClusterSelector';
import NamespaceSelector from './NamespaceSelector';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pods', href: '/pods', icon: Box },
  { name: 'Deployments', href: '/deployments', icon: Rocket },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentCluster, loading } = useCluster();
  const { connected } = useWebSocket();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AKS Connector</h1>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-500">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cluster and Namespace Selectors */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-3">
            <ClusterSelector />
            <NamespaceSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Version 1.0.0</div>
              {currentCluster && (
                <div className="font-medium text-gray-700">
                  Cluster: {currentCluster}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="min-h-screen">
          {loading ? (
            <div className="flex items-center justify-center h-screen">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-lg text-gray-600">Loading clusters...</span>
              </div>
            </div>
          ) : !currentCluster ? (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Clusters Found</h2>
                <p className="text-gray-600 max-w-md">
                  Make sure your kubeconfig file is properly configured and accessible.
                  Check ~/.kube/config or set the KUBECONFIG environment variable.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}