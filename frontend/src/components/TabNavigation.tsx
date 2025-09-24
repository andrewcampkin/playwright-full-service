interface TabNavigationProps {
  activeTab: 'generate' | 'sitemap' | 'execute' | 'results';
  onTabChange: (tab: 'generate' | 'sitemap' | 'execute' | 'results') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white rounded border border-gray-200 mb-8">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => onTabChange('generate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generate Tests
          </button>
          <button
            onClick={() => onTabChange('sitemap')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sitemap'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Test Suites
          </button>
          <button
            onClick={() => onTabChange('execute')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'execute'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Execute Tests
          </button>
          <button
            onClick={() => onTabChange('results')}
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
  );
}
