import express from 'express';
import { AuthService } from '../services/authService.js';
import { DatabaseService } from '../services/database.js';
import { SitemapService } from '../services/sitemapService.js';
import { CrawlerService } from '../services/crawlerService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(AuthService.authenticateToken);

// Sitemap endpoints
router.get('/:id', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }
    
    res.json({
      success: true,
      data: sitemap
    });
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/crawl', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    const { maxPages = 50, maxDepth = 3 } = req.body;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    console.log(`🕷️ Starting crawl for sitemap: ${id} by user: ${user.id}`);
    
    // Perform the crawl
    const crawlResult = await CrawlerService.crawlWebsite(sitemap.baseUrl, {
      maxPages,
      maxDepth,
      secrets: sitemap.secrets,
      existingPages: sitemap.pages,
      blockedPages: sitemap.blockedPages,
      inputFields: sitemap.inputFields
    });

    // Update the sitemap with new data
    const updatedSitemap = await SitemapService.updateSitemap(id, {
      pages: [...sitemap.pages, ...crawlResult.pages],
      blockedPages: crawlResult.blockedPages,
      inputFields: crawlResult.inputFields,
      status: 'draft'
    });
    
    res.json({
      success: true,
      message: 'Crawl completed successfully',
      data: {
        sitemap: updatedSitemap,
        crawlStats: crawlResult.stats
      }
    });
  } catch (error) {
    console.error('Error crawling sitemap:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/pages', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    const { url, title, description } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    // Add the new page
    const newPage = {
      url,
      title: title || 'Manual Page',
      description: description || '',
      h1: '',
      headings: [],
      links: [],
      forms: [],
      timestamp: new Date().toISOString(),
      manual: true
    };

    const updatedSitemap = await SitemapService.updateSitemap(id, {
      pages: [...sitemap.pages, newPage]
    });
    
    res.json({
      success: true,
      message: 'Page added successfully',
      data: updatedSitemap
    });
  } catch (error) {
    console.error('Error adding page:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/secrets', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    const { name, key, value, type = 'text', description } = req.body;
    
    if (!name || !key || !value) {
      return res.status(400).json({
        success: false,
        error: 'Name, key, and value are required'
      });
    }

    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    const secret = await SitemapService.addSecret(id, {
      name,
      key,
      value,
      type,
      description
    });
    
    res.status(201).json({
      success: true,
      message: 'Secret added successfully',
      data: secret
    });
  } catch (error) {
    console.error('Error adding secret:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id/secrets', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    const secrets = await SitemapService.getSecrets(id);
    
    res.json({
      success: true,
      data: secrets
    });
  } catch (error) {
    console.error('Error fetching secrets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id/secrets/:secretId', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id, secretId } = req.params;
    const updates = req.body;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    const secret = await SitemapService.updateSecret(secretId, updates);
    
    res.json({
      success: true,
      message: 'Secret updated successfully',
      data: secret
    });
  } catch (error) {
    console.error('Error updating secret:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:id/secrets/:secretId', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id, secretId } = req.params;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    await SitemapService.deleteSecret(secretId);
    
    res.json({
      success: true,
      message: 'Secret deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting secret:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/test-url', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    console.log(`🧪 Testing URL with secrets: ${url} for sitemap: ${id}`);
    
    const result = await CrawlerService.testUrlWithSecrets(url, sitemap.secrets);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    const updates = req.body;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    const updatedSitemap = await SitemapService.updateSitemap(id, updates);
    
    res.json({
      success: true,
      message: 'Sitemap updated successfully',
      data: updatedSitemap
    });
  } catch (error) {
    console.error('Error updating sitemap:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req);
    const { id } = req.params;
    
    const sitemap = await SitemapService.getSitemapById(id);
    if (!sitemap) {
      return res.status(404).json({
        success: false,
        error: 'Sitemap not found'
      });
    }

    // Check if user has access to the website
    const hasAccess = await DatabaseService.checkUserAccess(user.id, 'website', sitemap.websiteId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sitemap'
      });
    }

    await SitemapService.deleteSitemap(id);
    
    res.json({
      success: true,
      message: 'Sitemap deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sitemap:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
