import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  id: string;
  testCaseId: string;
  testName: string;
  status: 'Passed' | 'Failed' | 'Error' | 'Running' | 'Pending';
  startTime: string;
  endTime?: string;
  duration?: number;
  errorMessage?: string;
  testSuite: string;
  website: string;
}

interface TestResultsSummaryProps {
  testSuiteId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  onViewDetails?: (testResult: TestResult) => void;
}

export default function TestResultsSummary({ 
  testSuiteId, 
  dateRange, 
  onViewDetails 
}: TestResultsSummaryProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [trends, setTrends] = useState({
    passRate: { current: 85, previous: 82, trend: 'up' as 'up' | 'down' | 'stable' },
    avgDuration: { current: 2.3, previous: 2.8, trend: 'down' as 'up' | 'down' | 'stable' },
    totalTests: { current: 156, previous: 142, trend: 'up' as 'up' | 'down' | 'stable' }
  });


  useEffect(() => {
    loadResults();
    loadTrends();
  }, [testSuiteId, selectedPeriod, dateRange]);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (testSuiteId) params.append('testSuiteId', testSuiteId);
      if (selectedPeriod) params.append('period', selectedPeriod);
      
      const response = await fetch(`http://localhost:3001/api/protected/test-results?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load test results');
      }
      
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) {
      console.error('Error loading test results:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      const params = new URLSearchParams();
      if (testSuiteId) params.append('testSuiteId', testSuiteId);
      if (selectedPeriod) params.append('period', selectedPeriod);
      
      const response = await fetch(`http://localhost:3001/api/protected/test-trends?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrends(data.data || {
          passRate: { current: 0, previous: 0, trend: 'stable' },
          avgDuration: { current: 0, previous: 0, trend: 'stable' },
          totalTests: { current: 0, previous: 0, trend: 'stable' }
        });
      } else {
        // Calculate basic trends from results if API not available
        const currentResults = results;
        const passRate = currentResults.length > 0 ? 
          (currentResults.filter(r => r.status === 'Passed').length / currentResults.length) * 100 : 0;
        const avgDuration = currentResults.length > 0 ?
          currentResults.reduce((sum, r) => sum + (r.duration || 0), 0) / currentResults.length : 0;
        
        setTrends({
          passRate: { current: passRate, previous: passRate, trend: 'stable' },
          avgDuration: { current: avgDuration, previous: avgDuration, trend: 'stable' },
          totalTests: { current: currentResults.length, previous: currentResults.length, trend: 'stable' }
        });
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const exportResults = async (format: 'csv' | 'json' = 'csv') => {
    try {
      // TODO: Implement export functionality
      console.log(`Exporting results as ${format}`);
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
      case 'Error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Running':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <div className="h-4 w-4 border-t-2 border-gray-400"></div>;
    }
  };

  const calculateMetrics = () => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'Passed').length;
    const failed = results.filter(r => r.status === 'Failed' || r.status === 'Error').length;
    const running = results.filter(r => r.status === 'Running').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    const completedResults = results.filter(r => r.duration);
    const avgDuration = completedResults.length > 0 
      ? completedResults.reduce((sum, r) => sum + (r.duration || 0), 0) / completedResults.length
      : 0;

    return { total, passed, failed, running, passRate, avgDuration };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Period Selector and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Results Summary</h3>
            <div className="flex space-x-2">
              {(['24h', '7d', '30d', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    selectedPeriod === period
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period === '24h' ? '24 Hours' : 
                   period === '7d' ? '7 Days' : 
                   period === '30d' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => exportResults('csv')}
              className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              <Download className="h-4 w-4 inline mr-1" />
              CSV
            </button>
            <button
              onClick={() => exportResults('json')}
              className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              <Download className="h-4 w-4 inline mr-1" />
              JSON
            </button>
            <button
              onClick={loadResults}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <RefreshCw className="h-4 w-4 inline mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.passRate}%</p>
            </div>
            <div className="flex items-center">
              {getTrendIcon(trends.passRate.trend)}
              <span className="ml-1 text-sm text-gray-600">
                {Math.abs(trends.passRate.current - trends.passRate.previous)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
            </div>
            <div className="flex items-center">
              {getTrendIcon(trends.totalTests.trend)}
              <span className="ml-1 text-sm text-gray-600">
                +{trends.totalTests.current - trends.totalTests.previous}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.avgDuration.toFixed(1)}s</p>
            </div>
            <div className="flex items-center">
              {getTrendIcon(trends.avgDuration.trend)}
              <span className="ml-1 text-sm text-gray-600">
                {trends.avgDuration.trend === 'down' ? '-' : '+'}
                {Math.abs(trends.avgDuration.current - trends.avgDuration.previous).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Currently Running</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.running}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">{metrics.passed}</p>
              <p className="text-xs text-gray-500">
                {metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0}% of total
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{metrics.failed}</p>
              <p className="text-xs text-gray-500">
                {metrics.total > 0 ? Math.round((metrics.failed / metrics.total) * 100) : 0}% of total
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.passRate}%</p>
              <p className="text-xs text-gray-500">
                {trends.passRate.trend === 'up' ? 'Improving' : 
                 trends.passRate.trend === 'down' ? 'Declining' : 'Stable'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Test Results</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading results...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No test results found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Suite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{result.testName}</div>
                          <div className="text-sm text-gray-500">{result.website}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.duration ? `${result.duration}s` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.testSuite}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(result.startTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => onViewDetails?.(result)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
