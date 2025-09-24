import Queue from 'bull';
import Redis from 'ioredis';
import { TestExecutionService } from './testExecutionService.js';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// Create Bull queue
const testExecutionQueue = new Queue('test execution', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs
    attempts: 3,          // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export class QueueService {
  static queue = testExecutionQueue;
  static redis = redis;

  static async initialize() {
    console.log('🔧 Initializing queue service...');
    
    // Process jobs
    this.queue.process('single-test', 5, this.processSingleTest.bind(this));
    this.queue.process('test-suite', 3, this.processTestSuite.bind(this));
    
    // Event handlers
    this.queue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed:`, result);
    });
    
    this.queue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });
    
    this.queue.on('stalled', (job) => {
      console.warn(`⚠️ Job ${job.id} stalled`);
    });

    console.log('✅ Queue service initialized');
  }

  static async queueTestExecution(data) {
    const job = await this.queue.add('single-test', data, {
      priority: this.getPriority(data.priority),
      delay: 0,
    });
    
    console.log(`📝 Queued single test execution: ${data.testCaseId} (Job ID: ${job.id})`);
    return job;
  }

  static async queueTestSuiteExecution(data) {
    const jobs = [];
    
    // Get test cases from the test suite
    const testCases = await TestExecutionService.getTestSuiteTestCases(data.testSuiteId);
    
    if (testCases.length === 0) {
      throw new Error('No test cases found in the test suite');
    }

    for (const testCase of testCases) {
      const job = await this.queue.add(
        data.parallel ? 'single-test' : 'test-suite',
        {
          ...data,
          testCaseId: testCase.id,
          testSuiteId: data.testSuiteId,
        },
        {
          priority: this.getPriority(data.priority),
          delay: data.parallel ? 0 : jobs.length * 1000, // Stagger non-parallel executions
        }
      );
      
      jobs.push(job);
    }
    
    console.log(`📝 Queued test suite execution: ${data.testSuiteId} (${jobs.length} jobs)`);
    return jobs;
  }

  static async processSingleTest(job) {
    const { testCaseId, userId } = job.data;
    
    console.log(`🧪 Processing single test: ${testCaseId}`);
    
    try {
      // Update execution status to Running
      const execution = await TestExecutionService.startExecution(testCaseId, userId);
      
      // Execute the test
      const result = await TestExecutionService.executeTestCase(execution);
      
      // Update execution with results
      await TestExecutionService.completeExecution(execution.id, result);
      
      console.log(`✅ Test execution completed: ${testCaseId}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Test execution failed: ${testCaseId}`, error);
      
      // Update execution with error
      await TestExecutionService.failExecution(testCaseId, error.message);
      
      throw error;
    }
  }

  static async processTestSuite(job) {
    const { testSuiteId, testCaseId, userId } = job.data;
    
    console.log(`🧪 Processing test suite item: ${testCaseId} (Suite: ${testSuiteId})`);
    
    try {
      // Update execution status to Running
      const execution = await TestExecutionService.startExecution(testCaseId, userId);
      
      // Execute the test
      const result = await TestExecutionService.executeTestCase(execution);
      
      // Update execution with results
      await TestExecutionService.completeExecution(execution.id, result);
      
      console.log(`✅ Test suite item completed: ${testCaseId}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Test suite item failed: ${testCaseId}`, error);
      
      // Update execution with error
      await TestExecutionService.failExecution(testCaseId, error.message);
      
      throw error;
    }
  }

  static getPriority(priority) {
    switch (priority) {
      case 'high': return 1;
      case 'normal': return 5;
      case 'low': return 10;
      default: return 5;
    }
  }

  static getStatus() {
    return {
      waiting: this.queue.getWaiting().length,
      active: this.queue.getActive().length,
      completed: this.queue.getCompleted().length,
      failed: this.queue.getFailed().length,
      delayed: this.queue.getDelayed().length,
    };
  }

  static async shutdown() {
    console.log('🛑 Shutting down queue service...');
    await this.queue.close();
    await this.redis.disconnect();
    console.log('✅ Queue service shutdown complete');
  }
}
