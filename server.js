const express = require('express');
const cors = require('cors');
const path = require('path');

// Import all challenges
const authChallenge = require('./challenge/auth-challenge-01');
const asyncChallenge = require('./challenge/async-challenge-02');
const middlewareChallenge = require('./challenge/middleware-challenge-03');
const securityChallenge = require('./challenge/security-challenge-04');
const restChallenge = require('./challenge/rest-challenge-05');
const performanceChallenge = require('./challenge/performance-challenge-06');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount all challenges under their own routes
app.use('/api/challenge-01', authChallenge);
app.use('/api/challenge-02', asyncChallenge);
app.use('/api/challenge-03', middlewareChallenge);
app.use('/api/challenge-04', securityChallenge);
app.use('/api/challenge-05', restChallenge);
app.use('/api/challenge-06', performanceChallenge);

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Express.js Debugging Challenges API',
    version: '1.0.0',
    event: 'Africell Code Fast 2025',
    description: 'Centralized server for all debugging challenges',
    challenges: [
      {
        id: 1,
        name: 'Authentication & Security',
        difficulty: 'Medium',
        baseUrl: '/api/challenge-01',
        endpoints: [
          'POST /api/register',
          'POST /api/login',
          'GET /api/profile',
          'DELETE /api/users/:id'
        ]
      },
      {
        id: 2,
        name: 'Async Operations & Race Conditions',
        difficulty: 'Hard',
        baseUrl: '/api/challenge-02',
        endpoints: [
          'GET /api/products',
          'GET /api/products/:id',
          'POST /api/orders',
          'PATCH /api/products/:id/stock',
          'GET /api/orders/:id',
          'DELETE /api/orders/:id',
          'POST /api/products/bulk-update'
        ]
      },
      {
        id: 3,
        name: 'Middleware & Request Validation',
        difficulty: 'Medium',
        baseUrl: '/api/challenge-03',
        endpoints: [
          'GET /api/public',
          'GET /api/protected',
          'GET /api/admin',
          'POST /api/products',
          'DELETE /api/products/batch',
          'POST /api/upload',
          'POST /api/process'
        ]
      },
      {
        id: 4,
        name: 'Security Vulnerabilities',
        difficulty: 'Very Hard',
        baseUrl: '/api/challenge-04',
        endpoints: [
          'GET /api/articles',
          'GET /api/search',
          'POST /api/articles',
          'GET /api/articles/:id',
          'PATCH /api/articles/:id',
          'GET /api/articles/:id/comments',
          'GET /api/files/:filename',
          'POST /api/verify-token',
          'GET /api/redirect',
          'POST /api/login'
        ]
      },
      {
        id: 5,
        name: 'REST API Design & HTTP Methods',
        difficulty: 'Easy-Medium',
        baseUrl: '/api/challenge-05',
        endpoints: [
          'POST /api/getTasks',
          'GET /api/tasks/:id/complete',
          'POST /api/updateTask/:id',
          'POST /api/tasks',
          'PATCH /api/tasks/:id',
          'DELETE /api/tasks/:id',
          'GET /api/task/:id',
          'POST /api/tasks/:id/assign',
          'PUT /api/tasks/:id/priority',
          'POST /api/tasks/deleteMultiple',
          'POST /api/tasks/:id/archive',
          'POST /api/tasks/filter'
        ]
      },
      {
        id: 6,
        name: 'Performance & Memory Issues',
        difficulty: 'Very Hard',
        baseUrl: '/api/challenge-06',
        endpoints: [
          'GET /api/posts',
          'GET /api/users/:id/activity',
          'GET /api/statistics',
          'GET /api/posts/popular',
          'GET /api/comments',
          'GET /api/search',
          'GET /api/departments',
          'GET /api/analytics',
          'GET /api/health'
        ]
      }
    ],
    documentation: {
      readme: '/docs/readme',
      solutions: '/docs/solutions',
      timeEstimates: '/docs/time-estimates'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    challenges: {
      total: 6,
      active: 6
    }
  });
});

