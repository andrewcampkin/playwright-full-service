// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { crawlAndGenerateTests } from './services/aiService.js';
import { AuthService } from './services/authService.js';
import { DatabaseService } from './services/database.js';
import { TestImprovementService } from './services/testImprovementService.js';
import prisma from './services/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Docker frontend
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await AuthService.register({ email, password, name });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await AuthService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Protected routes middleware
app.use('/api/protected', AuthService.authenticateToken);

// Project management endpoints
app.get('/api/protected/projects', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const projects = await DatabaseService.getUserProjects(user.id);
    
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/protected/projects', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const project = await DatabaseService.createProject({
      name,
      description,
      userId: user.id,
    });
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Website management endpoints
app.post('/api/protected/websites', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { name, url, description, projectId } = req.body;
    
    if (!name || !url || !projectId) {
      return res.status(400).json({
        success: false,
        error: 'Name, URL, and project ID are required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Check if user has access to the project
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'project', projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this project'
      });
    }

    const website = await DatabaseService.createWebsite({
      name,
      url,
      description,
      projectId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Website created successfully',
      website
    });
  } catch (error) {
    console.error('Error creating website:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Public endpoint: Crawl website and generate tests (no authentication required)
app.post('/api/crawl-and-generate', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL is required',
        message: 'Please provide a valid URL to crawl and generate tests for'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid URL format',
        message: 'Please provide a valid URL (e.g., https://example.com)'
      });
    }

    console.log(`Starting public AI crawl and test generation for: ${url}`);
    
    // Use AI service to crawl website and generate tests
    const result = await crawlAndGenerateTests(url);
    
    console.log(`Completed public AI crawl and test generation for: ${url}`);
    
    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('Error in public crawl-and-generate endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate tests. Please try again.'
    });
  }
});

// Main endpoint: Crawl website and generate tests (now with database persistence)
app.post('/api/protected/crawl-and-generate', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { url, websiteId, projectId, testSuiteName } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL is required',
        message: 'Please provide a valid URL to crawl and generate tests for'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid URL format',
        message: 'Please provide a valid URL (e.g., https://example.com)'
      });
    }

    console.log(`Starting AI crawl and test generation for: ${url} by user: ${user.id}`);
    
    // Use AI service to crawl website and generate tests
    let result;
    if (req.body.generatedTests) {
      // Use pre-generated tests from signup flow
      result = {
        success: true,
        url: url,
        timestamp: new Date().toISOString(),
        sitemap: req.body.sitemap || [],
        tests: req.body.generatedTests,
        explorationLog: req.body.explorationLog || 0
      };
    } else {
      result = await crawlAndGenerateTests(url);
    }
    
    // If websiteId is provided, save the results to database
    if (websiteId) {
      // Check if user has access to the website
      const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', websiteId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this website'
        });
      }

      // Save exploration results
      await DatabaseService.createExplorationResult({
        websiteId,
        url,
        sitemap: JSON.stringify(result.sitemap),
        tests: JSON.stringify(result.tests),
        explorationData: JSON.stringify(result.explorationData),
        rawResponse: result.rawResponse,
      });

      // Create test suite and test cases
      let testSuiteId = null;
      if (result.tests && result.tests.length > 0) {
        // Use provided testSuiteName or generate a fallback name
        const suiteName = testSuiteName && testSuiteName.trim() 
          ? testSuiteName.trim()
          : `AI Generated Tests - ${new URL(url).hostname}`;
          
        const testSuite = await DatabaseService.createTestSuite({
          name: suiteName,
          description: `Automatically generated test cases for ${url}`,
          websiteId,
        });

        testSuiteId = testSuite.id;

        // Create test cases
        for (const test of result.tests) {
          await DatabaseService.createTestCase({
            name: test.name,
            description: test.description,
            steps: JSON.stringify(test.steps),
            testSuiteId: testSuite.id,
          });
        }
      }
    }
    
    console.log(`Completed AI crawl and test generation for: ${url}`);
    
    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      testSuiteId: testSuiteId,
      ...result
    });

  } catch (error) {
    console.error('Error in crawl-and-generate endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during crawling and test generation'
    });
  }
});


