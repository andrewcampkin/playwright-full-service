import { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';

interface TestExecution {
  id: string;
  testCaseId: string;
  status: 'Pending' | 'Running' | 'Passed' | 'Failed' | 'Skipped' | 'Timeout' | 'Error';
  startTime: string;
  endTime?: string;
  errorMessage?: string;
  executionLog?: string;
  results?: string;
  testCase: {
    id: string;
    name: string;
    description: string;
    testSuite: {
      name: string;
      website: {
        name: string;
        url: string;
      };
    };
  };
}

interface TestExecutionDashboardProps {
  testSuiteId?: string;
  testCaseId?: string;
  onExecutionComplete?: (execution: TestExecution) => void;
}

export default function TestExecutionDashboard({ 
  testSuiteId, 
  testCaseId, 
  onExecutionComplete 
}: TestExecutionDashboardProps) {
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    running: 0,
    avgExecutionTime: 0
  });


  useEffect(() => {
    loadExecutions();
    loadStats();
  }, [testSuiteId, testCaseId]);

  const loadExecutions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (testSuiteId) params.append('testSuiteId', testSuiteId);
      if (testCaseId) params.append('testCaseId', testCaseId);
      
      const response = await fetch(`http://localhost:3001/api/protected/executions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load executions');
      }
      
      const data = await response.json();
      setExecutions(data.data || []);
    } catch (error) {
      console.error('Error loading executions:', error);
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (testSuiteId) params.append('testSuiteId', testSuiteId);
      if (testCaseId) params.append('testCaseId', testCaseId);
      
      const response = await fetch(`http://localhost:3001/api/protected/execution-stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || { total: 0, passed: 0, failed: 0, running: 0, avgExecutionTime: 0 });
      } else {
        // Calculate stats from executions if API not available
        const total = executions.length;
        const passed = executions.filter(e => e.status === 'Passed').length;
        const failed = executions.filter(e => e.status === 'Failed').length;
        const running = executions.filter(e => e.status === 'Running').length;
        
        const completedExecutions = executions.filter(e => e.endTime && e.startTime);
        const avgTime = completedExecutions.length > 0 
          ? completedExecutions.reduce((sum, e) => {
              const duration = new Date(e.endTime!).getTime() - new Date(e.startTime).getTime();
              return sum + duration;
            }, 0) / completedExecutions.length
          : 0;

        setStats({ total, passed, failed, running, avgExecutionTime: avgTime });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const executeTest = async (testCaseId: string, priority: 'high' | 'normal' | 'low' = 'normal') => {
    try {
      const response = await fetch('http://localhost:3001/api/protected/execute-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ testCaseId, priority })
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute test');
      }
      
      const data = await response.json();
      console.log('Test execution queued:', data);
      
      // Refresh executions to show the new one
      loadExecutions();
    } catch (error) {
      console.error('Error executing test:', error);
    }
  };

  const executeTestSuite = async (testSuiteId: string, parallel: boolean = false) => {
    try {
      const response = await fetch('http://localhost:3001/api/protected/execute-test-suite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ testSuiteId, priority: 'normal', parallel })
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute test suite');
      }
      
      const data = await response.json();
      console.log('Test suite execution queued:', data);
      
      // Refresh executions to show the new ones
      loadExecutions();
    } catch (error) {
      console.error('Error executing test suite:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Failed':
      case 'Error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'Skipped':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'Timeout':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
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
      case 'Skipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'Timeout':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}m ${Math.round((duration % 60000) / 1000)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
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

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Test Execution</h3>
          <div className="flex space-x-3">
            {testSuiteId && (
              <button
                onClick={() => executeTestSuite(testSuiteId, false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Play className="h-4 w-4 inline mr-2" />
                Run Test Suite
              </button>
            )}
            {testSuiteId && (
              <button
                onClick={() => executeTestSuite(testSuiteId, true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Play className="h-4 w-4 inline mr-2" />
                Run Parallel
              </button>
            )}
            {testCaseId && (
              <button
                onClick={() => executeTest(testCaseId, 'high')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Play className="h-4 w-4 inline mr-2" />
                Run Test
              </button>
            )}
            <button
              onClick={loadExecutions}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Executions List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading executions...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No test executions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedExecution(execution)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(execution.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{execution.testCase.name}</h4>
                        <p className="text-sm text-gray-600">{execution.testCase.description}</p>
                        <p className="text-xs text-gray-500">
                          {execution.testCase.testSuite.website.name} • {execution.testCase.testSuite.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDuration(execution.startTime, execution.endTime)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(execution.startTime)}
                      </p>
                    </div>
                  </div>
                  
                  {execution.errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {execution.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedExecution.testCase.name}
                </h3>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Test Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">{selectedExecution.testCase.description}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Execution Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedExecution.status)}`}>
                        {selectedExecution.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{formatDuration(selectedExecution.startTime, selectedExecution.endTime)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Started:</span>
                      <span className="ml-2">{formatDate(selectedExecution.startTime)}</span>
                    </div>
                    {selectedExecution.endTime && (
                      <div>
                        <span className="font-medium">Completed:</span>
                        <span className="ml-2">{formatDate(selectedExecution.endTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedExecution.errorMessage && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Error Details</h4>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <p className="text-sm text-red-800">{selectedExecution.errorMessage}</p>
                    </div>
                  </div>
                )}
                
                {selectedExecution.executionLog && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Execution Log</h4>
                    <div className="bg-gray-50 border p-3 rounded-md">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                        {selectedExecution.executionLog}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
