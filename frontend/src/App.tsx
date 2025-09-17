import { useState } from 'react'
import './App.css'

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

function App() {
  const [url, setUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<CrawlResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateTests = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:3001/api/crawl-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate tests')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Playwright AI Test Generator
          </h1>
          <p className="text-lg text-gray-600">
            Enter a URL and let AI explore the website to generate comprehensive test cases
          </p>
        </div>

        {/* URL Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateTests}
                disabled={isGenerating || !url.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Tests'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
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
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-8">
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
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Crawl & Test Generation Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Status</div>
                  <div className="text-2xl font-bold text-green-900">
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Pages Found</div>
                  <div className="text-2xl font-bold text-blue-900">{result.sitemap.length}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Tests Generated</div>
                  <div className="text-2xl font-bold text-purple-900">{result.tests.length}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-orange-800">AI Actions</div>
                  <div className="text-2xl font-bold text-orange-900">{result.explorationLog}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <strong>URL:</strong> {result.url}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <strong>Completed:</strong> {formatDate(result.timestamp)}
              </div>
            </div>

            {/* Sitemap */}
            {result.sitemap.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Discovered Site Map</h3>
                <div className="space-y-3">
                  {result.sitemap.map((page, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{page.title}</h4>
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Generated Test Cases</h3>
                <div className="space-y-4">
                  {result.tests.map((testCase, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {index + 1}. {testCase.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{testCase.description}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
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
        )}
      </div>
    </div>
  )
}

export default App
