// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TestExecutionRequest {
  testCaseId: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface TestSuiteExecutionRequest {
  testSuiteId: string;
  priority?: 'high' | 'normal' | 'low';
  parallel?: boolean;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  status: 'Pending' | 'Running' | 'Passed' | 'Failed' | 'Skipped' | 'Timeout' | 'Error';
  startTime: string;
  endTime?: string;
  errorMessage?: string;
  executionLog?: string;
  results?: string;
  testCase: {
    id: string;
    name: string;
    description: string;
    testSuite: {
      name: string;
      website: {
        name: string;
        url: string;
      };
    };
  };
}

export interface TestResult {
  id: string;
  testCaseId: string;
  testName: string;
  status: 'Passed' | 'Failed' | 'Error' | 'Running' | 'Pending';
  startTime: string;
  endTime?: string;
  duration?: number;
  errorMessage?: string;
  testSuite: string;
  website: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Try to get token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Test Generation
  async generateTests(url: string): Promise<ApiResponse> {
    return this.request('/crawl-and-generate', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Test Execution
  async executeTest(request: TestExecutionRequest): Promise<ApiResponse<TestExecution>> {
    return this.request('/protected/execute-test', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async executeTestSuite(request: TestSuiteExecutionRequest): Promise<ApiResponse<TestExecution[]>> {
    return this.request('/protected/execute-test-suite', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Test Results and Analytics
  async getTestExecutions(testSuiteId?: string, testCaseId?: string): Promise<ApiResponse<TestExecution[]>> {
    const params = new URLSearchParams();
    if (testSuiteId) params.append('testSuiteId', testSuiteId);
    if (testCaseId) params.append('testCaseId', testCaseId);
    
    return this.request(`/protected/executions?${params.toString()}`);
  }

  async getTestResults(testSuiteId?: string, period?: string): Promise<ApiResponse<TestResult[]>> {
    const params = new URLSearchParams();
    if (testSuiteId) params.append('testSuiteId', testSuiteId);
    if (period) params.append('period', period);
    
    return this.request(`/protected/test-results?${params.toString()}`);
  }

  async getExecutionStatus(executionId: string): Promise<ApiResponse<TestExecution>> {
    return this.request(`/protected/execution/${executionId}/status`);
  }

  // AI Test Improvement
  async analyzeTest(testCaseId: string, includeHistory: boolean = true): Promise<ApiResponse> {
    return this.request('/protected/analyze-test', {
      method: 'POST',
      body: JSON.stringify({ testCaseId, includeHistory }),
    });
  }

  async analyzeTestSuite(testSuiteId: string): Promise<ApiResponse> {
    return this.request('/protected/analyze-test-suite', {
      method: 'POST',
      body: JSON.stringify({ testSuiteId }),
    });
  }

  // Authentication (for future use)
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(email: string, password: string, name?: string): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Queue Status
  async getQueueStatus(): Promise<ApiResponse> {
    return this.request('/protected/queue/status');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
