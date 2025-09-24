import { chromium } from 'playwright';
import { DatabaseService } from './database.js';

export class TestExecutionService {
  
  /**
   * Start a test execution and update status to Running
   */
  static async startExecution(testCaseId, userId) {
    console.log(`🚀 Starting execution for test case: ${testCaseId}`);
    
    // Create test execution record
    const execution = await DatabaseService.createTestExecution({
      testCaseId,
      userId,
      status: 'Running',
      startTime: new Date(),
    });

    console.log(`📝 Created execution record: ${execution.id}`);
    return execution;
  }

  /**
   * Execute a test case using Playwright
   */
  static async executeTestCase(execution) {
    const { testCase } = execution;
    const steps = JSON.parse(testCase.steps);
    
    console.log(`🧪 Executing test case: ${testCase.name}`);
    console.log(`📋 Test steps: ${steps.length}`);
    
    let browser = null;
    let page = null;
    const executionLog = [];
    const results = [];

    try {
      // Launch browser
      browser = await chromium.launch({ 
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });
      
      page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Execute each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepResult = await this.executeStep(page, step, i + 1);
        
        executionLog.push({
          step: i + 1,
          action: step.action,
          target: step.target,
          value: step.value,
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        results.push(stepResult);

        // If step failed, stop execution
        if (!stepResult.success) {
          console.log(`❌ Step ${i + 1} failed: ${stepResult.error}`);
          break;
        }
      }

      // Determine overall test result
      const allStepsPassed = results.every(r => r.success);
      const finalStatus = allStepsPassed ? 'Passed' : 'Failed';

      console.log(`✅ Test execution completed: ${finalStatus}`);

      return {
        status: finalStatus,
        executionLog: JSON.stringify(executionLog),
        results: JSON.stringify(results),
        endTime: new Date(),
        errorMessage: allStepsPassed ? null : results.find(r => !r.success)?.error
      };

    } catch (error) {
      console.error(`❌ Test execution error:`, error);
      
      return {
        status: 'Error',
        executionLog: JSON.stringify(executionLog),
        results: JSON.stringify(results),
        endTime: new Date(),
        errorMessage: error.message
      };
      
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  /**
   * Execute a single test step
   */
  static async executeStep(page, step, stepNumber) {
    const { action, target, value } = step;
    
    console.log(`🔧 Executing step ${stepNumber}: ${action} on ${target}`);
    
    try {
      switch (action) {
        case 'navigate':
          await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
          return { success: true, message: `Navigated to ${target}` };

        case 'click':
          await page.click(target, { timeout: 10000 });
          return { success: true, message: `Clicked on ${target}` };

        case 'fill':
          await page.fill(target, value, { timeout: 10000 });
          return { success: true, message: `Filled ${target} with "${value}"` };

        case 'select':
          await page.selectOption(target, value, { timeout: 10000 });
          return { success: true, message: `Selected "${value}" in ${target}` };

        case 'waitForLoadState':
          await page.waitForLoadState(target, { timeout: 30000 });
          return { success: true, message: `Waited for load state: ${target}` };

        case 'waitForSelector':
          await page.waitForSelector(target, { timeout: 10000 });
          return { success: true, message: `Waited for selector: ${target}` };

        case 'getText':
          const text = await page.textContent(target, { timeout: 10000 });
          return { success: true, message: `Got text: "${text}"`, data: { text } };

        case 'getAttribute':
          const attr = await page.getAttribute(target, value, { timeout: 10000 });
          return { success: true, message: `Got attribute ${value}: "${attr}"`, data: { attribute: attr } };

        case 'assert':
          return await this.handleAssertion(page, target, value);

        case 'screenshot':
          const screenshot = await page.screenshot({ 
            path: `/tmp/screenshot-${Date.now()}.png`,
            fullPage: value === 'full'
          });
          return { success: true, message: 'Screenshot taken', data: { screenshot: 'captured' } };

        case 'hover':
          await page.hover(target, { timeout: 10000 });
          return { success: true, message: `Hovered over ${target}` };

        case 'doubleClick':
          await page.dblclick(target, { timeout: 10000 });
          return { success: true, message: `Double-clicked on ${target}` };

        case 'rightClick':
          await page.click(target, { button: 'right', timeout: 10000 });
          return { success: true, message: `Right-clicked on ${target}` };

        case 'pressKey':
          await page.keyboard.press(target, { timeout: 10000 });
          return { success: true, message: `Pressed key: ${target}` };

        case 'wait':
          await page.waitForTimeout(parseInt(target) || 1000);
          return { success: true, message: `Waited for ${target}ms` };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      console.error(`❌ Step ${stepNumber} failed:`, error.message);
      return { 
        success: false, 
        error: error.message,
        action,
        target,
        value
      };
    }
  }

  /**
   * Handle assertion steps
   */
  static async handleAssertion(page, target, expectedValue) {
    try {
      switch (target) {
        case 'title':
          const title = await page.title();
          const titleMatch = title === expectedValue;
          return {
            success: titleMatch,
            message: titleMatch ? `Title matches: "${title}"` : `Title mismatch. Expected: "${expectedValue}", Got: "${title}"`,
            data: { actual: title, expected: expectedValue }
          };

        case 'url':
          const url = page.url();
          const urlMatch = url === expectedValue;
          return {
            success: urlMatch,
            message: urlMatch ? `URL matches: "${url}"` : `URL mismatch. Expected: "${expectedValue}", Got: "${url}"`,
            data: { actual: url, expected: expectedValue }
          };

        case 'text':
          const text = await page.textContent('body');
          const textMatch = text.includes(expectedValue);
          return {
            success: textMatch,
            message: textMatch ? `Text found: "${expectedValue}"` : `Text not found. Looking for: "${expectedValue}"`,
            data: { actual: text, expected: expectedValue }
          };

        case 'visible':
          const isVisible = await page.isVisible(expectedValue);
          return {
            success: isVisible,
            message: isVisible ? `Element is visible: ${expectedValue}` : `Element is not visible: ${expectedValue}`,
            data: { visible: isVisible }
          };

        case 'hidden':
          const isHidden = await page.isHidden(expectedValue);
          return {
            success: isHidden,
            message: isHidden ? `Element is hidden: ${expectedValue}` : `Element is not hidden: ${expectedValue}`,
            data: { hidden: isHidden }
          };

        default:
          // Custom selector assertion
          const elementText = await page.textContent(target);
          const elementMatch = elementText && elementText.includes(expectedValue);
          return {
            success: elementMatch,
            message: elementMatch ? `Element text matches: "${elementText}"` : `Element text mismatch. Expected: "${expectedValue}", Got: "${elementText}"`,
            data: { actual: elementText, expected: expectedValue }
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Assertion failed: ${error.message}`,
        target,
        expectedValue
      };
    }
  }

  /**
   * Complete a test execution with results
   */
  static async completeExecution(executionId, result) {
    return await DatabaseService.updateTestExecution(executionId, {
      status: result.status,
      endTime: result.endTime,
      errorMessage: result.errorMessage,
      executionLog: result.executionLog,
      results: result.results,
    });
  }

  /**
   * Fail a test execution
   */
  static async failExecution(testCaseId, errorMessage) {
    // Find the latest execution for this test case
    const execution = await DatabaseService.getLatestExecutionForTestCase(testCaseId);
    
    if (execution) {
      await DatabaseService.updateTestExecution(execution.id, {
        status: 'Failed',
        endTime: new Date(),
        errorMessage,
      });
    }
  }

  /**
   * Get execution status
   */
  static async getExecutionStatus(executionId) {
    return await DatabaseService.getExecutionById(executionId);
  }

  /**
   * Get test cases for a test suite
   */
  static async getTestSuiteTestCases(testSuiteId) {
    return await DatabaseService.getTestSuiteTestCases(testSuiteId);
  }
}
