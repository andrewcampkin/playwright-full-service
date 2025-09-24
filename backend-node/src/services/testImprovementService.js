import OpenAI from 'openai';

// Initialize OpenAI client
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

export class TestImprovementService {

  /**
   * Analyze test execution results and provide improvement suggestions
   */
  static async analyzeTestExecution(testCaseId, executionHistory = []) {
    console.log(`🧠 Analyzing test execution for test case: ${testCaseId}`);
    
    try {
      // Get test case details and execution history
      const testCase = await DatabaseService.getTestCaseById(testCaseId);
      const executions = executionHistory.length > 0 ? executionHistory : 
        await DatabaseService.getExecutionStats(testCaseId, 10);
      
      if (!testCase) {
        throw new Error('Test case not found');
      }

      // Analyze execution patterns
      const analysis = this.analyzeExecutionPatterns(executions);
      
      // Generate AI suggestions
      const suggestions = await this.generateImprovementSuggestions(testCase, executions, analysis);
      
      console.log(`✅ Generated ${suggestions.length} improvement suggestions`);
      
      return {
        testCaseId,
        testName: testCase.name,
        analysis,
        suggestions,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error analyzing test execution:', error);
      throw error;
    }
  }

  /**
   * Analyze patterns in test execution results
   */
  static analyzeExecutionPatterns(executions) {
    const totalExecutions = executions.length;
    const passedExecutions = executions.filter(e => e.status === 'Passed').length;
    const failedExecutions = executions.filter(e => e.status === 'Failed').length;
    const errorExecutions = executions.filter(e => e.status === 'Error').length;
    
    const passRate = totalExecutions > 0 ? (passedExecutions / totalExecutions) * 100 : 0;
    const failureRate = totalExecutions > 0 ? ((failedExecutions + errorExecutions) / totalExecutions) * 100 : 0;
    
    // Calculate average execution time
    const executionsWithTime = executions.filter(e => e.startTime && e.endTime);
    const avgExecutionTime = executionsWithTime.length > 0 
      ? executionsWithTime.reduce((sum, e) => {
          const duration = new Date(e.endTime) - new Date(e.startTime);
          return sum + duration;
        }, 0) / executionsWithTime.length
      : 0;

    // Analyze failure patterns
    const failurePatterns = this.analyzeFailurePatterns(executions);
    
    // Detect flaky tests (inconsistent results)
    const isFlaky = this.detectFlakyTests(executions);
    
    return {
      totalExecutions,
      passedExecutions,
      failedExecutions,
      errorExecutions,
      passRate: Math.round(passRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      avgExecutionTimeMs: Math.round(avgExecutionTime),
      failurePatterns,
      isFlaky,
      stabilityScore: this.calculateStabilityScore(executions),
      lastExecution: executions[0]?.createdAt
    };
  }

  /**
   * Analyze failure patterns in executions
   */
  static analyzeFailurePatterns(executions) {
    const failures = executions.filter(e => e.status === 'Failed' || e.status === 'Error');
    
    if (failures.length === 0) return { commonErrors: [], errorFrequency: {} };
    
    const errorMessages = failures.map(f => f.errorMessage).filter(Boolean);
    const errorFrequency = {};
    
    errorMessages.forEach(error => {
      // Extract key error patterns
      const keyError = this.extractKeyError(error);
      errorFrequency[keyError] = (errorFrequency[keyError] || 0) + 1;
    });
    
    const commonErrors = Object.entries(errorFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count, percentage: Math.round((count / failures.length) * 100) }));
    
    return { commonErrors, errorFrequency };
  }

  /**
   * Detect flaky tests (inconsistent pass/fail results)
   */
  static detectFlakyTests(executions) {
    if (executions.length < 3) return false;
    
    const recentExecutions = executions.slice(0, 5);
    const statuses = recentExecutions.map(e => e.status);
    
    // Check for alternating patterns or mixed results
    const hasPassed = statuses.includes('Passed');
    const hasFailed = statuses.includes('Failed') || statuses.includes('Error');
    
    return hasPassed && hasFailed;
  }

