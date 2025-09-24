// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import publicRoutes from './routes/public.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Docker frontend
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', routes);
app.use('/api', publicRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Playwright AI Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/crawl-and-generate`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
