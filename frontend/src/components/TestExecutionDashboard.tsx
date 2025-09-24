import { useState, useEffect, useCallback } from 'react';
import { Pause, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import ExecutionStats from './ExecutionStats';
import ExecutionControls from './ExecutionControls';
import ExecutionList from './ExecutionList';
import ExecutionModal from './ExecutionModal';
import TestSuiteSelector from './TestSuiteSelector';

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
  onTestSuiteSelect?: (testSuiteId: string) => void;
}

export default function TestExecutionDashboard({ 
  testSuiteId, 
  testCaseId,
  onTestSuiteSelect
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

  const loadExecutions = useCallback(async () => {
    if (!testSuiteId) return;
    
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
  }, [testSuiteId, testCaseId]);

  const loadStats = useCallback(async () => {
    if (!testSuiteId) return;
    
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
  }, [testSuiteId, testCaseId, executions]);

  useEffect(() => {
    if (testSuiteId) {
      loadExecutions();
      loadStats();
    }
  }, [testSuiteId, testCaseId, loadExecutions, loadStats]);

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

  const executeTestSuite = async (suiteId: string, parallel: boolean = false) => {
    try {
      const response = await fetch('http://localhost:3001/api/protected/execute-test-suite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ testSuiteId: suiteId, priority: 'normal', parallel })
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

  // Utility functions
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

  const handleTestSuiteSelect = (selectedTestSuiteId: string) => {
    if (onTestSuiteSelect) {
      onTestSuiteSelect(selectedTestSuiteId);
    }
  };

  if (!testSuiteId) {
    return (
      <div className="space-y-6">
        <TestSuiteSelector
          onTestSuiteSelect={handleTestSuiteSelect}
        />
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Test Suite</h3>
            <p className="text-gray-600">
              Choose a test suite from the dropdown above to view and execute tests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExecutionStats stats={stats} />
      
      <ExecutionControls
        testSuiteId={testSuiteId}
        testCaseId={testCaseId}
        onExecuteTestSuite={executeTestSuite}
        onExecuteTest={executeTest}
        onRefresh={loadExecutions}
      />
      
      <ExecutionList
        executions={executions}
        isLoading={isLoading}
        onExecutionSelect={setSelectedExecution}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        formatDuration={formatDuration}
        formatDate={formatDate}
      />
      
      <ExecutionModal
        execution={selectedExecution}
        onClose={() => setSelectedExecution(null)}
        getStatusColor={getStatusColor}
        formatDuration={formatDuration}
        formatDate={formatDate}
      />
    </div>
  );
}