// Test execution and improvement endpoints
app.post('/api/protected/execute-test', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testCaseId, priority = 'normal' } = req.body;
    
    if (!testCaseId) {
      return res.status(400).json({
        success: false,
        error: 'testCaseId is required'
      });
    }

    // Check if user has access to the test case
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'testCase', testCaseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test case'
      });
    }

    console.log(`🚀 Queuing test execution for test case: ${testCaseId} by user: ${user.id}`);
    
    // Queue the test execution with the test runner service
    const testRunnerUrl = process.env.TEST_RUNNER_URL || 'http://localhost:3002';
    const response = await fetch(`${testRunnerUrl}/api/execute-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testCaseId,
        userId: user.id,
        priority
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to queue test execution');
    }

    res.json({
      success: true,
      message: 'Test execution queued successfully',
      ...result
    });

  } catch (error) {
    console.error('Error queuing test execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/protected/execute-test-suite', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId, priority = 'normal', parallel = false } = req.body;
    
    if (!testSuiteId) {
      return res.status(400).json({
        success: false,
        error: 'testSuiteId is required'
      });
    }

    // Check if user has access to the test suite
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'testSuite', testSuiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test suite'
      });
    }

    console.log(`🚀 Queuing test suite execution: ${testSuiteId} by user: ${user.id}`);
    
    // Queue the test suite execution with the test runner service
    const testRunnerUrl = process.env.TEST_RUNNER_URL || 'http://localhost:3002';
    const response = await fetch(`${testRunnerUrl}/api/execute-test-suite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testSuiteId,
        userId: user.id,
        priority,
        parallel
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to queue test suite execution');
    }

    res.json({
      success: true,
      message: 'Test suite execution queued successfully',
      ...result
    });

  } catch (error) {
    console.error('Error queuing test suite execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Test Improvement endpoints
app.post('/api/protected/analyze-test', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testCaseId, includeHistory = true } = req.body;
    
    if (!testCaseId) {
      return res.status(400).json({
        success: false,
        error: 'testCaseId is required'
      });
    }

    // Check if user has access to the test case
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'testCase', testCaseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test case'
      });
    }

    console.log(`🧠 Analyzing test case: ${testCaseId} by user: ${user.id}`);
    
    // Get execution history if requested
    let executionHistory = [];
    if (includeHistory) {
      executionHistory = await DatabaseService.getExecutionStats(testCaseId, 10);
    }
    
    // Generate AI improvement suggestions
    const analysis = await TestImprovementService.analyzeTestExecution(testCaseId, executionHistory);
    
    res.json({
      success: true,
      message: 'Test analysis completed',
      analysis
    });

  } catch (error) {
    console.error('Error analyzing test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/protected/analyze-test-suite', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId } = req.body;
    
    if (!testSuiteId) {
      return res.status(400).json({
        success: false,
        error: 'testSuiteId is required'
      });
    }

    // Check if user has access to the test suite
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'testSuite', testSuiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test suite'
      });
    }

    console.log(`🧠 Analyzing test suite: ${testSuiteId} by user: ${user.id}`);
    
    // Generate AI test suite analysis
    const analysis = await TestImprovementService.analyzeTestSuite(testSuiteId);
    
    res.json({
      success: true,
      message: 'Test suite analysis completed',
      analysis
    });

  } catch (error) {
    console.error('Error analyzing test suite:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get test suites for a user
app.get('/api/protected/test-suites', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { websiteId } = req.query;
    
    let testSuites;
    if (websiteId) {
      // Check if user has access to the website
      const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', websiteId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this website'
        });
      }
      
      testSuites = await DatabaseService.getTestSuitesByWebsite(websiteId);
    } else {
      testSuites = await DatabaseService.getTestSuitesByUser(user.id);
    }
    
    res.json({
      success: true,
      data: testSuites
    });
  } catch (error) {
    console.error('Error fetching test suites:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get test cases for a test suite
app.get('/api/protected/test-cases', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId } = req.query;
    
    if (!testSuiteId) {
      return res.status(400).json({
        success: false,
        error: 'testSuiteId is required'
      });
    }

    // Check if user has access to the test suite
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'testSuite', testSuiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this test suite'
      });
    }
    
    const testCases = await DatabaseService.getTestSuiteTestCases(testSuiteId);
    
    res.json({
      success: true,
      data: testCases
    });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get test executions
app.get('/api/protected/executions', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId, testCaseId } = req.query;
    
    let executions;
    if (testCaseId) {
      executions = await DatabaseService.getExecutionsByTestCase(testCaseId, user.id);
    } else if (testSuiteId) {
      executions = await DatabaseService.getExecutionsByTestSuite(testSuiteId, user.id);
    } else {
      executions = await DatabaseService.getExecutionsByUser(user.id);
    }
    
    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get execution statistics
app.get('/api/protected/execution-stats', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId, testCaseId } = req.query;
    
    const stats = await DatabaseService.getExecutionStats(testSuiteId, testCaseId, user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching execution stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get test results
app.get('/api/protected/test-results', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId, period } = req.query;
    
    const results = await DatabaseService.getTestResults(testSuiteId, period, user.id);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get test trends
app.get('/api/protected/test-trends', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { testSuiteId, period } = req.query;
    
    const trends = await DatabaseService.getTestTrends(testSuiteId, period, user.id);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching test trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Playwright AI Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/crawl-and-generate`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
