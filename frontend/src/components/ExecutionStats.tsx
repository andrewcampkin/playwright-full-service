import { BarChart3, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface ExecutionStatsProps {
  stats: {
    total: number;
    passed: number;
    failed: number;
    running: number;
    avgExecutionTime: number;
  };
}

export default function ExecutionStats({ stats }: ExecutionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Total Tests</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Passed</p>
            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <XCircle className="h-8 w-8 text-red-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Running</p>
            <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Time</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(stats.avgExecutionTime / 1000)}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
