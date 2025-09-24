import { useState, useEffect } from 'react';
import { ChevronDown, Search, Globe } from 'lucide-react';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  website: {
    id: string;
    name: string;
    url: string;
    project: {
      id: string;
      name: string;
    };
  };
  testCases: Array<{
    id: string;
    name: string;
  }>;
}

interface TestSuiteSelectorProps {
  onTestSuiteSelect: (testSuiteId: string) => void;
  selectedTestSuiteId?: string;
}

export default function TestSuiteSelector({
  onTestSuiteSelect,
  selectedTestSuiteId
}: TestSuiteSelectorProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestSuite, setSelectedTestSuite] = useState<TestSuite | null>(null);

  const loadTestSuites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/protected/test-suites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load test suites');
      }
      
      const data = await response.json();
      setTestSuites(data.data || []);
    } catch (error) {
      console.error('Error loading test suites:', error);
      setTestSuites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestSuites();
  }, []);

  useEffect(() => {
    if (selectedTestSuiteId && testSuites.length > 0) {
      const suite = testSuites.find(ts => ts.id === selectedTestSuiteId);
      setSelectedTestSuite(suite || null);
    }
  }, [selectedTestSuiteId, testSuites]);

  const filteredTestSuites = testSuites.filter(suite =>
    suite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suite.website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suite.website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suite.website.project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTestSuiteSelect = (testSuite: TestSuite) => {
    setSelectedTestSuite(testSuite);
    setIsOpen(false);
    setSearchTerm('');
    onTestSuiteSelect(testSuite.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Test Suite</h3>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="flex items-center justify-between">
            {selectedTestSuite ? (
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-gray-900">{selectedTestSuite.name}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedTestSuite.website.name} • {selectedTestSuite.testCases.length} test cases
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Choose a test suite to execute...</span>
            )}
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search test suites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredTestSuites.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-center">
                  {searchTerm ? 'No test suites found matching your search.' : 'No test suites available.'}
                </div>
              ) : (
                filteredTestSuites.map((testSuite) => (
                  <button
                    key={testSuite.id}
                    onClick={() => handleTestSuiteSelect(testSuite)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <Globe className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{testSuite.name}</div>
                        <div className="text-sm text-gray-500 truncate">{testSuite.website.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {testSuite.website.url} • {testSuite.testCases.length} test cases • {formatDate(testSuite.createdAt)}
                        </div>
                        {testSuite.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{testSuite.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {testSuites.length === 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="text-center">
            <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No test suites found.</p>
            <p className="text-xs text-gray-500 mt-1">Generate some tests first to see them here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