// Challenge info endpoint
app.get('/api/challenges', (req, res) => {
  res.json({
    total: 6,
    challenges: [
      {
        id: 1,
        name: 'Authentication & Security',
        difficulty: 'Medium',
        estimatedTime: {
          junior: '60-90 min',
          mid: '30-45 min',
          senior: '15-25 min'
        },
        bugs: 7,
        baseUrl: '/api/challenge-01',
        status: 'active'
      },
      {
        id: 2,
        name: 'Async Operations & Race Conditions',
        difficulty: 'Hard',
        estimatedTime: {
          junior: '90-120 min',
          mid: '45-60 min',
          senior: '20-30 min'
        },
        bugs: 6,
        baseUrl: '/api/challenge-02',
        status: 'active'
      },
      {
        id: 3,
        name: 'Middleware & Request Validation',
        difficulty: 'Medium',
        estimatedTime: {
          junior: '75-105 min',
          mid: '35-50 min',
          senior: '18-28 min'
        },
        bugs: 8,
        baseUrl: '/api/challenge-03',
        status: 'active'
      },
      {
        id: 4,
        name: 'Security Vulnerabilities',
        difficulty: 'Very Hard',
        estimatedTime: {
          junior: '120-180 min',
          mid: '60-90 min',
          senior: '30-45 min'
        },
        bugs: 10,
        baseUrl: '/api/challenge-04',
        status: 'active'
      },
      {
        id: 5,
        name: 'REST API Design & HTTP Methods',
        difficulty: 'Easy-Medium',
        estimatedTime: {
          junior: '45-75 min',
          mid: '25-40 min',
          senior: '12-20 min'
        },
        bugs: 10,
        baseUrl: '/api/challenge-05',
        status: 'active'
      },
      {
        id: 6,
        name: 'Performance & Memory Issues',
        difficulty: 'Very Hard',
        estimatedTime: {
          junior: '120-180 min',
          mid: '60-90 min',
          senior: '35-50 min'
        },
        bugs: 10,
        baseUrl: '/api/challenge-06',
        status: 'active'
      }
    ]
  });
});

// Documentation endpoints (serve markdown files)
app.get('/docs/readme', (req, res) => {
  res.sendFile(path.join(__dirname, 'README.md'));
});

app.get('/docs/solutions', (req, res) => {
  res.sendFile(path.join(__dirname, 'SOLUTIONS.md'));
});

app.get('/docs/time-estimates', (req, res) => {
  res.sendFile(path.join(__dirname, 'TIME-ESTIMATES.md'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
    hint: 'Visit / for API documentation'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Express.js Debugging Challenges - Central Server     ║');
  console.log('║  Africell Code Fast 2025                               ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(` Server running on: http://localhost:${PORT}`);
  console.log('');
  console.log(' Available Endpoints:');
  console.log(`   → Root API Info:    http://localhost:${PORT}/`);
  console.log(`   → All Challenges:   http://localhost:${PORT}/api/challenges`);
  console.log(`   → Health Check:     http://localhost:${PORT}/health`);
  console.log(`   → Documentation:    http://localhost:${PORT}/docs/readme`);
  console.log('');
  console.log(' Challenge Endpoints:');
  console.log(`   → Challenge 01:     http://localhost:${PORT}/api/challenge-01/*`);
  console.log(`   → Challenge 02:     http://localhost:${PORT}/api/challenge-02/*`);
  console.log(`   → Challenge 03:     http://localhost:${PORT}/api/challenge-03/*`);
  console.log(`   → Challenge 04:     http://localhost:${PORT}/api/challenge-04/*`);
  console.log(`   → Challenge 05:     http://localhost:${PORT}/api/challenge-05/*`);
  console.log(`   → Challenge 06:     http://localhost:${PORT}/api/challenge-06/*`);
  console.log('');
  console.log(' Ready for debugging challenges!');
  console.log('');
});

module.exports = app;