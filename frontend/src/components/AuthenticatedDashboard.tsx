import { useState } from 'react';
import { Plus, Play, BarChart3 } from 'lucide-react';
import TabNavigation from './TabNavigation';
import TestGenerationTab from './TestGenerationTab';
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
  const [activeTab, setActiveTab] = useState<'generate' | 'execute' | 'results'>('generate');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Playwright AI</h1>
              <p className="text-gray-600 mt-1">Generate, execute, and manage your automated tests</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('generate')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>New Test Suite</span>
              </button>
              <button
                onClick={() => setActiveTab('execute')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                <span>Run Tests</span>
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Results</span>
              </button>
            </div>
          </div>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

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
  );
}
