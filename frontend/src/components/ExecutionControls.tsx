import { Play } from 'lucide-react';

interface ExecutionControlsProps {
  testSuiteId: string;
  testCaseId?: string;
  onExecuteTestSuite: (testSuiteId: string, parallel: boolean) => void;
  onExecuteTest: (testCaseId: string, priority: 'high' | 'normal' | 'low') => void;
  onRefresh: () => void;
}

export default function ExecutionControls({
  testSuiteId,
  testCaseId,
  onExecuteTestSuite,
  onExecuteTest,
  onRefresh
}: ExecutionControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Test Execution</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => onExecuteTestSuite(testSuiteId, false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Play className="h-4 w-4 inline mr-2" />
            Run Test Suite
          </button>
          <button
            onClick={() => onExecuteTestSuite(testSuiteId, true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Play className="h-4 w-4 inline mr-2" />
            Run Parallel
          </button>
          {testCaseId && (
            <button
              onClick={() => onExecuteTest(testCaseId, 'high')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Play className="h-4 w-4 inline mr-2" />
              Run Test
            </button>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
