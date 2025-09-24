import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// Project management endpoints
router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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

export default router;
