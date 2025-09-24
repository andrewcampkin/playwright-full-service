import express from 'express';
import authRoutes from './auth.js';
import projectsRoutes from './projects.js';
import websitesRoutes from './websites.js';
import testSuitesRoutes from './testSuites.js';
import testCasesRoutes from './testCases.js';
import executionsRoutes from './executions.js';
import analysisRoutes from './analysis.js';
import sitemapsRoutes from './sitemaps.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registration
router.use('/auth', authRoutes);
router.use('/protected/projects', projectsRoutes);
router.use('/protected/websites', websitesRoutes);
router.use('/protected/test-suites', testSuitesRoutes);
router.use('/protected/test-cases', testCasesRoutes);
router.use('/protected/executions', executionsRoutes);
router.use('/protected/analysis', analysisRoutes);
router.use('/protected/sitemaps', sitemapsRoutes);

export default router;
