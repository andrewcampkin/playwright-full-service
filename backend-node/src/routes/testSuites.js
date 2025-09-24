import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';
import { TestSuiteService } from '../services/testSuiteService.js';
import { crawlAndGenerateTests } from '../services/aiService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// Test Suite management endpoints
router.get('/', async (req, res) => {
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
      testSuites = await TestSuiteService.getTestSuitesByUser(user.id);
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

router.post('/', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { name, description, baseUrl } = req.body;
    
    if (!name || !baseUrl) {
      return res.status(400).json({
        success: false,
        error: 'Name and base URL are required'
      });
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base URL format'
      });
    }

    const testSuite = await TestSuiteService.createTestSuite({
      userId: user.id,
      name,
      description,
      baseUrl
    });
    
    res.status(201).json({
      success: true,
      message: 'Test suite created successfully',
      testSuite
    });
  } catch (error) {
    console.error('Error creating test suite:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test execution endpoints
router.post('/execute-test', async (req, res) => {
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

router.post('/execute-test-suite', async (req, res) => {
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

// Crawl and generate tests endpoint
router.post('/crawl-and-generate', async (req, res) => {
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

export default router;
