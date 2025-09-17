// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { crawlAndGenerateTests } from './services/aiService.js';
import { AuthService } from './services/authService.js';
import { DatabaseService } from './services/database.js';
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

// Main endpoint: Crawl website and generate tests (now with database persistence)
app.post('/api/protected/crawl-and-generate', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { url, websiteId, projectId } = req.body;
    
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
    const result = await crawlAndGenerateTests(url);
    
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
      if (result.tests && result.tests.length > 0) {
        const testSuite = await DatabaseService.createTestSuite({
          name: `AI Generated Tests - ${new URL(url).hostname}`,
          description: `Automatically generated test cases for ${url}`,
          websiteId,
        });

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

// Legacy endpoint for backward compatibility (without authentication)
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

    console.log(`Starting AI crawl and test generation for: ${url} (legacy endpoint)`);
    
    // Use AI service to crawl website and generate tests
    const result = await crawlAndGenerateTests(url);
    
    console.log(`Completed AI crawl and test generation for: ${url}`);
    
    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
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
