import { useState } from 'react';
import { Play, ArrowRight, CheckCircle, Zap, Globe, Users } from 'lucide-react';

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

interface UnauthenticatedHomeProps {
  onSignUp: (testData: { url: string; result: CrawlResult }) => void;
}

export default function UnauthenticatedHome({ onSignUp }: UnauthenticatedHomeProps) {
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTests = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/crawl-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate tests');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignUp = () => {
    if (result) {
      onSignUp({ url, result });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered
              <span className="text-blue-600"> Test Generation</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Generate comprehensive Playwright tests for any website in seconds. 
              Let AI explore your site and create test cases automatically.
            </p>

            {/* Test Generation Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Try it for free - no signup required!
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    disabled={isGenerating}
                  />
                </div>
                
                <button
                  onClick={handleGenerateTests}
                  disabled={isGenerating || !url.trim()}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Tests...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-3" />
                      Generate Tests
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800">{error}</div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered</h3>
                <p className="text-gray-600">Advanced AI explores your website and generates comprehensive test cases automatically.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Any Website</h3>
                <p className="text-gray-600">Works with any public website - e-commerce, SaaS, blogs, and more.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Ready</h3>
                <p className="text-gray-600">Save, organize, and share test suites with your team for continuous testing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tests Generated Successfully!</h2>
              <p className="text-lg text-gray-600">
                Found {result.sitemap.length} pages and generated {result.tests.length} test cases
              </p>
            </div>

            {/* Test Results Preview */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Generated Test Cases:</h3>
              <div className="space-y-3">
                {result.tests.slice(0, 3).map((test, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {test.steps.length} steps
                    </div>
                  </div>
                ))}
                {result.tests.length > 3 && (
                  <div className="text-center text-gray-500">
                    ... and {result.tests.length - 3} more test cases
                  </div>
                )}
              </div>
            </div>

            {/* Sign Up CTA */}
            <div className="bg-blue-50 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to save and execute these tests?
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Sign up for free to save your test suite, execute tests, and track results over time.
              </p>
              <button
                onClick={handleSignUp}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 flex items-center mx-auto"
              >
                Sign Up & Save Tests
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
