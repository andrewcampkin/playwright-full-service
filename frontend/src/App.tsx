import { useState } from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './contexts/useAuth';
import Header from './components/Header';
import UnauthenticatedHome from './components/UnauthenticatedHome';
import AuthenticatedDashboard from './components/AuthenticatedDashboard';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';

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

function AppContent() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpTestData, setSignUpTestData] = useState<{ url: string; result: CrawlResult } | null>(null);

  const handleSignUpClick = (testData: { url: string; result: CrawlResult }) => {
    setSignUpTestData(testData);
    setShowSignUpModal(true);
  };

  const handleSignUp = async (userData: { email: string; password: string; name: string; testSuiteName?: string }) => {
    await register(userData.email, userData.password, userData.name);
    
    if (signUpTestData && userData.testSuiteName) {
      // Save the test suite after successful registration
      await saveTestSuiteAfterSignUp(signUpTestData, userData.testSuiteName);
    }
    
    setShowSignUpModal(false);
    setSignUpTestData(null);
  };

  const saveTestSuiteAfterSignUp = async (testData: { url: string; result: CrawlResult }, testSuiteName: string) => {
    try {
      // Create project
      const projectResponse = await fetch('http://localhost:3001/api/protected/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ 
          name: `Demo Project - ${new URL(testData.url).hostname}`,
          description: `Project for testing ${testData.url}`
        }),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const projectData = await projectResponse.json();
      const projectId = projectData.project.id;

      // Create website
      const websiteResponse = await fetch('http://localhost:3001/api/protected/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ 
          name: new URL(testData.url).hostname,
          url: testData.url,
          description: `Website for testing: ${testData.url}`,
          projectId: projectId
        }),
      });

      if (!websiteResponse.ok) {
        throw new Error('Failed to create website');
      }

      const websiteData = await websiteResponse.json();
      const websiteId = websiteData.website.id;

      // Save the test suite
      const response = await fetch('http://localhost:3001/api/protected/crawl-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ 
          url: testData.url,
          websiteId: websiteId,
          projectId: projectId,
          testSuiteName: testSuiteName,
          // Pass the already generated test data
          generatedTests: testData.result.tests,
          sitemap: testData.result.sitemap,
          explorationLog: testData.result.explorationLog
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save test suite');
      }
    } catch (error) {
      console.error('Error saving test suite after signup:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      
      {isAuthenticated ? (
        <AuthenticatedDashboard />
      ) : (
        <UnauthenticatedHome onSignUp={handleSignUpClick} />
      )}

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
      />

      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => {
          setShowSignUpModal(false);
          setSignUpTestData(null);
        }}
        testData={signUpTestData}
        onSignUp={handleSignUp}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;