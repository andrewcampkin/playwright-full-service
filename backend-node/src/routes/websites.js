import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// Website management endpoints
router.post('/', async (req, res) => {
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

export default router;
