import { chromium } from 'playwright';

class CrawlerService {
  /**
   * Crawl a website and generate a sitemap
   */
  static async crawlWebsite(baseUrl, options = {}) {
    const {
      maxPages = 50,
      maxDepth = 3,
      timeout = 30000,
      secrets = [],
      existingPages = [],
      blockedPages = [],
      inputFields = []
    } = options;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const pages = new Map();
    const visited = new Set();
    const queue = [{ url: baseUrl, depth: 0 }];
    const foundInputFields = [...inputFields];
    const newBlockedPages = [...blockedPages];

    try {
      while (queue.length > 0 && pages.size < maxPages) {
        const { url, depth } = queue.shift();
        
        if (visited.has(url) || depth > maxDepth) {
          continue;
        }

        visited.add(url);

        try {
          const page = await context.newPage();
          await page.setDefaultTimeout(timeout);

          // Apply secrets if any
          if (secrets.length > 0) {
            await this.applySecrets(page, secrets);
          }

          const response = await page.goto(url, { waitUntil: 'networkidle' });
          
          if (!response || !response.ok()) {
            newBlockedPages.push({
              url,
              reason: `HTTP ${response?.status() || 'Unknown'}`,
              timestamp: new Date().toISOString()
            });
            await page.close();
            continue;
          }

          // Extract page information
          const pageInfo = await this.extractPageInfo(page, url);
          pages.set(url, pageInfo);

          // Find input fields on this page
          const pageInputFields = await this.findInputFields(page, url);
          foundInputFields.push(...pageInputFields);

          // Find links to crawl
          if (depth < maxDepth) {
            const links = await this.extractLinks(page, baseUrl);
            for (const link of links) {
              if (!visited.has(link) && !pages.has(link)) {
                queue.push({ url: link, depth: depth + 1 });
              }
            }
          }

          await page.close();

        } catch (error) {
          console.error(`Error crawling ${url}:`, error.message);
          newBlockedPages.push({
            url,
            reason: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

    } finally {
      await browser.close();
    }

    return {
      pages: Array.from(pages.values()),
      blockedPages: newBlockedPages,
      inputFields: this.deduplicateInputFields(foundInputFields),
      stats: {
        totalPages: pages.size,
        blockedPages: newBlockedPages.length,
        inputFields: foundInputFields.length
      }
    };
  }

  /**
   * Apply secrets to a page (for login forms, etc.)
   */
  static async applySecrets(page, secrets) {
    for (const secret of secrets) {
      try {
        // Try to find and fill input fields
        const selector = `input[name="${secret.key}"], input[id="${secret.key}"], input[placeholder*="${secret.key}"]`;
        const element = await page.$(selector);
        
        if (element) {
          await element.fill(secret.value);
          console.log(`Applied secret ${secret.name} to field ${secret.key}`);
        }
      } catch (error) {
        console.error(`Error applying secret ${secret.name}:`, error.message);
      }
    }
  }

  /**
   * Extract page information
   */
  static async extractPageInfo(page, url) {
    try {
      const title = await page.title();
      const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
      const h1 = await page.$eval('h1', el => el.textContent).catch(() => '');
      
      // Get page content for analysis
      const content = await page.evaluate(() => {
        return {
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()),
          links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          })),
          forms: Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action,
            method: form.method,
            inputs: Array.from(form.querySelectorAll('input')).map(input => ({
              name: input.name,
              type: input.type,
              placeholder: input.placeholder
            }))
          }))
        };
      });

      return {
        url,
        title: title || 'Untitled',
        description: description || '',
        h1: h1 || '',
        headings: content.headings,
        links: content.links,
        forms: content.forms,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error extracting page info for ${url}:`, error.message);
      return {
        url,
        title: 'Error',
        description: '',
        h1: '',
        headings: [],
        links: [],
        forms: [],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Find input fields on a page
   */
  static async findInputFields(page, url) {
    try {
      const inputFields = await page.evaluate((pageUrl) => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        return inputs.map(input => ({
          url: pageUrl,
          name: input.name || input.id || 'unnamed',
          type: input.type || input.tagName.toLowerCase(),
          placeholder: input.placeholder || '',
          required: input.required || false,
          selector: input.name ? `input[name="${input.name}"]` : 
                   input.id ? `input[id="${input.id}"]` : 
                   `input[placeholder="${input.placeholder}"]`
        }));
      }, url);

      return inputFields.filter(field => field.name !== 'unnamed');
    } catch (error) {
      console.error(`Error finding input fields for ${url}:`, error.message);
      return [];
    }
  }

  /**
   * Extract links from a page
   */
  static async extractLinks(page, baseUrl) {
    try {
      const links = await page.evaluate((base) => {
        const baseUrl = new URL(base);
        const links = Array.from(document.querySelectorAll('a[href]'));
        
        return links
          .map(link => {
            try {
              const href = link.href;
              const url = new URL(href);
              
              // Only include links from the same domain
              if (url.hostname === baseUrl.hostname) {
                return url.href;
              }
            } catch (error) {
              // Skip invalid URLs
            }
            return null;
          })
          .filter(link => link !== null);
      }, baseUrl);

      // Remove duplicates
      return [...new Set(links)];
    } catch (error) {
      console.error(`Error extracting links:`, error.message);
      return [];
    }
  }

  /**
   * Deduplicate input fields
   */
  static deduplicateInputFields(inputFields) {
    const seen = new Set();
    return inputFields.filter(field => {
      const key = `${field.url}-${field.name}-${field.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Test a specific URL with secrets
   */
  static async testUrlWithSecrets(url, secrets, timeout = 30000) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.setDefaultTimeout(timeout);
      
      // Apply secrets before navigation
      await this.applySecrets(page, secrets);
      
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      
      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status() || 'Unknown'}`);
      }

      const pageInfo = await this.extractPageInfo(page, url);
      const inputFields = await this.findInputFields(page, url);

      return {
        success: true,
        pageInfo,
        inputFields,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      await browser.close();
    }
  }
}

export { CrawlerService };
