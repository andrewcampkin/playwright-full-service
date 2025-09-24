import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// Test Cases endpoints
router.get('/', async (req, res) => {
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

export default router;
