import { useQuery } from '@tanstack/react-query';
import { 
  Server, 
  Box, 
  Rocket, 
  Network, 
  Activity, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useCluster } from '@/contexts/ClusterContext';
import { apiService } from '@/services/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useEffect } from 'react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  subtitle?: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

const ClusterCard = ({ cluster }: { cluster: any }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Server className="w-8 h-8 text-blue-600" />
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-gray-900">{cluster.name}</h3>
          <p className="text-sm text-gray-600">{cluster.server}</p>
          {cluster.namespace && (
            <p className="text-xs text-gray-500">Default NS: {cluster.namespace}</p>
          )}
        </div>
      </div>
      <div className="flex items-center">
        {cluster.current ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Active</span>
          </div>
        ) : (
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        )}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { currentCluster } = useCluster();
  const { subscribe } = useWebSocket();

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', currentCluster],
    queryFn: () => apiService.getDashboard(currentCluster!),
    enabled: !!currentCluster,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to WebSocket updates for real-time dashboard refresh
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type.includes('pod_') || message.type.includes('deployment_')) {
        refetch();
      }
    });

    return unsubscribe;
  }, [subscribe, refetch]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Unable to fetch dashboard data for cluster "{currentCluster}"
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

  const {
    clusters,
    namespaces,
    pods,
    deployments,
    services,
    runningPods,
    failedPods,
  } = dashboardData;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your Kubernetes cluster resources
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Namespaces"
          value={namespaces}
          icon={Network}
          color="bg-purple-600"
        />
        <StatCard
          title="Total Pods"
          value={pods}
          icon={Box}
          color="bg-blue-600"
          subtitle={`${runningPods} running, ${failedPods} failed`}
        />
        <StatCard
          title="Deployments"
          value={deployments}
          icon={Rocket}
          color="bg-green-600"
        />
        <StatCard
          title="Services"
          value={services}
          icon={Network}
          color="bg-indigo-600"
        />
      </div>

      {/* Pod Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pod Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Running</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{runningPods}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Failed</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{failedPods}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Other</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {pods - runningPods - failedPods}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/pods"
              className="block w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Box className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">View Pods</div>
                  <div className="text-xs text-gray-500">Manage pod lifecycle</div>
                </div>
              </div>
            </a>
            <a
              href="/deployments"
              className="block w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Rocket className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">View Deployments</div>
                  <div className="text-xs text-gray-500">Scale and manage deployments</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Active Clusters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Clusters</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clusters.map((cluster) => (
            <ClusterCard key={cluster.name} cluster={cluster} />
          ))}
        </div>
      </div>
    </div>
  );
}