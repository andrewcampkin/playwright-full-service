import { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

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

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  testData?: { url: string; result: CrawlResult } | null;
  onSignUp: (userData: { email: string; password: string; name: string; testSuiteName?: string }) => Promise<void>;
}

export default function SignUpModal({ isOpen, onClose, testData, onSignUp }: SignUpModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    testSuiteName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (testData && !formData.testSuiteName.trim()) {
      setError('Please enter a name for your test suite');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSignUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        testSuiteName: formData.testSuiteName
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {testData ? 'Save Your Test Suite' : 'Create Your Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Test Preview - only show if we have test data */}
          {testData ? (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Test Generation Complete</span>
              </div>
              <p className="text-blue-800 text-sm">
                Generated {testData.result.tests.length} test cases for <strong>{testData.url}</strong>
              </p>
            </div>
          ) : (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Welcome to Playwright AI!</span>
              </div>
              <p className="text-green-800 text-sm">
                Create your account to start generating, managing, and executing automated tests for any website.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Test Suite Name - only show if we have test data */}
            {testData && (
              <div>
                <label htmlFor="testSuiteName" className="block text-sm font-medium text-gray-700 mb-2">
                  Test Suite Name *
                </label>
                <input
                  type="text"
                  id="testSuiteName"
                  value={formData.testSuiteName}
                  onChange={(e) => handleInputChange('testSuiteName', e.target.value)}
                  placeholder="e.g., E-commerce Checkout Flow"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Give your test suite a meaningful name</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {testData ? 'Creating Account & Saving Tests...' : 'Creating Account...'}
                </>
              ) : (
                testData ? 'Create Account & Save Tests' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
