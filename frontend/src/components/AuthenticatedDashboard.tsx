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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-72 glass-card border-r border-white/30 flex flex-col">

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => setActiveTab('generate')}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                  activeTab === 'generate'
                    ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-700 border border-primary-200/50 shadow-glow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'generate'
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow'
                    : 'bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-accent-500'
                }`}>
                  <Plus className={`h-5 w-5 transition-colors duration-300 ${
                    activeTab === 'generate' ? 'text-white' : 'text-slate-600 group-hover:text-white'
                  }`} />
                </div>
                <span className="font-semibold">Generate Tests</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('sitemap')}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                  activeTab === 'sitemap'
                    ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-700 border border-primary-200/50 shadow-glow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'sitemap'
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow'
                    : 'bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-accent-500'
                }`}>
                  <Map className={`h-5 w-5 transition-colors duration-300 ${
                    activeTab === 'sitemap' ? 'text-white' : 'text-slate-600 group-hover:text-white'
                  }`} />
                </div>
                <span className="font-semibold">Test Suites</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('execute')}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                  activeTab === 'execute'
                    ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-700 border border-primary-200/50 shadow-glow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'execute'
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow'
                    : 'bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-accent-500'
                }`}>
                  <Play className={`h-5 w-5 transition-colors duration-300 ${
                    activeTab === 'execute' ? 'text-white' : 'text-slate-600 group-hover:text-white'
                  }`} />
                </div>
                <span className="font-semibold">Execute Tests</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('results')}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                  activeTab === 'results'
                    ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-700 border border-primary-200/50 shadow-glow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'results'
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow'
                    : 'bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-accent-500'
                }`}>
                  <BarChart3 className={`h-5 w-5 transition-colors duration-300 ${
                    activeTab === 'results' ? 'text-white' : 'text-slate-600 group-hover:text-white'
                  }`} />
                </div>
                <span className="font-semibold">Test Results</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-6 border-t border-white/30">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">User</p>
              <p className="text-xs text-slate-500 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Tab Content */}
          {activeTab === 'generate' && (
            <div className="animate-fade-in">
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
            </div>
          )}

          {activeTab === 'sitemap' && (
            <div className="animate-slide-up">
              <TestSuiteTab />
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="animate-slide-in-right">
              <TestExecutionDashboard 
                testSuiteId={selectedTestSuiteId || generatedTestSuiteId || undefined}
                onTestSuiteSelect={setSelectedTestSuiteId}
              />
            </div>
          )}

          {activeTab === 'results' && (
            <div className="animate-fade-in">
              <TestResultsSummary 
                testSuiteId={selectedTestSuiteId || generatedTestSuiteId || undefined}
                onViewDetails={(result) => {
                  console.log('View details for:', result);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
