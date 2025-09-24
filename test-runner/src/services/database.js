import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

// Database service functions for test runner
export class DatabaseService {
  
  // Test Execution operations
  static async createTestExecution(executionData) {
    return await prisma.testExecution.create({
      data: executionData,
      include: {
        testCase: {
          include: {
            testSuite: {
              include: {
                website: {
                  include: {
                    project: true,
                  },
                },
              },
            },
          },
        },
        user: true,
      },
    });
  }

  static async updateTestExecution(executionId, updateData) {
    return await prisma.testExecution.update({
      where: { id: executionId },
      data: updateData,
      include: {
        testCase: {
          include: {
            testSuite: {
              include: {
                website: {
                  include: {
                    project: true,
                  },
                },
              },
            },
          },
        },
        user: true,
      },
    });
  }

  static async getExecutionById(executionId) {
    return await prisma.testExecution.findUnique({
      where: { id: executionId },
      include: {
        testCase: {
          include: {
            testSuite: {
              include: {
                website: {
                  include: {
                    project: true,
                  },
                },
              },
            },
          },
        },
        user: true,
      },
    });
  }

  static async getLatestExecutionForTestCase(testCaseId) {
    return await prisma.testExecution.findFirst({
      where: { 
        testCaseId,
        status: 'Running'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        testCase: true,
        user: true,
      },
    });
  }

  // Test Suite operations
  static async getTestSuiteTestCases(testSuiteId) {
    return await prisma.testCase.findMany({
      where: { 
        testSuiteId,
        isActive: true,
      },
      include: {
        testSuite: {
          include: {
            website: {
              include: {
                project: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getTestSuiteById(testSuiteId) {
    return await prisma.testSuite.findUnique({
      where: { id: testSuiteId },
      include: {
        website: {
          include: {
            project: true,
          },
        },
        testCases: {
          where: { isActive: true },
          include: {
            testExecutions: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Latest execution
            },
          },
        },
      },
    });
  }

  // Test Case operations
  static async getTestCaseById(testCaseId) {
    return await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        testSuite: {
          include: {
            website: {
              include: {
                project: true,
              },
            },
          },
        },
        testExecutions: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Latest 5 executions
        },
      },
    });
  }

  // User operations
  static async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  // Analytics and reporting
  static async getExecutionStats(testCaseId, limit = 10) {
    return await prisma.testExecution.findMany({
      where: { testCaseId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        errorMessage: true,
        createdAt: true,
      },
    });
  }

  static async getTestSuiteExecutionStats(testSuiteId, limit = 50) {
    return await prisma.testExecution.findMany({
      where: {
        testCase: {
          testSuiteId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        testCase: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async getExecutionHistory(userId, limit = 100) {
    return await prisma.testExecution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        testCase: {
          include: {
            testSuite: {
              include: {
                website: {
                  select: {
                    id: true,
                    name: true,
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Cleanup operations
  static async cleanupOldExecutions(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.testExecution.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: ['Passed', 'Failed', 'Error'],
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old test executions`);
    return result.count;
  }
}
