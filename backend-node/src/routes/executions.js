import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// Execution endpoints
router.get('/', async (req, res) => {
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

router.get('/stats', async (req, res) => {
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

router.get('/results', async (req, res) => {
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

router.get('/trends', async (req, res) => {
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

export default router;
