// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { TestExecutionService } from './services/testExecutionService.js';
import { QueueService } from './services/queueService.js';
import { WebSocketService } from './services/websocketService.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.API_URL || 'http://localhost:3001',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'test-runner',
    timestamp: new Date().toISOString(),
    queue: QueueService.getStatus()
  });
});

// Test execution endpoints
app.post('/api/execute-test', async (req, res) => {
  try {
    const { testCaseId, userId, priority = 'normal' } = req.body;
    
    if (!testCaseId) {
      return res.status(400).json({
        success: false,
        error: 'testCaseId is required'
      });
    }

    console.log(`🚀 Queuing test execution for test case: ${testCaseId}`);
    
    // Queue the test execution
    const job = await QueueService.queueTestExecution({
      testCaseId,
      userId,
      priority,
      requestedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Test execution queued successfully',
      jobId: job.id,
      testCaseId,
      status: 'queued'
    });

  } catch (error) {
    console.error('Error queuing test execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/execute-test-suite', async (req, res) => {
  try {
    const { testSuiteId, userId, priority = 'normal', parallel = false } = req.body;
    
    if (!testSuiteId) {
      return res.status(400).json({
        success: false,
        error: 'testSuiteId is required'
      });
    }

    console.log(`🚀 Queuing test suite execution: ${testSuiteId}`);
    
    // Queue the test suite execution
    const jobs = await QueueService.queueTestSuiteExecution({
      testSuiteId,
      userId,
      priority,
      parallel,
      requestedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Test suite execution queued successfully',
      jobIds: jobs.map(job => job.id),
      testSuiteId,
      testCaseCount: jobs.length,
      status: 'queued'
    });

  } catch (error) {
    console.error('Error queuing test suite execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get execution status
app.get('/api/execution/:executionId/status', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const execution = await TestExecutionService.getExecutionStatus(executionId);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      execution
    });

  } catch (error) {
    console.error('Error getting execution status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get queue status
app.get('/api/queue/status', (req, res) => {
  try {
    const status = QueueService.getStatus();
    
    res.json({
      success: true,
      queue: status
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred in the test runner'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist in the test runner'
  });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`🧪 Test Runner Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/execute-test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize services
  try {
    await QueueService.initialize();
    await WebSocketService.initialize();
    console.log(`✅ Test Runner services initialized successfully`);
  } catch (error) {
    console.error('❌ Failed to initialize test runner services:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await QueueService.shutdown();
  await WebSocketService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await QueueService.shutdown();
  await WebSocketService.shutdown();
  process.exit(0);
});
