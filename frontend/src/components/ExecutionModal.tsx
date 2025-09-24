import { XCircle } from 'lucide-react';

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

interface ExecutionModalProps {
  execution: TestExecution | null;
  onClose: () => void;
  getStatusColor: (status: string) => string;
  formatDuration: (startTime: string, endTime?: string) => string;
  formatDate: (dateString: string) => string;
}

export default function ExecutionModal({
  execution,
  onClose,
  getStatusColor,
  formatDuration,
  formatDate
}: ExecutionModalProps) {
  if (!execution) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {execution.testCase.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Test Details</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">{execution.testCase.description}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Execution Info</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2">{formatDuration(execution.startTime, execution.endTime)}</span>
                </div>
                <div>
                  <span className="font-medium">Started:</span>
                  <span className="ml-2">{formatDate(execution.startTime)}</span>
                </div>
                {execution.endTime && (
                  <div>
                    <span className="font-medium">Completed:</span>
                    <span className="ml-2">{formatDate(execution.endTime)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {execution.errorMessage && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Error Details</h4>
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <p className="text-sm text-red-800">{execution.errorMessage}</p>
                </div>
              </div>
            )}
            
            {execution.executionLog && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Execution Log</h4>
                <div className="bg-gray-50 border p-3 rounded-md">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                    {execution.executionLog}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
