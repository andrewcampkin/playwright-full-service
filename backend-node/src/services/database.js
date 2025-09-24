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

// Database service functions
export class DatabaseService {
  // User operations
  static async createUser(userData) {
    return await prisma.user.create({
      data: userData,
    });
  }

  static async findUserByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async findUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            websites: {
              include: {
                testSuites: {
                  include: {
                    testCases: {
                      include: {
                        testExecutions: {
                          orderBy: { createdAt: 'desc' },
                          take: 5, // Latest 5 executions
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Project operations
  static async createProject(projectData) {
    return await prisma.project.create({
      data: projectData,
      include: {
        websites: true,
      },
    });
  }

  static async getUserProjects(userId) {
    return await prisma.project.findMany({
      where: { 
        userId,
        isActive: true,
      },
      include: {
        websites: {
          include: {
            testSuites: {
              include: {
                testCases: {
                  include: {
                    testExecutions: {
                      orderBy: { createdAt: 'desc' },
                      take: 1, // Latest execution
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getProjectById(projectId, userId) {
    return await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId,
        isActive: true,
      },
      include: {
        websites: {
          include: {
            testSuites: {
              include: {
                testCases: {
                  include: {
                    testExecutions: {
                      orderBy: { createdAt: 'desc' },
                      take: 5,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Website operations
  static async createWebsite(websiteData) {
    return await prisma.website.create({
      data: websiteData,
      include: {
        project: true,
        testSuites: true,
      },
    });
  }

  static async getWebsiteById(websiteId, userId) {
    return await prisma.website.findFirst({
      where: { 
        id: websiteId,
        project: {
          userId,
        },
        isActive: true,
      },
      include: {
        project: true,
        testSuites: {
          include: {
            testCases: {
              include: {
                testExecutions: {
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                },
              },
            },
          },
        },
      },
    });
  }

  // Test Suite operations
  static async createTestSuite(testSuiteData) {
    return await prisma.testSuite.create({
      data: testSuiteData,
      include: {
        website: {
          include: {
            project: true,
          },
        },
        testCases: true,
      },
    });
  }

  static async getTestSuiteById(testSuiteId, userId) {
    return await prisma.testSuite.findFirst({
      where: { 
        id: testSuiteId,
        website: {
          project: {
            userId,
          },
        },
        isActive: true,
      },
      include: {
        website: {
          include: {
            project: true,
          },
        },
        testCases: {
          include: {
            testExecutions: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });
  }

  // Test Case operations
  static async createTestCase(testCaseData) {
    return await prisma.testCase.create({
      data: testCaseData,
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
    });
  }

  static async getTestCaseById(testCaseId, userId) {
    return await prisma.testCase.findFirst({
      where: { 
        id: testCaseId,
        testSuite: {
          website: {
            project: {
              userId,
            },
          },
        },
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
        testExecutions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Test Execution operations
  static async createTestExecution(testExecutionData) {
    return await prisma.testExecution.create({
      data: testExecutionData,
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
      },
    });
  }

  // Exploration Result operations
  static async createExplorationResult(explorationData) {
    return await prisma.explorationResult.create({
      data: explorationData,
    });
  }

  static async getExplorationResults(websiteId) {
    return await prisma.explorationResult.findMany({
      where: { 
        websiteId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Execution analytics operations
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

  // Utility operations
  static async checkUserAccess(userId, resourceType, resourceId) {
    switch (resourceType) {
      case 'project':
        const project = await prisma.project.findFirst({
          where: { id: resourceId, userId, isActive: true },
        });
        return !!project;

      case 'website':
        const website = await prisma.website.findFirst({
          where: { 
            id: resourceId,
            project: { userId, isActive: true },
            isActive: true,
          },
        });
        return !!website;

      case 'testSuite':
        const testSuite = await prisma.testSuite.findFirst({
          where: { 
            id: resourceId,
            website: {
              project: { userId, isActive: true },
            },
            isActive: true,
          },
        });
        return !!testSuite;

      case 'testCase':
        const testCase = await prisma.testCase.findFirst({
          where: { 
            id: resourceId,
            testSuite: {
              website: {
                project: { userId, isActive: true },
              },
            },
            isActive: true,
          },
        });
        return !!testCase;

      default:
        return false;
    }
  }
}
