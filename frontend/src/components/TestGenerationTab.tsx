import TestGenerationForm from './TestGenerationForm';
import TestGenerationResults from './TestGenerationResults';

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

interface TestGenerationTabProps {
  url: string;
  testSuiteName: string;
  isGenerating: boolean;
  result: CrawlResult | null;
  error: string | null;
  onUrlChange: (url: string) => void;
  onTestSuiteNameChange: (name: string) => void;
  onGenerate: () => void;
}

export default function TestGenerationTab({
  url,
  testSuiteName,
  isGenerating,
  result,
  error,
  onUrlChange,
  onTestSuiteNameChange,
  onGenerate
}: TestGenerationTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <TestGenerationForm
        url={url}
        testSuiteName={testSuiteName}
        isGenerating={isGenerating}
        onUrlChange={onUrlChange}
        onTestSuiteNameChange={onTestSuiteNameChange}
        onGenerate={onGenerate}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6 mb-8">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">AI is exploring the website...</h3>
              <p className="text-sm text-blue-700 mt-1">
                This may take a few minutes as the AI navigates through the website and generates test cases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <TestGenerationResults result={result} formatDate={formatDate} />
      )}
    </>
  );
}
