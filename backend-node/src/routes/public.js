import express from 'express';
import { crawlAndGenerateTests } from '../services/aiService.js';

const router = express.Router();

// Public endpoint: Crawl website and generate tests (no authentication required)
router.post('/crawl-and-generate', async (req, res) => {
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

export default router;
