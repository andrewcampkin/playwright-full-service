import { useState } from 'react';
import { Plus, Play, BarChart3, Map } from 'lucide-react';
import TestGenerationTab from './TestGenerationTab';
import TestSuiteTab from './TestSuiteTab';
import TestExecutionDashboard from './TestExecutionDashboard';
import TestResultsSummary from './TestResultsSummary';

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

export default function AuthenticatedDashboard() {
  const [url, setUrl] = useState('');
  const [testSuiteName, setTestSuiteName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'sitemap' | 'execute' | 'results'>('generate');
  const [generatedTestSuiteId, setGeneratedTestSuiteId] = useState<string | null>(null);
  const [selectedTestSuiteId, setSelectedTestSuiteId] = useState<string | null>(null);

  const handleGenerateTests = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!testSuiteName.trim()) {
      setError('Please enter a test suite name');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setGeneratedTestSuiteId(null);

    try {
      // First, we need to create a project and website to save the tests
      const projectResponse = await fetch('http://localhost:3001/api/protected/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ 
          name: `Demo Project - ${new URL(url.trim()).hostname}`,
          description: `Project for testing ${url.trim()}`
        }),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const projectData = await projectResponse.json();
      const projectId = projectData.project.id;

      // Create a website
      const websiteResponse = await fetch('http://localhost:3001/api/protected/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ 
          name: new URL(url.trim()).hostname,
          url: url.trim(),
          description: `Website for testing: ${url.trim()}`,
          projectId: projectId
        }),
      });

      if (!websiteResponse.ok) {
        throw new Error('Failed to create website');
      }

      const websiteData = await websiteResponse.json();
      const websiteId = websiteData.website.id;

      // Now generate tests and save them to the database
      const response = await fetch('http://localhost:3001/api/protected/crawl-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ 
          url: url.trim(),
          websiteId: websiteId,
          projectId: projectId,
          testSuiteName: testSuiteName.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate tests');
      }

      setResult(data);
      
      // Get the test suite ID from the response or fetch it
      if (data.testSuiteId) {
        setGeneratedTestSuiteId(data.testSuiteId);
      } else {
        // Fetch the latest test suite for this website
        const testSuitesResponse = await fetch(`http://localhost:3001/api/protected/test-suites?websiteId=${websiteId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          }
        });
        
        if (testSuitesResponse.ok) {
          const testSuitesData = await testSuitesResponse.json();
          if (testSuitesData.data && testSuitesData.data.length > 0) {
            setGeneratedTestSuiteId(testSuitesData.data[0].id);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col pt-4">
        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('generate')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'generate'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Generate Tests</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('sitemap')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'sitemap'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Map className="h-5 w-5" />
                <span className="font-medium">Test Suites</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('execute')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'execute'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Play className="h-5 w-5" />
                <span className="font-medium">Execute Tests</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('results')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'results'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Test Results</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Tab Content */}
          {activeTab === 'generate' && (
            <TestGenerationTab
              url={url}
              testSuiteName={testSuiteName}
              isGenerating={isGenerating}
              result={result}
              error={error}
              onUrlChange={setUrl}
              onTestSuiteNameChange={setTestSuiteName}
              onGenerate={handleGenerateTests}
            />
          )}

          {activeTab === 'sitemap' && (
            <TestSuiteTab />
          )}

          {activeTab === 'execute' && (
            <TestExecutionDashboard 
              testSuiteId={selectedTestSuiteId || generatedTestSuiteId || undefined}
              onTestSuiteSelect={setSelectedTestSuiteId}
            />
          )}

          {activeTab === 'results' && (
            <TestResultsSummary 
              testSuiteId={selectedTestSuiteId || generatedTestSuiteId || undefined}
              onViewDetails={(result) => {
                console.log('View details for:', result);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
