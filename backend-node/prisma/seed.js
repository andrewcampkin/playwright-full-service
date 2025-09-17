import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@playwrightservice.com' },
    update: {},
    create: {
      email: 'demo@playwrightservice.com',
      name: 'Demo User',
      passwordHash: hashedPassword,
      provider: 'local',
    },
  });

  console.log('✅ Demo user created:', demoUser.email);

  // Create a demo project
  const demoProject = await prisma.project.upsert({
    where: { 
      id: 'demo-project-id',
    },
    update: {},
    create: {
      id: 'demo-project-id',
      name: 'Demo Project',
      description: 'A demo project to showcase the Playwright AI Service',
      userId: demoUser.id,
    },
  });

  console.log('✅ Demo project created:', demoProject.name);

  // Create a demo website
  const demoWebsite = await prisma.website.upsert({
    where: {
      id: 'demo-website-id',
    },
    update: {},
    create: {
      id: 'demo-website-id',
      name: 'Example.com',
      url: 'https://example.com',
      description: 'A demo website for testing',
      projectId: demoProject.id,
    },
  });

  console.log('✅ Demo website created:', demoWebsite.name);

  // Create a demo test suite
  const demoTestSuite = await prisma.testSuite.upsert({
    where: {
      id: 'demo-test-suite-id',
    },
    update: {},
    create: {
      id: 'demo-test-suite-id',
      name: 'Demo Test Suite',
      description: 'A demo test suite with sample test cases',
      websiteId: demoWebsite.id,
    },
  });

  console.log('✅ Demo test suite created:', demoTestSuite.name);

  // Create demo test cases
  const demoTestCases = [
    {
      id: 'demo-test-case-1',
      name: 'Homepage Navigation Test',
      description: 'Test basic navigation to the homepage',
      steps: JSON.stringify([
        { action: 'navigate', target: 'https://example.com', value: null },
        { action: 'waitForLoadState', target: 'networkidle', value: null },
        { action: 'assert', target: 'title', value: 'Example Domain' }
      ]),
      testSuiteId: demoTestSuite.id,
    },
    {
      id: 'demo-test-case-2',
      name: 'Page Content Verification',
      description: 'Verify that the page contains expected content',
      steps: JSON.stringify([
        { action: 'navigate', target: 'https://example.com', value: null },
        { action: 'getText', target: 'body', value: null },
        { action: 'assert', target: 'text', value: 'Example Domain' }
      ]),
      testSuiteId: demoTestSuite.id,
    },
  ];

  for (const testCase of demoTestCases) {
    await prisma.testCase.upsert({
      where: { id: testCase.id },
      update: {},
      create: testCase,
    });
  }

  console.log('✅ Demo test cases created:', demoTestCases.length);

  // Create a demo test execution
  const demoExecution = await prisma.testExecution.upsert({
    where: {
      id: 'demo-execution-id',
    },
    update: {},
    create: {
      id: 'demo-execution-id',
      testCaseId: demoTestCases[0].id,
      status: 'Passed',
      startTime: new Date(Date.now() - 60000), // 1 minute ago
      endTime: new Date(Date.now() - 30000), // 30 seconds ago
      executionLog: JSON.stringify([
        { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Test started' },
        { timestamp: new Date(Date.now() - 45000).toISOString(), level: 'info', message: 'Navigated to https://example.com' },
        { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'info', message: 'Test completed successfully' }
      ]),
      results: JSON.stringify({
        duration: 30000,
        steps: 3,
        passed: 3,
        failed: 0
      }),
      userId: demoUser.id,
    },
  });

  console.log('✅ Demo test execution created:', demoExecution.status);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Demo Account:');
  console.log('Email: demo@playwrightservice.com');
  console.log('Password: demo123');
  console.log('\n🔗 Access URLs:');
  console.log('Frontend: http://localhost:3000');
  console.log('Backend API: http://localhost:3001');
  console.log('pgAdmin: http://localhost:8080');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
