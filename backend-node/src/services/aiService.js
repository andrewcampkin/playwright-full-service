import OpenAI from 'openai';
import { chromium } from 'playwright';

// Initialize OpenAI client - will be created when needed
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Main function to crawl a website and generate tests using AI
 * @param {string} url - The URL to crawl
 * @returns {Promise<Object>} Object containing sitemap and generated tests
 */
export async function crawlAndGenerateTests(url) {
  let browser = null;
  let page = null;

  try {
    console.log(`🌐 Starting browser for crawling: ${url}`);
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Define the tools available to the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "navigate_to_url",
          description: "Navigate to a specific URL",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to navigate to"
              }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "take_screenshot",
          description: "Take a screenshot of the current page or a specific element",
          parameters: {
            type: "object",
            properties: {
              selector: {
                type: "string",
                description: "CSS selector for specific element (optional, if not provided takes full page screenshot)"
              },
              fullPage: {
                type: "boolean",
                description: "Whether to take a full page screenshot (default: true)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_page_content",
          description: "Get the HTML content of the current page or a specific element",
          parameters: {
            type: "object",
            properties: {
              selector: {
                type: "string",
                description: "CSS selector for specific element (optional, if not provided gets full page content)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_visible_text",
          description: "Get all visible text content from the page",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_interactive_elements",
          description: "Find all interactive elements (buttons, links, forms, inputs) on the page",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "click_element",
          description: "Click on an element",
          parameters: {
            type: "object",
            properties: {
              selector: {
                type: "string",
                description: "CSS selector for the element to click"
              }
            },
            required: ["selector"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fill_input",
          description: "Fill an input field with text",
          parameters: {
            type: "object",
            properties: {
              selector: {
                type: "string",
                description: "CSS selector for the input field"
              },
              text: {
                type: "string",
                description: "Text to fill in the input field"
              }
            },
            required: ["selector", "text"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_page_links",
          description: "Get all links on the current page to discover the sitemap",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    // System prompt for the AI
    const systemPrompt = `You are an expert web crawler and test automation engineer. Your task is to:

1. EXPLORE the website thoroughly by navigating through different pages
2. DISCOVER the site structure and create a sitemap
3. IDENTIFY interactive elements and user workflows
4. GENERATE comprehensive Playwright test cases

EXPLORATION PROCESS:
- Start by navigating to the given URL
- Take screenshots to understand the page layout
- Get visible text to understand the content
- Find all interactive elements (buttons, links, forms, inputs)
- Discover all internal links to map the site structure
- Test key user workflows and functionality
- Identify potential test scenarios

SITEMAP GENERATION:
- Create a hierarchical sitemap showing all discovered pages
- Include page titles, URLs, and brief descriptions
- Organize by main sections/categories

TEST GENERATION:
Generate comprehensive test cases that cover:
- Basic navigation and page loading
- Form interactions and validation
- User workflows and critical paths
- Error scenarios and edge cases
- Accessibility and usability

For each test case, provide:
- Clear test name and description
- Step-by-step Playwright actions
- Expected results
- Test data if needed

Be thorough in your exploration and generate realistic, actionable test cases.`;

    // Initial user message
    const userMessage = `Please explore the website at ${url} and generate a comprehensive sitemap and test cases. Start by navigating to the URL and then systematically explore the site.`;

    console.log(`🤖 Starting AI conversation for: ${url}`);

    // Collect exploration data instead of storing full conversation
    const explorationData = {
      pages: [],
      screenshots: [],
      interactiveElements: [],
      links: [],
      content: []
    };

    // Use a simpler approach: execute a series of focused exploration steps
    const explorationSteps = [
      { tool: 'navigate_to_url', args: { url: url } },
      { tool: 'take_screenshot', args: { fullPage: true } },
      { tool: 'get_visible_text', args: {} },
      { tool: 'find_interactive_elements', args: {} },
      { tool: 'get_page_links', args: {} }
    ];

    console.log(`🔍 Starting systematic exploration of: ${url}`);

    // Execute each exploration step
    for (let i = 0; i < explorationSteps.length; i++) {
      const step = explorationSteps[i];
      console.log(`🔧 Executing step ${i + 1}: ${step.tool}`);

      try {
        const toolResult = await executeTool(step.tool, step.args, page);
        
        // Store relevant data for final analysis
        if (step.tool === 'navigate_to_url') {
          explorationData.pages.push({
            url: toolResult.url,
            title: toolResult.title
          });
        } else if (step.tool === 'take_screenshot') {
          explorationData.screenshots.push({
            selector: toolResult.selector,
            timestamp: new Date().toISOString()
          });
        } else if (step.tool === 'find_interactive_elements') {
          explorationData.interactiveElements.push(...toolResult.elements.slice(0, 10));
        } else if (step.tool === 'get_page_links') {
          explorationData.links.push(...toolResult.links.slice(0, 20));
        } else if (step.tool === 'get_visible_text') {
          explorationData.content.push({
            text: toolResult.text.substring(0, 2000),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error executing ${step.tool}:`, error.message);
      }
    }

    // Try to navigate to a few key pages if we found links
    if (explorationData.links.length > 0) {
      const keyLinks = explorationData.links
        .filter(link => link.href && link.href.includes(url) && !link.href.includes('#'))
        .slice(0, 3); // Limit to 3 additional pages

      for (const link of keyLinks) {
        try {
          console.log(`🔗 Exploring additional page: ${link.href}`);
          const pageResult = await executeTool('navigate_to_url', { url: link.href }, page);
          explorationData.pages.push({
            url: pageResult.url,
            title: pageResult.title
          });
          
          // Get basic info about this page
          const textResult = await executeTool('get_visible_text', {}, page);
          explorationData.content.push({
            text: textResult.text.substring(0, 1000),
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error exploring ${link.href}:`, error.message);
        }
      }
    }

    // Create a summarized version of the exploration data for AI processing
    const summarizedData = createSummarizedData(explorationData, url);

    // Generate final response based on summarized data
    const finalPrompt = `Based on the website exploration data, generate a comprehensive sitemap and test cases.

WEBSITE: ${url}

EXPLORATION SUMMARY:
${summarizedData}

Please provide a structured JSON response with:
1. "sitemap": Array of discovered pages with url, title, and description
2. "tests": Array of test cases with name, description, and steps

Each test case should have realistic Playwright steps like:
- navigate to URLs
- click on buttons/links
- fill form fields
- verify page content

Format as valid JSON only.`;

    const finalResponse = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a test generation expert. Provide only valid JSON responses." },
        { role: "user", content: finalPrompt }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    const finalContent = finalResponse.choices[0].message.content;
    
    // Try to parse the JSON response
    let result;
    try {
      result = JSON.parse(finalContent);
    } catch (error) {
      // If not valid JSON, create a structured response
      result = {
        sitemap: [{ url: url, title: "Homepage", description: "Main page" }],
        tests: [
          {
            name: "Basic Navigation Test",
            description: "Test basic navigation to the homepage",
            steps: [
              { action: "navigate", target: url, value: null },
              { action: "waitForLoadState", target: "networkidle", value: null }
            ]
          }
        ],
        rawResponse: finalContent
      };
    }

    return {
      sitemap: result.sitemap || [],
      tests: result.tests || [],
      explorationLog: explorationSteps.length + (explorationData.links.length > 0 ? 3 : 0),
      explorationData: {
        pagesDiscovered: explorationData.pages.length,
        interactiveElementsFound: explorationData.interactiveElements.length,
        linksDiscovered: explorationData.links.length,
        contentSamples: explorationData.content.length
      },
      rawResponse: result.rawResponse || finalContent
    };

  } catch (error) {
    console.error('Error in crawlAndGenerateTests:', error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * Create a summarized version of exploration data for AI processing
 */
function createSummarizedData(explorationData, baseUrl) {
  const summary = [];
  
  // Pages discovered
  if (explorationData.pages.length > 0) {
    summary.push("PAGES DISCOVERED:");
    explorationData.pages.forEach((page, index) => {
      summary.push(`${index + 1}. ${page.title} - ${page.url}`);
    });
    summary.push("");
  }
  
  // Interactive elements (summarized)
  if (explorationData.interactiveElements.length > 0) {
    summary.push("INTERACTIVE ELEMENTS:");
    const elementTypes = {};
    explorationData.interactiveElements.forEach(element => {
      elementTypes[element.type] = (elementTypes[element.type] || 0) + 1;
    });
    
    Object.entries(elementTypes).forEach(([type, count]) => {
      summary.push(`- ${count} ${type}(s)`);
    });
    
    // Show a few examples
    const examples = explorationData.interactiveElements.slice(0, 5);
    examples.forEach(element => {
      if (element.text) {
        summary.push(`  Example: "${element.text.substring(0, 50)}" (${element.selector})`);
      }
    });
    summary.push("");
  }
  
  // Links discovered (summarized)
  if (explorationData.links.length > 0) {
    summary.push("LINKS DISCOVERED:");
    const internalLinks = explorationData.links.filter(link => 
      link.href && link.href.includes(baseUrl) && !link.href.includes('#')
    );
    const externalLinks = explorationData.links.filter(link => 
      link.href && !link.href.includes(baseUrl)
    );
    
    summary.push(`- ${internalLinks.length} internal links`);
    summary.push(`- ${externalLinks.length} external links`);
    
    // Show a few key internal links
    const keyLinks = internalLinks.slice(0, 5);
    keyLinks.forEach(link => {
      summary.push(`  - "${link.text.substring(0, 30)}" → ${link.href}`);
    });
    summary.push("");
  }
  
  // Content samples (summarized)
  if (explorationData.content.length > 0) {
    summary.push("CONTENT SAMPLES:");
    explorationData.content.forEach((content, index) => {
      const words = content.text.split(' ').slice(0, 20).join(' ');
      summary.push(`${index + 1}. "${words}..."`);
    });
    summary.push("");
  }
  
  return summary.join('\n');
}

/**
 * Execute a tool call from the AI
 */
async function executeTool(toolName, args, page) {
  switch (toolName) {
    case 'navigate_to_url':
      await page.goto(args.url, { waitUntil: 'networkidle' });
      return { 
        success: true, 
        url: page.url(), 
        title: await page.title() 
      };

    case 'take_screenshot':
      const screenshot = await page.screenshot({ 
        fullPage: args.fullPage !== false,
        type: 'png'
      });
      return { 
        success: true, 
        screenshot: 'captured', // Don't return full base64 data
        selector: args.selector || 'full_page',
        size: screenshot.length
      };

    case 'get_page_content':
      const content = args.selector 
        ? await page.locator(args.selector).innerHTML()
        : await page.content();
      return { 
        success: true, 
        content: 'retrieved', // Don't return full HTML content
        selector: args.selector || 'full_page',
        length: content.length
      };

    case 'get_visible_text':
      const text = await page.textContent('body');
      return { 
        success: true, 
        text: text.substring(0, 5000) // Limit text size
      };

    case 'find_interactive_elements':
      const elements = await page.evaluate(() => {
        const interactive = [];
        
        // Find buttons
        document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(el => {
          interactive.push({
            type: 'button',
            text: el.textContent?.trim() || el.value || '',
            selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')
          });
        });
        
        // Find links
        document.querySelectorAll('a[href]').forEach(el => {
          interactive.push({
            type: 'link',
            text: el.textContent?.trim() || '',
            href: el.href,
            selector: 'a' + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')
          });
        });
        
        // Find form inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
          interactive.push({
            type: 'input',
            inputType: el.type || el.tagName.toLowerCase(),
            placeholder: el.placeholder || '',
            selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')
          });
        });
        
        return interactive;
      });
      
      return { 
        success: true, 
        elements: elements.slice(0, 50) // Limit number of elements
      };

    case 'click_element':
      await page.click(args.selector);
      return { 
        success: true, 
        clicked: args.selector,
        currentUrl: page.url()
      };

    case 'fill_input':
      await page.fill(args.selector, args.text);
      return { 
        success: true, 
        filled: args.selector,
        text: args.text
      };

    case 'get_page_links':
      const links = await page.evaluate(() => {
        const linkElements = Array.from(document.querySelectorAll('a[href]'));
        return linkElements.map(link => ({
          text: link.textContent?.trim() || '',
          href: link.href,
          title: link.title || ''
        })).filter(link => link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:'));
      });
      
      return { 
        success: true, 
        links: links.slice(0, 100) // Limit number of links
      };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
