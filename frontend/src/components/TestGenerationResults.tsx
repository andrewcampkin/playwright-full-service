interface TestStep {
  action: string;
  target: string;
  value: string | null;
}

interface TestCase {
  name: string;
  description: string;
  steps: TestStep[];
}

interface CrawlResult {
  success: boolean;
  url: string;
  timestamp: string;
  sitemap: Array<{
    url: string;
    title: string;
    description: string;
  }>;
  tests: TestCase[];
  explorationLog: number;
  rawResponse?: string;
}

interface TestGenerationResultsProps {
  result: CrawlResult;
  formatDate: (dateString: string) => string;
}

export default function TestGenerationResults({ result, formatDate }: TestGenerationResultsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Generation Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <div className="text-sm font-medium text-green-800">Status</div>
            <div className="text-xl font-bold text-green-900">
              {result.success ? 'Success' : 'Failed'}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <div className="text-sm font-medium text-blue-800">Pages Found</div>
            <div className="text-xl font-bold text-blue-900">{result.sitemap.length}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <div className="text-sm font-medium text-purple-800">Tests Generated</div>
            <div className="text-xl font-bold text-purple-900">{result.tests.length}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded border border-orange-200">
            <div className="text-sm font-medium text-orange-800">AI Actions</div>
            <div className="text-xl font-bold text-orange-900">{result.explorationLog}</div>
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>URL:</strong> {result.url}</div>
          <div><strong>Completed:</strong> {formatDate(result.timestamp)}</div>
        </div>
      </div>

      {/* Sitemap */}
      {result.sitemap.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovered Site Map</h3>
          <div className="space-y-3">
            {result.sitemap.map((page, index) => (
              <div key={index} className="border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{page.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{page.description}</p>
                    <a 
                      href={page.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                      {page.url}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases */}
      {result.tests.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Test Cases</h3>
          <div className="space-y-4">
            {result.tests.map((testCase, index) => (
              <div key={index} className="border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {index + 1}. {testCase.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{testCase.description}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    {testCase.steps.length} steps
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Test Steps:</h5>
                  <div className="space-y-1">
                    {testCase.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium mr-3">
                          {stepIndex + 1}
                        </span>
                        <span className="font-medium text-gray-800 mr-2">{step.action}</span>
                        {step.target && (
                          <span className="text-gray-600">on <code className="bg-gray-200 px-1 rounded">{step.target}</code></span>
                        )}
                        {step.value && (
                          <span className="text-gray-600">with value <code className="bg-gray-200 px-1 rounded">"{step.value}"</code></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Response (for debugging) */}
      {result.rawResponse && (
        <details className="bg-white rounded-lg shadow-md p-6">
          <summary className="text-lg font-semibold text-gray-900 cursor-pointer">
            Raw AI Response (Debug)
          </summary>
          <pre className="mt-4 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg overflow-auto">
            {result.rawResponse}
          </pre>
        </details>
      )}
    </div>
  );
}
