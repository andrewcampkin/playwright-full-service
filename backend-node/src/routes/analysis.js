import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';
import { TestImprovementService } from '../services/testImprovementService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// AI Test Improvement endpoints
router.post('/test', async (req, res) => {
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

router.post('/test-suite', async (req, res) => {
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

export default router;
