import { Clock } from 'lucide-react';

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

interface ExecutionListProps {
  executions: TestExecution[];
  isLoading: boolean;
  onExecutionSelect: (execution: TestExecution) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatDuration: (startTime: string, endTime?: string) => string;
  formatDate: (dateString: string) => string;
}

export default function ExecutionList({
  executions,
  isLoading,
  onExecutionSelect,
  getStatusIcon,
  getStatusColor,
  formatDuration,
  formatDate
}: ExecutionListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading executions...</span>
        </div>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No test executions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
      <div className="space-y-4">
        {executions.map((execution) => (
          <div
            key={execution.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onExecutionSelect(execution)}
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
    </div>
  );
}