  /**
   * Calculate stability score (0-100)
   */
  static calculateStabilityScore(executions) {
    if (executions.length === 0) return 100;
    
    const recentExecutions = executions.slice(0, 10);
    const passedCount = recentExecutions.filter(e => e.status === 'Passed').length;
    
    return Math.round((passedCount / recentExecutions.length) * 100);
  }

  /**
   * Extract key error from error message
   */
  static extractKeyError(errorMessage) {
    // Common error patterns
    const patterns = [
      /timeout/i,
      /element not found/i,
      /selector/i,
      /network/i,
      /javascript/i,
      /assertion/i,
      /navigation/i
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(errorMessage)) {
        return pattern.source.replace(/[^a-zA-Z]/g, ' ').trim();
      }
    }
    
    // Return first 50 characters of error
    return errorMessage.substring(0, 50) + '...';
  }

  /**
   * Generate AI-powered improvement suggestions
   */
  static async generateImprovementSuggestions(testCase, executions, analysis) {
    const testSteps = JSON.parse(testCase.steps);
    const recentExecutions = executions.slice(0, 5);
    
    // Prepare context for AI
    const context = {
      testCase: {
        name: testCase.name,
        description: testCase.description,
        steps: testSteps,
        stepsCount: testSteps.length
      },
      executionHistory: {
        totalRuns: analysis.totalExecutions,
        passRate: analysis.passRate,
        failureRate: analysis.failureRate,
        avgExecutionTime: analysis.avgExecutionTimeMs,
        isFlaky: analysis.isFlaky,
        stabilityScore: analysis.stabilityScore,
        commonErrors: analysis.failurePatterns.commonErrors
      },
      recentResults: recentExecutions.map(e => ({
        status: e.status,
        errorMessage: e.errorMessage,
        executionTime: e.startTime && e.endTime ? 
          new Date(e.endTime) - new Date(e.startTime) : null,
        timestamp: e.createdAt
      }))
    };

    const prompt = `You are an expert test automation engineer. Analyze the following test case and its execution history to provide actionable improvement suggestions.

TEST CASE:
Name: ${context.testCase.name}
Description: ${context.testCase.description}
Steps: ${JSON.stringify(context.testCase.steps, null, 2)}

EXECUTION HISTORY:
- Total runs: ${context.executionHistory.totalRuns}
- Pass rate: ${context.executionHistory.passRate}%
- Failure rate: ${context.executionHistory.failureRate}%
- Average execution time: ${context.executionHistory.avgExecutionTime}ms
- Stability score: ${context.executionHistory.stabilityScore}/100
- Is flaky: ${context.executionHistory.isFlaky}
- Common errors: ${JSON.stringify(context.executionHistory.commonErrors)}

RECENT EXECUTION RESULTS:
${JSON.stringify(context.recentResults, null, 2)}

Please provide 3-5 specific, actionable improvement suggestions. For each suggestion:
1. Identify the specific issue or opportunity
2. Explain why it's important
3. Provide concrete steps to implement the improvement
4. Include specific code examples or test step modifications when relevant

Focus on:
- Reliability improvements (fixing flaky tests, handling timeouts)
- Performance optimizations (faster execution, better waits)
- Better error handling and debugging
- Test coverage and edge cases
- Maintainability improvements

Format your response as a JSON array of suggestion objects with: title, description, priority (high/medium/low), category, and implementationSteps.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert test automation engineer specializing in Playwright and web testing. Provide practical, actionable improvement suggestions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      
      // Try to parse JSON response
      try {
        const suggestions = JSON.parse(content);
        return Array.isArray(suggestions) ? suggestions : [suggestions];
      } catch (parseError) {
        // If not valid JSON, create structured suggestions
        return this.createFallbackSuggestions(context, content);
      }

    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return this.createFallbackSuggestions(context, null);
    }
  }

  /**
   * Create fallback suggestions when AI response is not parseable
   */
  static createFallbackSuggestions(context, aiResponse) {
    const suggestions = [];

    // Stability suggestions
    if (context.executionHistory.isFlaky || context.executionHistory.stabilityScore < 80) {
      suggestions.push({
        title: "Improve Test Stability",
        description: "This test shows inconsistent results across runs",
        priority: "high",
        category: "reliability",
        implementationSteps: [
          "Add explicit waits for dynamic content",
          "Use more specific selectors",
          "Add retry logic for flaky operations",
          "Consider using data-testid attributes"
        ]
      });
    }

    // Performance suggestions
    if (context.executionHistory.avgExecutionTime > 10000) {
      suggestions.push({
        title: "Optimize Test Performance",
        description: "Test execution time is longer than recommended",
        priority: "medium",
        category: "performance",
        implementationSteps: [
          "Replace waitForLoadState with more specific waits",
          "Use page.waitForSelector instead of sleep",
          "Consider parallel execution for independent tests",
          "Optimize selectors for faster element location"
        ]
      });
    }

    // Error handling suggestions
    if (context.executionHistory.failureRate > 20) {
      suggestions.push({
        title: "Improve Error Handling",
        description: "Test has a high failure rate that needs attention",
        priority: "high",
        category: "reliability",
        implementationSteps: [
          "Add proper error handling for network issues",
          "Implement retry mechanisms for transient failures",
          "Add better error messages and debugging info",
          "Consider adding pre-test conditions validation"
        ]
      });
    }

    // Coverage suggestions
    suggestions.push({
      title: "Enhance Test Coverage",
      description: "Consider adding more comprehensive test scenarios",
      priority: "low",
      category: "coverage",
      implementationSteps: [
        "Add negative test cases",
        "Test edge cases and error scenarios",
        "Add accessibility testing",
        "Consider adding visual regression tests"
      ]
    });

    return suggestions;
  }

  /**
   * Analyze test suite for overall improvements
   */
  static async analyzeTestSuite(testSuiteId) {
    console.log(`🧠 Analyzing test suite: ${testSuiteId}`);
    
    try {
      const testSuite = await DatabaseService.getTestSuiteById(testSuiteId);
      if (!testSuite) {
        throw new Error('Test suite not found');
      }

      const suiteAnalysis = {
        testSuiteId,
        testSuiteName: testSuite.name,
        totalTests: testSuite.testCases.length,
        testAnalyses: [],
        suiteMetrics: {
          totalExecutions: 0,
          overallPassRate: 0,
          avgExecutionTime: 0,
          flakyTests: 0,
          highFailureTests: 0
        }
      };

      let totalPassed = 0;
      let totalExecutions = 0;
      let totalExecutionTime = 0;

      // Analyze each test case
      for (const testCase of testSuite.testCases) {
        const executions = await DatabaseService.getExecutionStats(testCase.id, 10);
        const analysis = this.analyzeExecutionPatterns(executions);
        
        suiteAnalysis.testAnalyses.push({
          testCaseId: testCase.id,
          testName: testCase.name,
          ...analysis
        });

        totalExecutions += analysis.totalExecutions;
        totalPassed += analysis.passedExecutions;
        totalExecutionTime += analysis.avgExecutionTimeMs * analysis.totalExecutions;
        
        if (analysis.isFlaky) suiteAnalysis.suiteMetrics.flakyTests++;
        if (analysis.failureRate > 30) suiteAnalysis.suiteMetrics.highFailureTests++;
      }

      // Calculate suite-level metrics
      suiteAnalysis.suiteMetrics.totalExecutions = totalExecutions;
      suiteAnalysis.suiteMetrics.overallPassRate = totalExecutions > 0 ? 
        Math.round((totalPassed / totalExecutions) * 10000) / 100 : 100;
      suiteAnalysis.suiteMetrics.avgExecutionTime = totalExecutions > 0 ? 
        Math.round(totalExecutionTime / totalExecutions) : 0;

      console.log(`✅ Test suite analysis completed`);
      return suiteAnalysis;

    } catch (error) {
      console.error('Error analyzing test suite:', error);
      throw error;
    }
  }
}
