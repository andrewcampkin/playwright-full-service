interface TestGenerationFormProps {
  url: string;
  testSuiteName: string;
  isGenerating: boolean;
  onUrlChange: (url: string) => void;
  onTestSuiteNameChange: (name: string) => void;
  onGenerate: () => void;
}

export default function TestGenerationForm({
  url,
  testSuiteName,
  isGenerating,
  onUrlChange,
  onTestSuiteNameChange,
  onGenerate
}: TestGenerationFormProps) {
  return (
    <div className="bg-white rounded border border-gray-200 p-6 mb-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Test Cases</h2>
        <p className="text-gray-600 mb-6">Enter a website URL and let AI explore it to generate comprehensive test cases</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isGenerating}
            />
          </div>
          
          <div>
            <label htmlFor="testSuiteName" className="block text-sm font-medium text-gray-700 mb-2">
              Test Suite Name
            </label>
            <input
              type="text"
              id="testSuiteName"
              value={testSuiteName}
              onChange={(e) => onTestSuiteNameChange(e.target.value)}
              placeholder="Enter a name for your test suite..."
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">Give your test suite a meaningful name to identify it later</p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onGenerate}
              disabled={isGenerating || !url.trim() || !testSuiteName.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Tests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
