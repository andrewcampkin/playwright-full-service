import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import TestExecutionDashboard from './components/TestExecutionDashboard'
import TestResultsSummary from './components/TestResultsSummary'

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
  const [activeTab, setActiveTab] = useState<'generate' | 'execute' | 'results'>('generate')

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
    <div className="min-h-screen bg-white">
      <Header />
      
      {activeTab === 'generate' && <Hero />}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('generate')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'generate'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Generate Tests
              </button>
              <button
                onClick={() => setActiveTab('execute')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'execute'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Execute Tests
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Test Results
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'generate' && (
          <>
            {/* URL Input Form */}
            <div className="bg-white rounded border border-gray-200 p-6 mb-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Test Cases</h2>
                <p className="text-gray-600 mb-6">Enter a website URL and let AI explore it to generate comprehensive test cases</p>
                
                <div className="flex gap-4">
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
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateTests}
                      disabled={isGenerating || !url.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Tests'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
            )}
          </>
        )}

        {activeTab === 'execute' && (
          <TestExecutionDashboard 
            testSuiteId="demo-test-suite-id"
            onExecutionComplete={(execution) => {
              console.log('Execution completed:', execution);
            }}
          />
        )}

        {activeTab === 'results' && (
          <TestResultsSummary 
            testSuiteId="demo-test-suite-id"
            onViewDetails={(result) => {
              console.log('View details for:', result);
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App

